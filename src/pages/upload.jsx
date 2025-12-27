import { useNavigate } from "react-router-dom"
import { CSVUpload } from "../components/csv-upload"
import { useCaseStore } from "../state/store"

export default function UploadPage() {
  const navigate = useNavigate()
  const addCase = useCaseStore((state) => state.addCase)

  const handleUpload = (fileInfo, csvData) => {
    // Generate a unique case ID
    const caseId = `case_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    const newCase = {
      id: caseId,
      fileName: fileInfo.name,
      uploadedAt: new Date().toISOString(),
      rowCount: csvData.totalRows,
      status: "draft",
      errorCount: 0,
      validCount: 0,
      // Store the actual CSV data for validation and submission
      csvData: {
        headers: csvData.headers,
        rows: csvData.allRows, // Store ALL rows, not just preview
      },
    }

    addCase(newCase)
    navigate(`/mapping/${caseId}`)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1.5 sm:mb-2">Upload CSV</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Upload a CSV file to begin the validation process. We'll help you map columns and validate data.
        </p>
      </div>

      <CSVUpload onUpload={handleUpload} />
    </div>
  )
}
