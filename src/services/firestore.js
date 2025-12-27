import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  writeBatch,
  deleteField,
  setDoc,
} from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { getValidatedRow } from "@/utils/validation"

/**
 * Remove undefined values from an object (Firestore doesn't accept undefined)
 * Converts undefined to null or removes the key entirely
 */
function cleanForFirestore(obj) {
  const cleaned = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      // Skip undefined values - don't include them in the document
      continue
    } else if (value === null) {
      // Keep null values as they are valid in Firestore
      cleaned[key] = null
    } else if (typeof value === 'object' && value !== null && !(value instanceof Date) && !value.toDate) {
      // Recursively clean nested objects (but not Date or Timestamp)
      cleaned[key] = cleanForFirestore(value)
    } else {
      cleaned[key] = value
    }
  }
  return cleaned
}

/**
 * Submit a batch of cases to Firestore
 * Returns { successful, failed, failures, successfulCases }
 */
export async function submitCases(cases, metadata = {}) {
  const user = auth.currentUser
  if (!user) {
    throw new Error("User must be authenticated to submit cases")
  }

  if (!cases || cases.length === 0) {
    return {
      successful: 0,
      failed: 0,
      failures: [],
      successfulCases: [],
    }
  }

  const successful = []
  const failures = []
  const batchSize = 500 // Firestore batch limit

  // Process in batches
  for (let i = 0; i < cases.length; i += batchSize) {
    const batch = writeBatch(db)
    const batchCases = cases.slice(i, Math.min(i + batchSize, cases.length))
    const pendingSuccessful = [] // Track successful items before commit

    for (let j = 0; j < batchCases.length; j++) {
      const caseData = batchCases[j]
      const rowIndex = i + j

      try {
        // Validate the case data
        const validated = getValidatedRow(caseData)
        if (!validated) {
          // Generate specific error message
          let errorReason = "Validation failed"
          
          // Check for specific validation issues
          if (!caseData.case_id) {
            errorReason = "Case ID is required"
          } else if (!caseData.applicant_name || caseData.applicant_name.length < 2) {
            errorReason = "Applicant name must be at least 2 characters"
          } else if (!caseData.dob || !/^\d{4}-\d{2}-\d{2}$/.test(caseData.dob)) {
            errorReason = "Date of birth must be in YYYY-MM-DD format"
          } else if (caseData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(caseData.email)) {
            errorReason = "Invalid email format"
          } else if (!["TAX", "LICENSE", "PERMIT"].includes(caseData.category?.toUpperCase())) {
            errorReason = "Category must be TAX, LICENSE, or PERMIT"
          } else if (caseData.priority && !["LOW", "MEDIUM", "HIGH"].includes(caseData.priority?.toUpperCase())) {
            errorReason = "Priority must be LOW, MEDIUM, or HIGH"
          }
          
          failures.push({
            row: rowIndex + 1,
            data: caseData,
            reason: errorReason,
          })
          continue
        }

        // Create case document - clean data to remove undefined values
        const caseRef = doc(collection(db, "cases"))
        const caseDocument = cleanForFirestore({
          ...validated,
          status: "submitted",
          submittedBy: user.uid,
          submittedByEmail: user.email,
          submittedAt: serverTimestamp(),
          importMetadata: {
            fileName: metadata.fileName || "unknown",
            batchId: metadata.batchId || null,
            chunkIndex: metadata.chunkIndex ?? null,
            rowNumber: rowIndex + 1,
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        batch.set(caseRef, caseDocument)

        // Track for success after commit
        pendingSuccessful.push({
          row: rowIndex + 1,
          caseId: validated.case_id,
          docId: caseRef.id,
          data: caseData,
        })
      } catch (error) {
        failures.push({
          row: rowIndex + 1,
          data: caseData,
          reason: error.message || "Unknown error during preparation",
        })
      }
    }

    // Commit the batch only if there are pending items
    if (pendingSuccessful.length > 0) {
      try {
        await batch.commit()
        // Only add to successful after commit succeeds
        successful.push(...pendingSuccessful)
      } catch (error) {
        
        // Determine error type for better messages
        let errorMessage = "Batch commit failed"
        if (error.code === "permission-denied") {
          errorMessage = "Permission denied - check Firestore rules"
        } else if (error.code === "unavailable") {
          errorMessage = "Service temporarily unavailable"
        } else if (error.code === "resource-exhausted") {
          errorMessage = "Rate limit exceeded - try again later"
        } else if (error.message) {
          errorMessage = `Batch commit failed: ${error.message}`
        }
        
        // Mark all pending items as failed
        pendingSuccessful.forEach((item) => {
          failures.push({
            row: item.row,
            data: item.data,
            reason: errorMessage,
          })
        })
      }
    }
  }

  // Create audit log entry (non-blocking)
  try {
    await addDoc(collection(db, "audit_logs"), {
      type: "case_import",
      userId: user.uid,
      userEmail: user.email,
      timestamp: serverTimestamp(),
      metadata: cleanForFirestore({
        fileName: metadata.fileName || "unknown",
        batchId: metadata.batchId || null,
        chunkIndex: metadata.chunkIndex ?? null,
        totalRows: cases.length,
        successful: successful.length,
        failed: failures.length,
      }),
    })
  } catch (error) {
    // Don't throw - audit log failure shouldn't fail the submission
  }

  return {
    successful: successful.length,
    failed: failures.length,
    failures,
    successfulCases: successful,
  }
}

/**
 * Get paginated cases from Firestore
 */
export async function getCases(options = {}) {
  const {
    pageSize = 20,
    lastDoc = null,
    status = null,
    startDate = null,
    endDate = null,
    assignee = null,
  } = options

  try {
    let q = collection(db, "cases")
    const constraints = []

    // Apply filters
    if (status) {
      constraints.push(where("status", "==", status))
    }
    if (startDate) {
      constraints.push(where("submittedAt", ">=", startDate))
    }
    if (endDate) {
      constraints.push(where("submittedAt", "<=", endDate))
    }
    if (assignee) {
      constraints.push(where("assignedTo", "==", assignee))
    }

    // Order and pagination
    constraints.push(orderBy("submittedAt", "desc"))
    constraints.push(limit(pageSize))

    if (lastDoc) {
      constraints.push(startAfter(lastDoc))
    }

    q = query(q, ...constraints)

    const snapshot = await getDocs(q)
    const cases = []
    snapshot.forEach((doc) => {
      cases.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    return {
      cases,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === pageSize,
    }
  } catch (error) {
    throw error
  }
}

/**
 * Get a single case by ID
 */
export async function getCaseById(caseId) {
  try {
    const docRef = doc(db, "cases", caseId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      }
    } else {
      return null
    }
  } catch (error) {
    throw error
  }
}

/**
 * Update a case
 */
export async function updateCase(caseId, updates) {
  const user = auth.currentUser
  if (!user) {
    throw new Error("User must be authenticated to update cases")
  }

  try {
    const docRef = doc(db, "cases", caseId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
      lastUpdatedBy: user.uid,
    })

    // Create audit log
    await addDoc(collection(db, "audit_logs"), {
      type: "case_update",
      caseId,
      userId: user.uid,
      userEmail: user.email,
      timestamp: serverTimestamp(),
      changes: updates,
    })

    return true
  } catch (error) {
    throw error
  }
}

/**
 * Add a note to a case
 */
export async function addCaseNote(caseId, note) {
  const user = auth.currentUser
  if (!user) {
    throw new Error("User must be authenticated to add notes")
  }

  try {
    await addDoc(collection(db, "cases", caseId, "notes"), {
      content: note,
      createdBy: user.uid,
      createdByEmail: user.email,
      createdAt: serverTimestamp(),
    })

    return true
  } catch (error) {
    throw error
  }
}

/**
 * Get audit logs with pagination
 */
export async function getAuditLogs(options = {}) {
  const { pageSize = 50, lastDoc = null, type = null, userId = null } = options

  try {
    let q = collection(db, "audit_logs")
    const constraints = []

    if (type) {
      constraints.push(where("type", "==", type))
    }
    if (userId) {
      constraints.push(where("userId", "==", userId))
    }

    constraints.push(orderBy("timestamp", "desc"))
    constraints.push(limit(pageSize))

    if (lastDoc) {
      constraints.push(startAfter(lastDoc))
    }

    q = query(q, ...constraints)

    const snapshot = await getDocs(q)
    const logs = []
    snapshot.forEach((doc) => {
      logs.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    return {
      logs,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === pageSize,
    }
  } catch (error) {
    throw error
  }
}

/**
 * Create a batch import record with a specific ID
 */
export async function createBatchImport(metadata) {
  const user = auth.currentUser
  if (!user) {
    throw new Error("User must be authenticated")
  }

  try {
    // Use the provided batchId as the document ID if available
    const batchId = metadata.batchId || Date.now().toString()
    const docRef = doc(db, "batch_imports", batchId)
    
    await setDoc(docRef, {
      ...metadata,
      userId: user.uid,
      userEmail: user.email,
      status: "processing",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return batchId
  } catch (error) {
    throw error
  }
}

/**
 * Update batch import status
 */
export async function updateBatchImport(batchId, updates) {
  try {
    const docRef = doc(db, "batch_imports", batchId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })

    return true
  } catch (error) {
    throw error
  }
}

