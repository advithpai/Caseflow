"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileUp, X } from "lucide-react"
import { cn } from "@/lib/utils"
import Papa from "papaparse"

export function CSVUpload({ onUpload }) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState(null)
  const [fileName, setFileName] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const processFile = useCallback((file) => {
    if (!file.name.endsWith(".csv")) {
      alert("Please upload a CSV file")
      return
    }

    setIsProcessing(true)
    setFileName(file.name)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      preview: 5,
      complete: (results) => {
        const headers = results.meta.fields || []
        const rows = results.data

        // Get total count
        Papa.parse(file, {
          complete: (fullResults) => {
            const totalRows = fullResults.data.length
            const fileSize = (file.size / 1024).toFixed(2) + " KB"

            const previewData = {
              headers,
              rows: rows.slice(0, 5),
              totalRows,
              fileSize,
            }

            setPreview(previewData)
            setIsProcessing(false)
          },
        })
      },
      error: () => {
        alert("Error parsing CSV file")
        setIsProcessing(false)
      },
    })
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        processFile(file)
      }
    },
    [processFile],
  )

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback(
    (e) => {
      const file = e.target.files?.[0]
      if (file) {
        processFile(file)
      }
    },
    [processFile],
  )

  const handleContinue = () => {
    if (preview) {
      const file = new File([], fileName)
      onUpload(file, preview)
    }
  }

  const handleClear = () => {
    setPreview(null)
    setFileName("")
  }

  if (preview) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">{fileName}</h3>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{preview.totalRows.toLocaleString()} rows</span>
                  <span>{preview.fileSize}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-3">Preview (first 5 rows)</h4>
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          {preview.headers.map((header, i) => (
                            <th key={i} className="px-4 py-3 text-left font-medium text-muted-foreground">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.map((row, i) => (
                          <tr key={i} className="border-t border-border">
                            {preview.headers.map((header, j) => (
                              <td key={j} className="px-4 py-3">
                                {row[header] || "-"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClear}>
            Choose Different File
          </Button>
          <Button onClick={handleContinue}>Continue to Mapping</Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-lg p-12 text-center transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50",
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        accept=".csv"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isProcessing}
      />

      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          {isProcessing ? (
            <Upload className="h-8 w-8 text-primary animate-pulse" />
          ) : (
            <FileUp className="h-8 w-8 text-primary" />
          )}
        </div>

        <div className="space-y-2">
          <p className="text-lg font-medium">{isProcessing ? "Processing file..." : "Drop your CSV file here"}</p>
          <p className="text-sm text-muted-foreground">or click to browse</p>
        </div>

        <div className="text-xs text-muted-foreground">Supports CSV files up to 50k rows</div>
      </div>
    </div>
  )
}
