"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  RefreshCw,
  Loader2,
  FileText,
  XCircle,
  Rocket,
} from "lucide-react";
import { submitCases, createBatchImport, updateBatchImport } from "../services/firestore";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { t } from "../i18n";

const CHUNK_SIZE = 50;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const SubmitFlow = ({ data, mapping, onComplete, onBack, fileName }) => {
  const [status, setStatus] = useState("ready");
  const [progress, setProgress] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [result, setResult] = useState(null);
  const [batchId, setBatchId] = useState(null);
  const abortControllerRef = useRef(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const mapRowData = useCallback(
    (row) => {
      const mappedRow = {};
      Object.entries(mapping).forEach(([requiredField, csvColumn]) => {
        mappedRow[requiredField] = row[csvColumn];
      });
      return mappedRow;
    },
    [mapping]
  );

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const submitChunkWithRetry = async (chunk, chunkIndex, batchId, retries = 0) => {
    try {
      const result = await submitCases(chunk, {
        fileName: "imported-cases.csv",
        batchId: batchId,
        chunkIndex: chunkIndex,
      });
      return result;
    } catch (error) {
      if (retries < MAX_RETRIES) {
        await sleep(RETRY_DELAY * (retries + 1));
        return submitChunkWithRetry(chunk, chunkIndex, batchId, retries + 1);
      }
      throw error;
    }
  };

  const handleSubmit = async () => {
    // Ensure user is authenticated before attempting Firestore writes
    if (!auth?.currentUser) {
      toast.error(t("submit.authRequired" || "You must be signed in to submit"));
      return;
    }

    setStatus("submitting");
    setProgress(0);
    setCurrentChunk(0);
    abortControllerRef.current = new AbortController();

    try {
      if (!data || data.length === 0) {
        toast.error("No data to submit. Please go back and ensure data is loaded.");
        setStatus("ready");
        return;
      }

      

      const newBatchId = Date.now().toString();
      setBatchId(newBatchId);

      try {
        await createBatchImport({
          fileName: fileName || "imported-cases.csv",
          totalRows: data.length,
          batchId: newBatchId,
        });
      } catch (auditError) {
        console.error("createBatchImport failed", auditError);
        toast.error(t("submit.batchCreateFailed", { message: auditError.message || "Failed to create batch record" }));
      }

      const mappedData = data.map(mapRowData);

      const chunks = [];
      for (let i = 0; i < mappedData.length; i += CHUNK_SIZE) {
        chunks.push({
          data: mappedData.slice(i, i + CHUNK_SIZE),
          startIndex: i,
        });
      }

      setTotalChunks(chunks.length);

      let allSuccessful = [];
      let allFailures = [];

      for (let i = 0; i < chunks.length; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error("Submission cancelled");
        }

        const chunk = chunks[i];
        setCurrentChunk(i + 1);

        try {
          const chunkResult = await submitChunkWithRetry(
            chunk.data,
            i,
            newBatchId
          );

          const adjustedSuccesses = (chunkResult.successfulCases || []).map((s) => ({
            ...s,
            row: chunk.startIndex + s.row,
          }));

          const adjustedFailures = (chunkResult.failures || []).map((f) => ({
            ...f,
            row: chunk.startIndex + f.row,
          }));

          allSuccessful = [...allSuccessful, ...adjustedSuccesses];
          allFailures = [...allFailures, ...adjustedFailures];
        } catch (error) {
          chunk.data.forEach((_, j) => {
            allFailures.push({
              row: chunk.startIndex + j + 1,
              reason: error.message || t("submit.chunkFailed"),
              data: chunk.data[j],
            });
          });
        }

        const progressPercent = Math.round(((i + 1) / chunks.length) * 100);
        setProgress(progressPercent);

        if (i < chunks.length - 1) {
          await sleep(100);
        }
      }

      const submitResult = {
        total: data.length,
        successful: allSuccessful.length,
        failed: allFailures.length,
        failures: allFailures,
        successfulCases: allSuccessful,
        batchId: newBatchId,
        completedAt: new Date().toISOString(),
      };

      try {
        await updateBatchImport(newBatchId, {
          status: allFailures.length === 0 ? "completed" : "partial",
          successful: allSuccessful.length,
          failed: allFailures.length,
        });
      } catch (auditError) {
        console.error("updateBatchImport failed", auditError);
        toast.error(t("submit.batchUpdateFailed", { message: auditError.message || "Failed to update batch record" }));
      }

      // Attempt to store the raw CSV data (or a small sample) on the batch record
      try {
        const payload = data || []
        const rawJson = JSON.stringify(payload)
        const sizeBytes = typeof Blob !== "undefined" ? new Blob([rawJson]).size : rawJson.length

        // Firestore document size limit ~1MB; be conservative
        const MAX_BYTES = 900000
        if (sizeBytes > 0 && sizeBytes < MAX_BYTES && payload.length <= 2000) {
          await updateBatchImport(newBatchId, {
            rawData: rawJson,
            rawStored: true,
            name: fileName || "imported-cases.csv",
            rowCount: payload.length,
          })
        } else {
          // Store a small sample and metadata instead
          const sample = payload.slice(0, 100)
          await updateBatchImport(newBatchId, {
            sampleRows: JSON.stringify(sample),
            rawStored: false,
            name: fileName || "imported-cases.csv",
            rowCount: payload.length,
          })
        }
      } catch (storeError) {
        // Non-fatal: don't disrupt user flow if storing raw data fails
      }

      setResult(submitResult);
      setStatus("complete");
      onComplete(submitResult);

      if (allFailures.length === 0) {
        toast.success(t("submit.allSuccessful", { count: allSuccessful.length }));
      } else if (allSuccessful.length > 0) {
        toast.warning(
          t("submit.partialSuccess", {
            success: allSuccessful.length,
            failed: allFailures.length,
          })
        );
      } else {
        toast.error(t("submit.allFailed"));
      }
    } catch (error) {
      toast.error(t("submit.error", { message: error.message || "Unknown error occurred" }));
      setStatus("ready");
      setProgress(0);
    }
  };

  const handleRetryFailures = async () => {
    if (!result || result.failures.length === 0) return;

    setIsRetrying(true);
    setStatus("submitting");
    setProgress(0);

    try {
      const retryData = result.failures.map((f) => f.data).filter(Boolean);

      if (retryData.length === 0) {
        toast.error(t("submit.noDataToRetry"));
        setStatus("complete");
        setIsRetrying(false);
        return;
      }

      const chunks = [];
      for (let i = 0; i < retryData.length; i += CHUNK_SIZE) {
        chunks.push({
          data: retryData.slice(i, i + CHUNK_SIZE),
          startIndex: i,
        });
      }

      setTotalChunks(chunks.length);

      let retrySuccessful = [];
      let retryFailures = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        setCurrentChunk(i + 1);

        try {
          const chunkResult = await submitChunkWithRetry(
            chunk.data,
            i,
            batchId + "-retry"
          );

          retrySuccessful = [
            ...retrySuccessful,
            ...(chunkResult.successfulCases || []),
          ];
          retryFailures = [...retryFailures, ...(chunkResult.failures || [])];
        } catch (error) {
          chunk.data.forEach((rowData, j) => {
            retryFailures.push({
              row: j + 1,
              reason: error.message || t("submit.retryFailed"),
              data: rowData,
            });
          });
        }

        setProgress(Math.round(((i + 1) / chunks.length) * 100));

        if (i < chunks.length - 1) {
          await sleep(100);
        }
      }

      const newResult = {
        ...result,
        successful: result.successful + retrySuccessful.length,
        failed: retryFailures.length,
        failures: retryFailures,
      };

      setResult(newResult);
      setStatus("complete");
      onComplete(newResult);

      if (retryFailures.length === 0) {
        toast.success(t("submit.retryAllSuccessful"));
      } else {
        toast.warning(
          t("submit.retryPartialSuccess", {
            success: retrySuccessful.length,
            failed: retryFailures.length,
          })
        );
      }
    } catch (error) {
      toast.error(t("submit.retryError", { message: error.message }));
      setStatus("complete");
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDownloadErrors = () => {
    if (!result || result.failures.length === 0) return;

    const headers = ["Row", "Error", ...Object.keys(mapping)];
    const csvRows = [
      headers.join(","),
      ...result.failures.map((f) => {
        const rowData = f.data || {};
        const values = [
          f.row,
          `"${(f.reason || "Unknown error").replace(/"/g, '""')}"`,
          ...Object.entries(mapping).map(([field]) => {
            const value = rowData[field] || "";
            return `"${String(value).replace(/"/g, '""')}"`;
          }),
        ];
        return values.join(",");
      }),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-errors-${result.batchId || Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(t("submit.errorReportDownloaded"));
  };

  const handleDownloadReport = () => {
    if (!result) return;

    const report = {
      summary: {
        batchId: result.batchId,
        completedAt: result.completedAt,
        totalRows: result.total,
        successful: result.successful,
        failed: result.failed,
        successRate: ((result.successful / result.total) * 100).toFixed(2) + "%",
      },
      failures: result.failures.map((f) => ({
        row: f.row,
        reason: f.reason,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-report-${result.batchId || Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Ready state
  if (status === "ready") {
    return (
      <div className="space-y-4 sm:space-y-6 animate-fade-in" role="region" aria-label={t("submit.readyRegion")}>
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="text-center space-y-4 sm:space-y-5">
              <div
                className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto"
                aria-hidden="true"
              >
                <Rocket className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">{t("submit.ready")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("submit.readyDescription", { count: data.length.toLocaleString() })}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-sm mx-auto">
                  <div>
                    <div className="font-medium text-foreground">{t("submit.batchSize")}</div>
                    <div>{CHUNK_SIZE} {t("submit.rowsPerBatch")}</div>
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{t("submit.totalBatches")}</div>
                    <div>{Math.ceil(data.length / CHUNK_SIZE)}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse sm:flex-row justify-between gap-3" role="navigation" aria-label={t("submit.navigation")}>
          <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
            {t("common.back")}
          </Button>
          <Button
            onClick={handleSubmit}
            size="lg"
            aria-describedby="submit-description"
            className="w-full sm:w-auto"
          >
            {t("submit.startSubmission")}
          </Button>
        </div>
        <p id="submit-description" className="sr-only">
          {t("submit.startDescription", { count: data.length })}
        </p>
      </div>
    );
  }

  // Submitting state
  if (status === "submitting") {
    const processedRows = currentChunk * CHUNK_SIZE;
    const remainingRows = Math.max(0, data.length - processedRows);

    return (
      <div
        className="space-y-4 sm:space-y-6 animate-fade-in"
        role="status"
        aria-live="polite"
        aria-label={t("submit.submittingRegion")}
      >
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="space-y-5 sm:space-y-6">
              <div className="text-center space-y-2 sm:space-y-3">
                <Loader2
                  className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-primary animate-spin"
                  aria-hidden="true"
                />
                <h3 className="text-lg sm:text-xl font-semibold">
                  {isRetrying ? t("submit.retrying") : t("submit.submitting")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("submit.pleaseWait")}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span>{t("submit.progress")}</span>
                  <span className="font-medium" aria-live="polite">
                    {progress}%
                  </span>
                </div>
                <Progress
                  value={progress}
                  className="h-2 sm:h-3"
                  aria-label={t("submit.progressLabel", { progress })}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center text-xs sm:text-sm">
                <div className="p-2.5 sm:p-3 bg-muted/50 rounded-lg">
                  <div className="font-semibold text-base sm:text-lg">{currentChunk}</div>
                  <div className="text-muted-foreground text-xs">{t("submit.currentBatch")}</div>
                </div>
                <div className="p-2.5 sm:p-3 bg-muted/50 rounded-lg">
                  <div className="font-semibold text-base sm:text-lg">{totalChunks}</div>
                  <div className="text-muted-foreground text-xs">{t("submit.totalBatches")}</div>
                </div>
                <div className="p-2.5 sm:p-3 bg-muted/50 rounded-lg">
                  <div className="font-semibold text-base sm:text-lg">{remainingRows.toLocaleString()}</div>
                  <div className="text-muted-foreground text-xs">{t("submit.remaining")}</div>
                </div>
              </div>

              <div className="text-center text-xs sm:text-sm text-muted-foreground border-t border-border pt-4">
                {t("submit.doNotClose")}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Complete state
  return (
    <div
      className="space-y-4 sm:space-y-6 animate-fade-in"
      role="region"
      aria-label={t("submit.completeRegion")}
    >
      {/* Results Summary */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4" role="group" aria-label={t("submit.resultsSummary")}>
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="text-center">
              <div className="text-xl sm:text-3xl font-bold" aria-label={t("submit.totalRowsLabel")}>
                {result?.total?.toLocaleString()}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">{t("submit.totalRows")}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-success/50 bg-success/5">
          <CardContent className="p-3 sm:p-6">
            <div className="text-center">
              <div
                className="text-xl sm:text-3xl font-bold text-success"
                aria-label={t("submit.successfulLabel")}
              >
                {result?.successful?.toLocaleString()}
              </div>
              <div className="text-xs sm:text-sm text-success/70">{t("submit.successful")}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-3 sm:p-6">
            <div className="text-center">
              <div
                className="text-xl sm:text-3xl font-bold text-destructive"
                aria-label={t("submit.failedLabel")}
              >
                {result?.failed?.toLocaleString()}
              </div>
              <div className="text-xs sm:text-sm text-destructive/70">{t("submit.failed")}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Message */}
      {result && result.failed === 0 && (
        <Card className="border-success/50 bg-success/5">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <CheckCircle2
                className="h-6 w-6 sm:h-8 sm:w-8 text-success flex-shrink-0"
                aria-hidden="true"
              />
              <div>
                <h3 className="font-semibold text-base sm:text-lg">{t("submit.allCasesSuccessful")}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t("submit.allCasesProcessed", { count: result.total })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failures */}
      {result && result.failed > 0 && (
        <Card className="border-destructive/50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
              <AlertCircle
                className="h-5 w-5 sm:h-6 sm:w-6 text-destructive flex-shrink-0"
                aria-hidden="true"
              />
              <div className="flex-1 w-full">
                <h3 className="font-semibold text-base sm:text-lg mb-1">{t("submit.someCasesFailed")}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                  {t("submit.failedDescription", { count: result.failed })}
                </p>

                <div
                  className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto scrollbar-thin"
                  role="list"
                  aria-label={t("submit.errorList")}
                >
                  {result.failures.slice(0, 10).map((failure, i) => (
                    <div
                      key={i}
                      role="listitem"
                      className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm p-2 sm:p-3 rounded-lg bg-background border border-border"
                    >
                      <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <span className="font-mono text-muted-foreground">
                          {t("submit.row")} {failure.row}:
                        </span>
                        <span className="ml-1 sm:ml-2 break-words">{failure.reason}</span>
                      </div>
                    </div>
                  ))}
                  {result.failures.length > 10 && (
                    <div
                      className="text-xs sm:text-sm text-muted-foreground text-center py-2"
                      aria-live="polite"
                    >
                      {t("submit.moreErrors", { count: result.failures.length - 10 })}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadErrors}
                    aria-label={t("submit.downloadErrorsAria")}
                    className="text-xs sm:text-sm"
                  >
                    <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" aria-hidden="true" />
                    {t("submit.downloadErrors")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetryFailures}
                    disabled={isRetrying}
                    aria-label={t("submit.retryFailedAria")}
                    className="text-xs sm:text-sm"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 ${isRetrying ? "animate-spin" : ""}`}
                      aria-hidden="true"
                    />
                    {t("submit.retryFailed")}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Report Actions */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
              <div>
                <h4 className="font-medium text-sm sm:text-base">{t("submit.importReport")}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t("submit.importReportDescription")}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadReport}
              aria-label={t("submit.downloadReportAria")}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" aria-hidden="true" />
              {t("submit.downloadReport")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
        <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
          {t("submit.importMore")}
        </Button>
        <Button onClick={() => (window.location.href = "/cases")} className="w-full sm:w-auto">
          {t("submit.viewAllCases")}
        </Button>
      </div>
    </div>
  );
};

export { SubmitFlow };
export default SubmitFlow;
