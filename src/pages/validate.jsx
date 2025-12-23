"use client";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ValidationGrid } from "../components/validation-grid";
import { Button } from "@/components/ui/button";
import { useCaseStore } from "../state/store";

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
      <div className="p-8 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Validate & Fix Data</h1>
          <p className="text-muted-foreground">
            Review validation errors and fix issues before submission
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          <Button onClick={handleContinue}>Continue to Submit</Button>
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
