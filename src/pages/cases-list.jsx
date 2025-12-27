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
  ChevronRight,
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
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Cases</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            View and manage all your case submissions
          </p>
        </div>
        <Link to="/upload" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Upload className="h-4 w-4 mr-2" />
            Upload New
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 sm:gap-3">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
            <SelectTrigger className="w-full sm:w-[150px]">
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
            <SelectTrigger className="w-full sm:w-[150px]">
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
      </div>

      {/* Cases List */}
      {filteredCases.length === 0 ? (
        <Card>
          <CardContent className="p-8 sm:p-12">
            <div className="text-center">
              <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <p className="text-base sm:text-lg font-medium mb-1 sm:mb-2">No cases found</p>
              <p className="text-sm text-muted-foreground mb-4 sm:mb-6">
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
        <div className="space-y-2 sm:space-y-3">
          {filteredCases.map((caseItem, index) => {
            const statusConfig = STATUS_CONFIG[caseItem.status];
            const StatusIcon = statusConfig.icon;

            return (
              <Link 
                key={caseItem.id} 
                to={`/cases/${caseItem.id}`}
                className="block animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card className="transition-all duration-200 hover:border-primary/50 hover:shadow-md cursor-pointer group">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 sm:gap-4 mb-1.5 sm:mb-2">
                          <h3 className="font-semibold text-base sm:text-lg truncate pr-2">
                            {caseItem.fileName}
                          </h3>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge
                              className={cn(
                                "hidden xs:flex items-center gap-1.5 text-xs",
                                statusConfig.color
                              )}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig.label}
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
                          </div>
                        </div>

                        {/* Mobile status badge */}
                        <div className="xs:hidden mb-2">
                          <Badge
                            className={cn(
                              "flex items-center gap-1.5 text-xs w-fit",
                              statusConfig.color
                            )}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
        <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-muted-foreground text-center">
          Showing {filteredCases.length} of {cases.length} cases
        </div>
      )}
    </div>
  );
}
