import { create } from "zustand"
import { persist } from "zustand/middleware"
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth"
import { auth } from "@/lib/firebase"

// Store the unsubscribe function and initialization state
let authUnsubscribe = null
let authInitialized = false

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: true,
      
      // Initialize auth state listener (only once)
      initAuth: () => {
        // If already initialized, just ensure loading is false
        if (authInitialized) {
          const { loading } = get()
          if (loading) {
            set({ loading: false })
          }
          return
        }
        
        authInitialized = true
        
        // Clean up any existing listener
        if (authUnsubscribe) {
          authUnsubscribe()
        }
        
        authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            // Use existing user data from state if available (avoids Firestore calls)
            const currentUser = get().user
            
            // If we already have this user's data, just update loading state
            if (currentUser && currentUser.id === firebaseUser.uid) {
              set({ isAuthenticated: true, loading: false })
              return
            }
            
            // Create user object from Firebase Auth data
            // Check custom claims for role, default to "operator"
            try {
              const tokenResult = await firebaseUser.getIdTokenResult()
              const role = tokenResult.claims.role || "operator"
              
              const user = {
                id: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
                role: role,
              }
              
              set({ user, isAuthenticated: true, loading: false })
            } catch (error) {
              // Fallback to default role if token fetch fails
              const user = {
                id: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
                role: "operator",
              }
              set({ user, isAuthenticated: true, loading: false })
            }
          } else {
            set({ user: null, isAuthenticated: false, loading: false })
          }
        })
      },
      
      login: async (email, password) => {
        try {
          set({ loading: true })
          const userCredential = await signInWithEmailAndPassword(auth, email, password)
          const firebaseUser = userCredential.user
          
          // Get role from custom claims
          const tokenResult = await firebaseUser.getIdTokenResult()
          const role = tokenResult.claims.role || "operator"
          
          // Create user object immediately from Firebase Auth
          const user = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
            role: role,
          }
          
          set({ user, isAuthenticated: true, loading: false })
          return { success: true }
        } catch (error) {
          set({ loading: false })
          
          // Handle specific Firebase errors with user-friendly messages
          let errorMessage = "Failed to sign in. Please check your credentials."
          
          if (error.code === "auth/invalid-credential" || 
              error.code === "auth/wrong-password" || 
              error.code === "auth/user-not-found" ||
              error.message?.includes("INVALID_LOGIN_CREDENTIALS") ||
              error.message?.includes("invalid-credential")) {
            errorMessage = "Invalid email or password. Please sign up first if you don't have an account."
          } else if (error.code === "auth/invalid-email") {
            errorMessage = "Invalid email address. Please check your email format."
          } else if (error.code === "auth/user-disabled") {
            errorMessage = "This account has been disabled. Please contact support."
          } else if (error.code === "auth/too-many-requests") {
            errorMessage = "Too many failed login attempts. Please try again later."
          } else if (error.code === "auth/network-request-failed") {
            errorMessage = "Network error. Please check your internet connection and try again."
          }
          
          return { 
            success: false, 
            error: errorMessage,
            errorCode: error.code
          }
        }
      },
      
      signup: async (email, password, name, role) => {
        try {
          set({ loading: true })
          
          // Step 1: Create user account
          const userCredential = await createUserWithEmailAndPassword(auth, email, password)
          const firebaseUser = userCredential.user
          
          // Step 2: Update display name
          if (name) {
            try {
              await updateProfile(firebaseUser, { displayName: name })
            } catch (profileError) {
              // Continue even if profile update fails
            }
          }
          
          // Step 3: Update auth state immediately (no Firestore dependency)
          const user = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            name: name || firebaseUser.email?.split("@")[0] || "User",
            role: role || "operator",
          }
          
          set({ user, isAuthenticated: true, loading: false })
          
          return { success: true, user }
        } catch (error) {
          set({ loading: false })
          
          // Handle specific Firebase errors
          let errorMessage = error.message || "Failed to create account. Please try again."
          
          if (error.code === "auth/configuration-not-found" || error.message?.includes("configuration-not-found")) {
            errorMessage = "Email/Password authentication is not enabled in Firebase. Please enable it in Firebase Console > Authentication > Sign-in method."
          } else if (error.code === "auth/email-already-in-use") {
            errorMessage = "This email is already registered. Please sign in instead."
          } else if (error.code === "auth/weak-password") {
            errorMessage = "Password is too weak. Please choose a stronger password (at least 6 characters)."
          } else if (error.code === "auth/invalid-email") {
            errorMessage = "Invalid email address. Please check your email format."
          } else if (error.code === "auth/operation-not-allowed") {
            errorMessage = "Email/Password authentication is not enabled. Please enable it in Firebase Console."
          }
          
          return { 
            success: false, 
            error: errorMessage,
            errorCode: error.code
          }
        }
      },
      
      logout: async () => {
        try {
          await firebaseSignOut(auth)
          set({ user: null, isAuthenticated: false, loading: false })
        } catch (error) {
        }
      },
    }),
    { name: "auth-storage" },
  ),
)

export const useCaseStore = create(
  persist(
    (set) => ({
      cases: [],
      currentCase: null,
      addCase: (caseData) => {
        set((state) => ({ cases: [caseData, ...state.cases] }))
      },
      updateCase: (id, updates) => {
        set((state) => ({
          cases: state.cases.map((c) => (c.id === id ? { ...c, ...updates } : c)),
          currentCase: state.currentCase?.id === id ? { ...state.currentCase, ...updates } : state.currentCase,
        }))
      },
      setCurrentCase: (caseId) => {
        set((state) => ({
          currentCase: caseId ? state.cases.find((c) => c.id === caseId) || null : null,
        }))
      },
    }),
    { name: "case-storage" },
  ),
)
