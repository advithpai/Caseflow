// Web Worker for parsing large CSV files
import Papa from "papaparse"

self.onmessage = (e) => {
  const { file, config } = e.data

  Papa.parse(file, {
    ...config,
    worker: false, // Already in a worker
    complete: (results) => {
      self.postMessage({
        type: "complete",
        data: results.data,
        errors: results.errors,
        meta: results.meta,
      })
    },
    error: (error) => {
      self.postMessage({
        type: "error",
        error: error.message,
      })
    },
    step: (results, parser) => {
      if (config.step) {
        self.postMessage({
          type: "step",
          data: results.data,
          meta: results.meta,
        })
      }
    },
  })
}
