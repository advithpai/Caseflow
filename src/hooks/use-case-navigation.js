import { useNavigate } from "react-router-dom"
import { useCaseStore } from "../state/store"

export function useCaseNavigation(caseId) {
  const navigate = useNavigate()
  const currentCase = useCaseStore((state) => state.cases.find((c) => c.id === caseId))
  const updateCase = useCaseStore((state) => state.updateCase)

  const goToMapping = () => navigate(`/mapping/${caseId}`)
  const goToValidation = () => navigate(`/validate/${caseId}`)
  const goToSubmit = () => navigate(`/submit/${caseId}`)
  const goToCases = () => navigate("/cases")
  const goToUpload = () => navigate("/upload")

  return {
    currentCase,
    updateCase,
    goToMapping,
    goToValidation,
    goToSubmit,
    goToCases,
    goToUpload,
  }
}
