/**
 * Mock API for case submissions
 */

// Simulate network delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Submit a batch of cases to the backend
 * Simulates success/failure randomly for demo purposes
 */
export async function submitCases(cases, batchSize = 50) {
  const results = []

  for (let i = 0; i < cases.length; i += batchSize) {
    const batch = cases.slice(i, i + batchSize)

    // Simulate API call delay
    await delay(500)

    // Process each case in the batch
    const batchResults = batch.map((caseData, index) => {
      // 85% success rate for demo
      const success = Math.random() > 0.15

      return {
        id: caseData.id || `case-${Date.now()}-${i + index}`,
        status: success ? "success" : "failed",
        data: caseData,
        error: success ? null : getRandomError(),
        timestamp: new Date().toISOString(),
      }
    })

    results.push(...batchResults)
  }

  return results
}

/**
 * Retry failed submissions
 */
export async function retryCases(failedCases) {
  await delay(500)

  return failedCases.map((caseData) => {
    // 70% success rate on retry
    const success = Math.random() > 0.3

    return {
      id: caseData.id,
      status: success ? "success" : "failed",
      data: caseData,
      error: success ? null : getRandomError(),
      timestamp: new Date().toISOString(),
    }
  })
}

/**
 * Get random error message for demo
 */
function getRandomError() {
  const errors = ["Network timeout", "Invalid data format", "Duplicate case ID", "Server error", "Rate limit exceeded"]
  return errors[Math.floor(Math.random() * errors.length)]
}

/**
 * Fetch cases list (mock)
 */
export async function fetchCases(filters = {}) {
  await delay(300)

  // Return mock cases
  return {
    cases: generateMockCases(20),
    total: 100,
    page: filters.page || 1,
  }
}

/**
 * Fetch single case details (mock)
 */
export async function fetchCaseById(id) {
  await delay(200)

  return {
    id,
    caseNumber: `CASE-${id.slice(-6).toUpperCase()}`,
    status: ["pending", "in-progress", "completed", "failed"][Math.floor(Math.random() * 4)],
    fileName: "customer-data.csv",
    uploadDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    totalRows: Math.floor(Math.random() * 10000) + 100,
    validRows: Math.floor(Math.random() * 8000) + 100,
    errorRows: Math.floor(Math.random() * 500),
    submittedRows: Math.floor(Math.random() * 8000),
    timeline: generateTimeline(),
    notes: [],
  }
}

function generateMockCases(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `case-${Date.now()}-${i}`,
    caseNumber: `CASE-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    fileName: `data-file-${i + 1}.csv`,
    status: ["pending", "in-progress", "completed", "failed"][Math.floor(Math.random() * 4)],
    totalRows: Math.floor(Math.random() * 10000) + 100,
    uploadDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }))
}

function generateTimeline() {
  const now = Date.now()
  return [
    {
      event: "File Uploaded",
      timestamp: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
      user: "admin@example.com",
    },
    {
      event: "Schema Mapped",
      timestamp: new Date(now - 3.5 * 60 * 60 * 1000).toISOString(),
      user: "admin@example.com",
    },
    {
      event: "Validation Completed",
      timestamp: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      user: "admin@example.com",
    },
    {
      event: "Submission Started",
      timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      user: "admin@example.com",
    },
  ]
}
