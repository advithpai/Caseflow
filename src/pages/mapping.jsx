;

import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SchemaMapper } from "@/components/schema-mapper";
import { useCaseStore } from "@/state/store";
import { Loader2 } from "lucide-react";

export default function MappingPage() {
  const navigate = useNavigate();
  const { id: caseId } = useParams();

  const currentCase = useCaseStore((state) =>
    state.cases.find((c) => c.id === caseId)
  );
  const updateCase = useCaseStore((state) => state.updateCase);

  const [headers, setHeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Prevent running multiple times
    if (hasLoadedRef.current) {
      return;
    }

    if (!currentCase) {
      navigate("/upload");
      return;
    }

    // Check if we have actual CSV data from the upload
    if (currentCase.csvData?.headers && currentCase.csvData?.rows?.length > 0) {
      setHeaders(currentCase.csvData.headers);
      setIsLoading(false);
      hasLoadedRef.current = true;
      return;
    }

    // If no CSV data exists, redirect back to upload
    // This ensures we always work with real uploaded data
    navigate("/upload");
  }, [caseId, navigate, currentCase]);

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
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm">Loading CSV data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in">
      <SchemaMapper
        headers={headers}
        onComplete={handleComplete}
        onBack={handleBack}
      />
    </div>
  );
}
