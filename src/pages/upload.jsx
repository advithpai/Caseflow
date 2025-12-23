import { useNavigate } from "react-router-dom"
import { CSVUpload } from "../components/csv-upload"
import { useCaseStore } from "../state/store"

export default function UploadPage() {
  const navigate = useNavigate()
  const addCase = useCaseStore((state) => state.addCase)

  const handleUpload = (file, preview) => {
    const newCase = {
      id: Math.random().toString(36).substring(7),
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
      rowCount: preview.totalRows,
      status: "draft",
      errorCount: 0,
      validCount: 0,
    }

    addCase(newCase)
    navigate(`/mapping/${newCase.id}`)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload CSV</h1>
        <p className="text-muted-foreground">
          Upload a CSV file to begin the validation process. We'll help you map columns and validate data.
        </p>
      </div>

      <CSVUpload onUpload={handleUpload} />
    </div>
  )
}
