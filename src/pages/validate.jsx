"use client";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ValidationGrid } from "../components/validation-grid";
import { Button } from "@/components/ui/button";
import { useCaseStore } from "../state/store";
import { Loader2 } from "lucide-react";

export default function ValidatePage() {
  const navigate = useNavigate();
  const { id: caseId } = useParams();

  const currentCase = useCaseStore((state) =>
    state.cases.find((c) => c.id === caseId)
  );
  const updateCase = useCaseStore((state) => state.updateCase);

  const [data, setData] = useState([]);

  useEffect(() => {
    if (!currentCase || !currentCase.csvData || !currentCase.columnMapping) {
      navigate("/upload");
      return;
    }

    setData(currentCase.csvData.rows);
  }, [currentCase, navigate]);

  const handleDataChange = (newData) => {
    setData(newData);
    if (currentCase?.csvData) {
      updateCase(caseId, {
        csvData: {
          ...currentCase.csvData,
          rows: newData,
        },
      });
    }
  };

  const handleContinue = () => {
    updateCase(caseId, {
      status: "valid",
    });
    navigate(`/submit/${caseId}`);
  };

  const handleBack = () => {
    navigate(`/mapping/${caseId}`);
  };

  if (!currentCase || !currentCase.csvData || !currentCase.columnMapping) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Validate & Fix Data</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Review validation errors and fix issues before submission
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Button variant="outline" onClick={handleBack} className="flex-1 sm:flex-none">
            Back
          </Button>
          <Button onClick={handleContinue} className="flex-1 sm:flex-none">
            Continue to Submit
          </Button>
        </div>
      </div>

      <ValidationGrid
        data={data}
        mapping={currentCase.columnMapping}
        onDataChange={handleDataChange}
      />
    </div>
  );
}
