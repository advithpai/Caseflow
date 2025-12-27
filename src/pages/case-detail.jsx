;

import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  FileText,
  Calendar,
  UploadIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { useCaseStore } from "../state/store";
import { createBatchImport, updateBatchImport } from "../services/firestore";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { useState } from "react";

const STATUS_CONFIG = {
  draft: {
    label: "Draft",
    color: "bg-muted text-muted-foreground",
    icon: Clock,
  },
  validating: {
    label: "Validating",
    color: "bg-warning/20 text-warning-foreground",
    icon: Clock,
  },
  invalid: {
    label: "Invalid",
    color: "bg-destructive/20 text-destructive",
    icon: AlertCircle,
  },
  valid: {
    label: "Valid",
    color: "bg-success/20 text-success",
    icon: CheckCircle2,
  },
  submitting: {
    label: "Submitting",
    color: "bg-primary/20 text-primary",
    icon: Clock,
  },
  submitted: {
    label: "Submitted",
    color: "bg-success/20 text-success",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    color: "bg-destructive/20 text-destructive",
    icon: AlertCircle,
  },
};

export default function CaseDetailPage() {
  const { id: caseId } = useParams();
  const navigate = useNavigate();

  const caseItem = useCaseStore((state) =>
    state.cases.find((c) => c.id === caseId)
  );
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleReviewAndSubmit = async () => {
    if (!caseItem) return;
    // Ensure user is signed in before creating batch import
    if (!auth?.currentUser) {
      toast.error("You must be signed in to start submission")
      navigate("/login")
      return
    }

    // Navigate to validation but first create a batch import record
    setSaving(true);
    try {
      const batchId = caseItem.id || Date.now().toString();
      await createBatchImport({
        fileName: caseItem.fileName,
        totalRows: caseItem.rowCount,
        batchId,
      });

      // Try to store raw CSV rows if small, otherwise store a sample
      try {
        const payload = caseItem.csvData?.rows || [];
        const rawJson = JSON.stringify(payload);
        const sizeBytes = typeof Blob !== "undefined" ? new Blob([rawJson]).size : rawJson.length;
        const MAX_BYTES = 900000;

        if (sizeBytes > 0 && sizeBytes < MAX_BYTES && payload.length <= 2000) {
          await updateBatchImport(batchId, {
            rawData: rawJson,
            rawStored: true,
            name: caseItem.fileName,
            rowCount: payload.length,
          });
        } else {
          const sample = payload.slice(0, 100);
          await updateBatchImport(batchId, {
            sampleRows: JSON.stringify(sample),
            rawStored: false,
            name: caseItem.fileName,
            rowCount: payload.length,
          });
        }
      } catch (err) {
        // Non-fatal
      }

      navigate(`/validate/${caseItem.id}`);
    } catch (error) {
      console.error("createBatchImport failed", error)
      toast.error(error.message || "Failed to create batch record")
    } finally {
      setSaving(false);
    }
  };

  if (!caseItem) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="text-center py-8 sm:py-12">
          <p className="text-muted-foreground mb-4">Case not found</p>
          <Button onClick={() => navigate("/cases")}>Back to Cases</Button>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[caseItem.status];
  const StatusIcon = statusConfig.icon;

  const timeline = [
    {
      id: "1",
      type: "upload",
      title: "CSV Uploaded",
      description: `${
        caseItem.fileName
      } uploaded with ${caseItem.rowCount.toLocaleString()} rows`,
      timestamp: caseItem.uploadedAt,
      status: "completed",
    },
  ];

  if (caseItem.columnMapping) {
    timeline.push({
      id: "2",
      type: "mapping",
      title: "Schema Mapped",
      description: "CSV columns mapped to required fields",
      timestamp: caseItem.uploadedAt,
      status: "completed",
    });
  }

  if (
    caseItem.status === "valid" ||
    caseItem.status === "submitted" ||
    caseItem.status === "failed"
  ) {
    timeline.push({
      id: "3",
      type: "validation",
      title: "Data Validated",
      description: `${caseItem.validCount} valid rows, ${caseItem.errorCount} errors`,
      timestamp: caseItem.uploadedAt,
      status: caseItem.errorCount > 0 ? "error" : "completed",
    });
  }

  if (caseItem.status === "submitted" || caseItem.status === "failed") {
    timeline.push({
      id: "4",
      type: "submission",
      title:
        caseItem.status === "submitted"
          ? "Successfully Submitted"
          : "Submission Failed",
      description:
        caseItem.status === "submitted"
          ? `All ${caseItem.validCount} cases submitted successfully`
          : `${caseItem.errorCount} cases failed to submit`,
      timestamp: caseItem.submittedAt || caseItem.uploadedAt,
      status: caseItem.status === "submitted" ? "completed" : "error",
    });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/cases")}
          className="mb-3 sm:mb-4 -ml-2 sm:-ml-3"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cases
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 truncate">
              {caseItem.fileName}
            </h1>
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {new Date(caseItem.uploadedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <span className="hidden xs:inline">•</span>
              <span>{caseItem.rowCount.toLocaleString()} rows</span>
            </div>
          </div>

          <Badge
            className={cn(
              "flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm w-fit",
              statusConfig.color
            )}
          >
            <StatusIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold mb-0.5 sm:mb-1">
                  {caseItem.rowCount.toLocaleString()}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Total Rows</div>
              </CardContent>
            </Card>
            <Card
              className={
                caseItem.validCount > 0 ? "border-success/30 bg-success/5" : ""
              }
            >
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold mb-0.5 sm:mb-1 text-success">
                  {caseItem.validCount}
                </div>
                <div className="text-xs sm:text-sm text-success/70">Valid</div>
              </CardContent>
            </Card>
            <Card
              className={
                caseItem.errorCount > 0
                  ? "border-destructive/30 bg-destructive/5"
                  : ""
              }
            >
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold mb-0.5 sm:mb-1 text-destructive">
                  {caseItem.errorCount}
                </div>
                <div className="text-xs sm:text-sm text-destructive/70">Errors</div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {timeline.map((event, index) => {
                  const isLast = index === timeline.length - 1;
                  const icons = {
                    upload: UploadIcon,
                    mapping: FileText,
                    validation: CheckCircle2,
                    submission: CheckCircle2,
                  };
                  const EventIcon = icons[event.type];

                  return (
                    <div key={event.id} className="flex gap-3 sm:gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center flex-shrink-0",
                            event.status === "completed" &&
                              "bg-success/20 text-success",
                            event.status === "error" &&
                              "bg-destructive/20 text-destructive",
                            event.status === "pending" &&
                              "bg-muted text-muted-foreground"
                          )}
                        >
                          <EventIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        {!isLast && (
                          <div className="w-0.5 flex-1 bg-border mt-2" />
                        )}
                      </div>

                      <div className="flex-1 pb-4 sm:pb-6 min-w-0">
                        <div className="flex items-start justify-between gap-2 sm:gap-4 mb-0.5 sm:mb-1">
                          <h4 className="font-semibold text-sm sm:text-base">{event.title}</h4>
                          <span className="text-2xs sm:text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                            {new Date(event.timestamp).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "numeric",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add notes about this case..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[100px] sm:min-h-[120px]"
              />
              <Button className="mt-3" size="sm">
                Save Note
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 text-sm">
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">Case ID</div>
                <div className="font-mono text-xs sm:text-sm break-all">{caseItem.id}</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">File Name</div>
                <div className="text-xs sm:text-sm break-all">{caseItem.fileName}</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">Uploaded</div>
                <div className="text-xs sm:text-sm">
                  {new Date(caseItem.uploadedAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              {caseItem.submittedAt && (
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">Submitted</div>
                  <div className="text-xs sm:text-sm">
                    {new Date(caseItem.submittedAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {caseItem.status !== "submitted" && (
            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {caseItem.status === "draft" && (
                  <Button
                    className="w-full"
                    onClick={() => navigate(`/mapping/${caseItem.id}`)}
                  >
                    Continue to Mapping
                  </Button>
                )}
                {caseItem.status === "valid" && (
                  <Button
                    className="w-full"
                    onClick={handleReviewAndSubmit}
                    disabled={saving}
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      "Review & Submit"
                    )}
                  </Button>
                )}
                {caseItem.status === "failed" && (
                  <Button
                    className="w-full"
                    onClick={() => navigate(`/submit/${caseItem.id}`)}
                  >
                    Retry Submission
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
