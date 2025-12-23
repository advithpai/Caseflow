"use client"

import { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { SubmitFlow } from "../components/submit-flow"
import { useCaseStore } from "../state/store"

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
      <div className="p-8 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Submit Cases</h1>
        <p className="text-muted-foreground">Final step: Submit your validated data</p>
      </div>

      <SubmitFlow
        data={currentCase.csvData.rows}
        mapping={currentCase.columnMapping}
        onComplete={handleComplete}
        onBack={handleBack}
      />
    </div>
  )
}
