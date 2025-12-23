"use client";

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  Search,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useCaseStore } from "../state/store";
import { cn } from "@/lib/utils";

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

export default function CasesPage() {
  const cases = useCaseStore((state) => state.cases);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (
        searchQuery &&
        !c.fileName.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      if (statusFilter !== "all" && c.status !== statusFilter) {
        return false;
      }

      if (dateFilter !== "all") {
        const uploadDate = new Date(c.uploadedAt);
        const now = new Date();
        const diffDays = Math.floor(
          (now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (dateFilter === "today" && diffDays > 0) return false;
        if (dateFilter === "week" && diffDays > 7) return false;
        if (dateFilter === "month" && diffDays > 30) return false;
      }

      return true;
    });
  }, [cases, searchQuery, statusFilter, dateFilter]);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Cases</h1>
          <p className="text-muted-foreground">
            View and manage all your case submissions
          </p>
        </div>
        <Link to="/upload">
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload New
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="validating">Validating</SelectItem>
            <SelectItem value="valid">Valid</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={(v) => setDateFilter(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cases List */}
      {filteredCases.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No cases found</p>
              <p className="text-muted-foreground mb-6">
                {cases.length === 0
                  ? "Upload your first CSV to get started"
                  : "Try adjusting your filters"}
              </p>
              {cases.length === 0 && (
                <Link to="/upload">
                  <Button>Upload CSV</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCases.map((caseItem) => {
            const statusConfig = STATUS_CONFIG[caseItem.status];
            const StatusIcon = statusConfig.icon;

            return (
              <Link key={caseItem.id} to={`/cases/${caseItem.id}`}>
                <Card className="transition-all hover:border-primary/50 hover:shadow-md cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="font-semibold text-lg truncate">
                            {caseItem.fileName}
                          </h3>
                          <Badge
                            className={cn(
                              "flex items-center gap-1.5",
                              statusConfig.color
                            )}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {new Date(caseItem.uploadedAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </div>
                          <div>{caseItem.rowCount.toLocaleString()} rows</div>
                          {caseItem.validCount > 0 && (
                            <div className="text-success">
                              {caseItem.validCount} valid
                            </div>
                          )}
                          {caseItem.errorCount > 0 && (
                            <div className="text-destructive">
                              {caseItem.errorCount} errors
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {filteredCases.length > 0 && (
        <div className="mt-6 text-sm text-muted-foreground text-center">
          Showing {filteredCases.length} of {cases.length} cases
        </div>
      )}
    </div>
  );
}
