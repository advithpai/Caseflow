"use client";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SchemaMapper } from "@/components/schema-mapper";
import { useCaseStore } from "@/state/store";
import Papa from "papaparse";

export default function MappingPage() {
  const navigate = useNavigate();
  const { id: caseId } = useParams();

  const currentCase = useCaseStore((state) =>
    state.cases.find((c) => c.id === caseId)
  );
  const updateCase = useCaseStore((state) => state.updateCase);

  const [headers, setHeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentCase) {
      navigate("/upload");
      return;
    }

    const mockData = generateMockCSVData(currentCase.rowCount);
    Papa.parse(mockData, {
      header: true,
      complete: (results) => {
        const parsedHeaders = results.meta.fields || [];
        const rows = results.data;

        setHeaders(parsedHeaders);
        updateCase(caseId, {
          csvData: {
            headers: parsedHeaders,
            rows,
          },
        });
        setIsLoading(false);
      },
    });
  }, [caseId, currentCase, navigate, updateCase]);

  const handleComplete = (mapping) => {
    updateCase(caseId, {
      columnMapping: mapping,
      status: "validating",
    });
    navigate(`/validate/${caseId}`);
  };

  const handleBack = () => {
    navigate("/upload");
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-muted-foreground">Loading CSV data...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <SchemaMapper
        headers={headers}
        onComplete={handleComplete}
        onBack={handleBack}
      />
    </div>
  );
}

function generateMockCSVData(rowCount) {
  const headers = [
    "id",
    "name",
    "birth_date",
    "email_address",
    "telephone",
    "type",
    "urgency",
  ];

  const rows = Array.from({ length: Math.min(rowCount, 100) }, (_, i) => ({
    id: `CASE-${String(i + 1).padStart(5, "0")}`,
    name: `Applicant ${i + 1}`,
    birth_date: `${1970 + (i % 50)}-${String((i % 12) + 1).padStart(
      2,
      "0"
    )}-${String((i % 28) + 1).padStart(2, "0")}`,
    email_address: `applicant${i + 1}@example.com`,
    telephone: `+1-555-${String(i).padStart(4, "0")}`,
    type: ["A", "B", "C", "D"][i % 4],
    urgency: ["low", "medium", "high", "urgent"][i % 4],
  }));

  const csv = [
    headers.join(","),
    ...rows.map((row) => Object.values(row).join(",")),
  ].join("\n");

  return csv;
}
