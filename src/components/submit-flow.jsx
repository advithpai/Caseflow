"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, Download, RefreshCw } from "lucide-react";
import { validateRow } from "../utils/validation";

const SubmitFlow = ({ data, mapping, onComplete, onBack }) => {
  const [status, setStatus] = useState("ready");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    setStatus("submitting");
    setProgress(0);

    const batchSize = 10;
    const batches = Math.ceil(data.length / batchSize);
    const failures = [];

    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, data.length);
      const batch = data.slice(start, end);

      // Mock API submission with random failures
      await new Promise((resolve) => setTimeout(resolve, 300));

      batch.forEach((row, index) => {
        const rowIndex = start + index;

        // Map CSV columns to required fields
        const mappedRow = {};
        Object.entries(mapping).forEach(([requiredField, csvColumn]) => {
          mappedRow[requiredField] = row[csvColumn];
        });

        const errors = validateRow(mappedRow, rowIndex);

        if (errors.length > 0 || Math.random() < 0.05) {
          failures.push({
            row: rowIndex + 1,
            reason: errors[0]?.message || "Network error",
          });
        }
      });

      setProgress(Math.round((end / data.length) * 100));
    }

    const submitResult = {
      total: data.length,
      successful: data.length - failures.length,
      failed: failures.length,
      failures,
    };

    setResult(submitResult);
    setStatus("complete");
    onComplete(submitResult);
  };

  const handleRetryFailures = async () => {
    if (!result || result.failures.length === 0) return;

    setStatus("submitting");
    setProgress(0);

    const failedRows = result.failures.map((f) => f.row - 1);
    const retryData = data.filter((_, i) => failedRows.includes(i));
    const newFailures = [];

    for (let i = 0; i < retryData.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 200));

      const originalIndex = failedRows[i];
      const row = retryData[i];

      // Map and validate
      const mappedRow = {};
      Object.entries(mapping).forEach(([requiredField, csvColumn]) => {
        mappedRow[requiredField] = row[csvColumn];
      });

      const errors = validateRow(mappedRow, originalIndex);

      if (errors.length > 0 || Math.random() < 0.1) {
        newFailures.push({
          row: originalIndex + 1,
          reason: errors[0]?.message || "Network error",
        });
      }

      setProgress(Math.round(((i + 1) / retryData.length) * 100));
    }

    const newResult = {
      total: data.length,
      successful: data.length - newFailures.length,
      failed: newFailures.length,
      failures: newFailures,
    };

    setResult(newResult);
    setStatus("complete");
    onComplete(newResult);
  };

  const handleDownloadErrors = () => {
    if (!result || result.failures.length === 0) return;

    const csvContent = [
      "Row,Reason",
      ...result.failures.map(
        (f) => `${f.row},"${f.reason.replace(/"/g, '""')}"`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "errors.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (status === "ready") {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Ready to Submit</h3>
                <p className="text-muted-foreground">
                  You're about to submit {data.length.toLocaleString()} rows.
                  This process will validate and submit data in batches.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back to Validation
          </Button>
          <Button onClick={handleSubmit} size="lg">
            Start Submission
          </Button>
        </div>
      </div>
    );
  }

  if (status === "submitting") {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">Submitting Cases</h3>
                <p className="text-muted-foreground">
                  Please wait while we process your data...
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Processing in batches of 10 rows. Do not close this window.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{result?.total}</div>
              <div className="text-sm text-muted-foreground">Total Rows</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-success/50 bg-success/5">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-success">
                {result?.successful}
              </div>
              <div className="text-sm text-success-foreground/70">
                Successful
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-destructive">
                {result?.failed}
              </div>
              <div className="text-sm text-destructive-foreground/70">
                Failed
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Message */}
      {result && result.failed === 0 && (
        <Card className="border-success/50 bg-success/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="h-8 w-8 text-success flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg">
                  All Cases Submitted Successfully!
                </h3>
                <p className="text-sm text-muted-foreground">
                  All {result.total} cases have been processed and submitted.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failures */}
      {result && result.failed > 0 && (
        <Card className="border-destructive/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">
                  Some Cases Failed
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {result.failed} cases failed to submit. Review the errors
                  below and retry.
                </p>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.failures.slice(0, 10).map((failure, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 text-sm p-3 rounded-lg bg-background border border-border"
                    >
                      <span className="font-mono text-muted-foreground">
                        Row {failure.row}:
                      </span>
                      <span className="flex-1">{failure.reason}</span>
                    </div>
                  ))}
                  {result.failures.length > 10 && (
                    <div className="text-sm text-muted-foreground text-center py-2">
                      ...and {result.failures.length - 10} more errors
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadErrors}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Error Report
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetryFailures}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Failed Rows
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={() => (window.location.href = "/cases")}>
          View All Cases
        </Button>
      </div>
    </div>
  );
};

export { SubmitFlow };
export default SubmitFlow;
