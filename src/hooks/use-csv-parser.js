

import { useState, useCallback } from "react"
import Papa from "papaparse"

export function useCSVParser() {
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState(null)

  const parseFile = useCallback((file, options = {}) => {
    return new Promise((resolve, reject) => {
      setIsParsing(true)
      setError(null)

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        ...options,
        complete: (results) => {
          setIsParsing(false)
          resolve({
            data: results.data,
            headers: results.meta.fields || [],
            errors: results.errors,
          })
        },
        error: (err) => {
          setIsParsing(false)
          setError(err.message)
          reject(err)
        },
      })
    })
  }, [])

  return { parseFile, isParsing, error }
}
