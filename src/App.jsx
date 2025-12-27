import { Routes, Route, Navigate } from "react-router-dom"
import { useEffect } from "react"
import { Toaster } from "sonner"
import LoginPage from "./pages/login"
import SignupPage from "./pages/signup"
import HomePage from "./pages/home"
import UploadPage from "./pages/upload"
import MappingPage from "./pages/mapping"
import ValidatePage from "./pages/validate"
import SubmitPage from "./pages/submit"
import CasesListPage from "./pages/cases-list"
import CaseDetailPage from "./pages/case-detail"
import AppShell from "./components/app-shell"
import { useAuthStore } from "./state/store"

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  const { initAuth } = useAuthStore()

  // Initialize auth once at app level
  useEffect(() => {
    initAuth()
  }, [])

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="mapping/:id" element={<MappingPage />} />
          <Route path="validate/:id" element={<ValidatePage />} />
          <Route path="submit/:id" element={<SubmitPage />} />
          <Route path="cases" element={<CasesListPage />} />
          <Route path="cases/:id" element={<CaseDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster 
        position="top-right"
        richColors
        closeButton
        duration={4000}
      />
    </>
  )
}
