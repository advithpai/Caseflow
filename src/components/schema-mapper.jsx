"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const REQUIRED_FIELDS = [
  {
    key: "case_id",
    label: "Case ID",
    description: "Unique identifier for each case",
  },
  {
    key: "applicant_name",
    label: "Applicant Name",
    description: "Full name of the applicant",
  },
  { key: "dob", label: "Date of Birth", description: "Format: YYYY-MM-DD" },
  { key: "email", label: "Email", description: "Contact email address" },
  { key: "phone", label: "Phone", description: "Contact phone number" },
  { key: "category", label: "Category", description: "Must be A, B, C, or D" },
  {
    key: "priority",
    label: "Priority",
    description: "Must be low, medium, high, or urgent",
  },
];

export function SchemaMapper({ headers, onComplete, onBack }) {
  const [mapping, setMapping] = useState({});
  const [autoDetected, setAutoDetected] = useState(new Set());

  useEffect(() => {
    // Auto-detect matching headers
    const detected = new Set();
    const initialMapping = {};

    REQUIRED_FIELDS.forEach((field) => {
      const matchingHeader = headers.find(
        (h) =>
          h.toLowerCase().replace(/[_\s]/g, "") ===
            field.key.toLowerCase().replace(/[_\s]/g, "") ||
          h.toLowerCase() === field.label.toLowerCase()
      );

      if (matchingHeader) {
        initialMapping[field.key] = matchingHeader;
        detected.add(field.key);
      }
    });

    setMapping(initialMapping);
    setAutoDetected(detected);
  }, [headers]);

  const handleMappingChange = (fieldKey, headerValue) => {
    setMapping((prev) => ({
      ...prev,
      [fieldKey]: headerValue,
    }));
  };

  const isComplete = REQUIRED_FIELDS.every((field) => mapping[field.key]);
  const mappedCount = Object.keys(mapping).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Map CSV Columns</h2>
          <p className="text-muted-foreground">
            Match your CSV columns to the required fields
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">
            {mappedCount}/{REQUIRED_FIELDS.length}
          </div>
          <div className="text-sm text-muted-foreground">Fields mapped</div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Field Mapping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {REQUIRED_FIELDS.map((field) => {
            const isMapped = !!mapping[field.key];
            const isAuto = autoDetected.has(field.key);

            return (
              <div
                key={field.key}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border transition-colors",
                  isMapped
                    ? "border-success/50 bg-success/5"
                    : "border-border bg-card"
                )}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{field.label}</span>
                    {isMapped && (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    )}
                    {!isMapped && (
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    {isAuto && isMapped && (
                      <Badge variant="secondary" className="text-xs">
                        Auto-detected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {field.description}
                  </p>
                </div>

                <div className="w-64">
                  <Select
                    value={mapping[field.key] || ""}
                    onValueChange={(value) =>
                      handleMappingChange(field.key, value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={() => onComplete(mapping)} disabled={!isComplete}>
          {isComplete
            ? "Continue to Validation"
            : `Map ${REQUIRED_FIELDS.length - mappedCount} more fields`}
        </Button>
      </div>
    </div>
  );
}
