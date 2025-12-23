"use client"

import { useRouter } from "next/navigation"
import { useCaseStore } from "../state/store"

export function useCaseNavigation(caseId) {
  const router = useRouter()
  const currentCase = useCaseStore((state) => state.cases.find((c) => c.id === caseId))
  const updateCase = useCaseStore((state) => state.updateCase)

  const goToMapping = () => router.push(`/mapping/${caseId}`)
  const goToValidation = () => router.push(`/validate/${caseId}`)
  const goToSubmit = () => router.push(`/submit/${caseId}`)
  const goToCases = () => router.push("/cases")
  const goToUpload = () => router.push("/upload")

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
