import { create } from "zustand"
import { persist } from "zustand/middleware"

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (email) => {
        const user = {
          id: "1",
          email,
          name: email.split("@")[0],
          role: email.includes("admin") ? "admin" : "operator",
        }

        set({ user, isAuthenticated: true })
      },
      logout: () => {
        set({ user: null, isAuthenticated: false })
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
