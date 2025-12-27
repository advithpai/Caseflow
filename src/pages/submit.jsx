

import { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { SubmitFlow } from "../components/submit-flow"
import { useCaseStore } from "../state/store"
import { Loader2 } from "lucide-react"

export default function SubmitPage() {
  const navigate = useNavigate()
  const { id: caseId } = useParams()

  const currentCase = useCaseStore((state) => state.cases.find((c) => c.id === caseId))
  const updateCase = useCaseStore((state) => state.updateCase)

  useEffect(() => {
    if (!currentCase || !currentCase.csvData || !currentCase.columnMapping) {
      navigate("/upload")
    }
  }, [currentCase, navigate])

  const handleComplete = (result) => {
    updateCase(caseId, {
      status: result.failed === 0 ? "submitted" : "failed",
      validCount: result.successful,
      errorCount: result.failed,
      submittedAt: new Date().toISOString(),
    })
  }

  const handleBack = () => {
    navigate(`/validate/${caseId}`)
  }

  if (!currentCase || !currentCase.csvData || !currentCase.columnMapping) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Submit Cases</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Final step: Submit your validated data</p>
      </div>

      <SubmitFlow
        data={currentCase.csvData.rows}
        mapping={currentCase.columnMapping}
        fileName={currentCase.fileName}
        onComplete={handleComplete}
        onBack={handleBack}
      />
    </div>
  )
}
