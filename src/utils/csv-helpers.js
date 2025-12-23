/**
 * Format file size to human readable format
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

/**
 * Detect delimiter in CSV content
 */
export function detectDelimiter(content) {
  const delimiters = [",", ";", "\t", "|"]
  const firstLine = content.split("\n")[0]

  let maxCount = 0
  let detectedDelimiter = ","

  delimiters.forEach((delimiter) => {
    const count = (firstLine.match(new RegExp("\\" + delimiter, "g")) || []).length
    if (count > maxCount) {
      maxCount = count
      detectedDelimiter = delimiter
    }
  })

  return detectedDelimiter
}

/**
 * Parse CSV using Web Worker for better performance
 */
import Papa from "papaparse" // Import PapaParse

export async function parseCSVWithWorker(file) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("../workers/csv-parser.worker.js", import.meta.url))

    worker.onmessage = (e) => {
      const { type, data, errors, meta, error } = e.data

      if (type === "complete") {
        worker.terminate()
        resolve({ data, errors, meta })
      } else if (type === "error") {
        worker.terminate()
        reject(new Error(error))
      }
    }

    worker.onerror = (error) => {
      worker.terminate()
      reject(error)
    }

    worker.postMessage({
      file,
      config: {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      },
    })
  })
}

/**
 * Download data as CSV file
 */
export function downloadCSV(data, filename) {
  const csv = Papa.unparse(data)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
