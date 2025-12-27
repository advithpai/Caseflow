

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileUp, X, FileText, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Papa from "papaparse"

export function CSVUpload({ onUpload }) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState(null)
  const [fileName, setFileName] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Store all parsed rows for submission
  const allRowsRef = useRef([])
  const headersRef = useRef([])

  const processFile = useCallback((file) => {
    if (!file.name.endsWith(".csv")) {
      alert("Please upload a CSV file")
      return
    }

    const maxRows = parseInt(import.meta.env.VITE_MAX_CSV_ROWS || "50000")
    
    setIsProcessing(true)
    setFileName(file.name)

    // For large files (> 1MB), use streaming approach
    const isLargeFile = file.size > 1024 * 1024 // 1MB

    if (isLargeFile) {
      // Stream parse for large files
      const allRows = []
      let headers = []
      
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        step: (results, parser) => {
          if (headers.length === 0 && results.meta.fields) {
            headers = results.meta.fields
          }
          allRows.push(results.data)
          
          if (allRows.length > maxRows) {
            parser.abort()
            alert(`File exceeds maximum of ${maxRows.toLocaleString()} rows`)
            setIsProcessing(false)
          }
        },
        complete: () => {
          if (allRows.length <= maxRows) {
            const fileSize = (file.size / 1024).toFixed(2) + " KB"
            
            // Store all rows for later use
            allRowsRef.current = allRows
            headersRef.current = headers

            const previewData = {
              headers,
              previewRows: allRows.slice(0, 5),
              allRows, // Include ALL rows
              totalRows: allRows.length,
              fileSize,
            }

            setPreview(previewData)
            setIsProcessing(false)
          }
        },
        error: () => {
          alert("Error parsing CSV file")
          setIsProcessing(false)
        },
      })
    } else {
      // Small files: parse directly
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || []
          const rows = results.data

          if (rows.length > maxRows) {
            alert(`File exceeds maximum of ${maxRows.toLocaleString()} rows`)
            setIsProcessing(false)
            return
          }

          const fileSize = (file.size / 1024).toFixed(2) + " KB"
          
          // Store all rows for later use
          allRowsRef.current = rows
          headersRef.current = headers

          const previewData = {
            headers,
            previewRows: rows.slice(0, 5),
            allRows: rows, // Include ALL rows
            totalRows: rows.length,
            fileSize,
          }

          setPreview(previewData)
          setIsProcessing(false)
        },
        error: () => {
          alert("Error parsing CSV file")
          setIsProcessing(false)
        },
      })
    }
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
      // Pass file info and the complete parsed data
      const fileInfo = {
        name: fileName,
        size: preview.fileSize,
      }
      
      // Ensure we pass ALL parsed rows, not just preview
      const completeData = {
        ...preview,
        allRows: allRowsRef.current.length > 0 ? allRowsRef.current : preview.allRows,
        headers: headersRef.current.length > 0 ? headersRef.current : preview.headers,
      }
      
      onUpload(fileInfo, completeData)
    }
  }

  const handleClear = () => {
    setPreview(null)
    setFileName("")
    allRowsRef.current = []
    headersRef.current = []
  }

  if (preview) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <Card>
          <CardContent className="p-4 sm:p-6">
            {/* File Info Header */}
            <div className="flex items-start justify-between gap-4 mb-4 sm:mb-6">
              <div className="flex items-start gap-3 min-w-0">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold truncate">{fileName}</h3>
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1">
                    <span>{preview.totalRows.toLocaleString()} rows</span>
                    <span className="hidden xs:inline">•</span>
                    <span>{preview.fileSize}</span>
                    <span className="hidden xs:inline">•</span>
                    <span>{preview.headers.length} columns</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={handleClear} className="flex-shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Preview Table */}
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 text-muted-foreground">
                  Preview (first 5 rows)
                </h4>
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full text-xs sm:text-sm">
                      <thead className="bg-muted">
                        <tr>
                          {preview.headers.map((header, i) => (
                            <th 
                              key={i} 
                              className="px-3 sm:px-4 py-2.5 sm:py-3 text-left font-medium text-muted-foreground whitespace-nowrap"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(preview.previewRows || preview.allRows?.slice(0, 5) || []).map((row, i) => (
                          <tr key={i} className="hover:bg-muted/50 transition-colors">
                            {preview.headers.map((header, j) => (
                              <td 
                                key={j} 
                                className="px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap max-w-[200px] truncate"
                                title={row[header] || "-"}
                              >
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

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Button variant="outline" onClick={handleClear} className="w-full sm:w-auto">
            Choose Different File
          </Button>
          <Button onClick={handleContinue} className="w-full sm:w-auto">
            Continue to Mapping
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-xl transition-all duration-300",
        "p-8 sm:p-12 lg:p-16 text-center",
        isDragging 
          ? "border-primary bg-primary/5 scale-[1.02]" 
          : "border-border hover:border-muted-foreground/50 hover:bg-muted/30",
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

      <div className="flex flex-col items-center gap-4 sm:gap-5">
        <div className={cn(
          "h-14 w-14 sm:h-16 sm:w-16 rounded-full flex items-center justify-center transition-all duration-300",
          isDragging ? "bg-primary/20 scale-110" : "bg-primary/10"
        )}>
          {isProcessing ? (
            <Upload className="h-7 w-7 sm:h-8 sm:w-8 text-primary animate-pulse" />
          ) : (
            <FileUp className={cn(
              "h-7 w-7 sm:h-8 sm:w-8 text-primary transition-transform duration-300",
              isDragging && "scale-110"
            )} />
          )}
        </div>

        <div className="space-y-2">
          <p className="text-base sm:text-lg font-medium">
            {isProcessing ? "Processing file..." : "Drop your CSV file here"}
          </p>
          <p className="text-sm text-muted-foreground">
            or click to browse from your device
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
          <FileText className="h-3.5 w-3.5" />
          <span>Supports CSV files up to 50k rows</span>
        </div>
      </div>
    </div>
  )
}
