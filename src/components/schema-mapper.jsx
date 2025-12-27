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
import { AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const REQUIRED_FIELDS = [
  {
    key: "case_id",
    label: "Case ID",
    description: "Unique identifier for each case",
    required: true,
  },
  {
    key: "applicant_name",
    label: "Applicant Name",
    description: "Full name of the applicant",
    required: true,
  },
  { 
    key: "dob", 
    label: "Date of Birth", 
    description: "Format: YYYY-MM-DD",
    required: true,
  },
  { 
    key: "email", 
    label: "Email", 
    description: "Valid email address",
    required: false,
  },
  { 
    key: "phone", 
    label: "Phone", 
    description: "E.164 format (e.g., +919876543210)",
    required: false,
  },
  { 
    key: "category", 
    label: "Category", 
    description: "TAX, LICENSE, or PERMIT",
    required: true,
  },
  {
    key: "priority",
    label: "Priority",
    description: "LOW, MEDIUM, or HIGH",
    required: false,
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

  const requiredFieldsMapped = REQUIRED_FIELDS.filter(f => f.required).every((field) => mapping[field.key]);
  const mappedCount = Object.keys(mapping).length;
  const autoDetectedCount = autoDetected.size;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Map CSV Columns</h2>
          <p className="text-sm text-muted-foreground">
            Match your CSV columns to the required fields
          </p>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          {autoDetectedCount > 0 && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-success">
              <Sparkles className="h-4 w-4" />
              <span>{autoDetectedCount} auto-detected</span>
            </div>
          )}
          <div className="text-right">
            <div className="text-xl sm:text-2xl font-bold">
              {mappedCount}/{REQUIRED_FIELDS.length}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Fields mapped</div>
          </div>
        </div>
      </div>

      {/* Field Mapping */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Field Mapping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {REQUIRED_FIELDS.map((field, index) => {
            const isMapped = !!mapping[field.key];
            const isAuto = autoDetected.has(field.key);

            return (
              <div
                key={field.key}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border transition-all duration-200",
                  isMapped
                    ? "border-success/50 bg-success/5"
                    : "border-border bg-card hover:border-muted-foreground/30",
                  "animate-fade-in"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Field Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm sm:text-base">{field.label}</span>
                    {field.required && (
                      <Badge variant="outline" size="sm" className="text-2xs">Required</Badge>
                    )}
                    {isMapped && (
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                    )}
                    {!isMapped && field.required && (
                      <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    {isAuto && isMapped && (
                      <Badge variant="secondary" size="sm" className="text-2xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Auto
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {field.description}
                  </p>
                </div>

                {/* Selector */}
                <div className="w-full sm:w-48 md:w-56 lg:w-64 flex-shrink-0">
                  <Select
                    value={mapping[field.key] || ""}
                    onValueChange={(value) =>
                      handleMappingChange(field.key, value)
                    }
                  >
                    <SelectTrigger className={cn(
                      "data-[state=open]:bg-muted/50",
                      isMapped && "border-success/50"
                    )}>
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
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

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3">
        <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
          Back
        </Button>
        <Button 
          onClick={() => onComplete(mapping)} 
          disabled={!requiredFieldsMapped}
          className="w-full sm:w-auto"
        >
          {requiredFieldsMapped
            ? "Continue to Validation"
            : `Map ${REQUIRED_FIELDS.filter(f => f.required && !mapping[f.key]).length} required fields`}
        </Button>
      </div>
    </div>
  );
}
