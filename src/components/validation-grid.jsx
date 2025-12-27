"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Trash2, Edit2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateRow } from "../utils/validation";
import { t } from "../i18n";

export function ValidationGrid({ data, mapping, onDataChange }) {
  const [sorting, setSorting] = useState([]);
  const [filterMode, setFilterMode] = useState("all");
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [focusedRow, setFocusedRow] = useState(0);
  const [focusedCol, setFocusedCol] = useState(0);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const parentRef = useRef(null);
  const editInputRef = useRef(null);

  // Reverse mapping: required field -> CSV column
  const reverseMapping = useMemo(() => {
    const reversed = {};
    Object.entries(mapping).forEach(([requiredField, csvColumn]) => {
      reversed[csvColumn] = requiredField;
    });
    return reversed;
  }, [mapping]);

  // Transform and validate data
  const rowsWithValidation = useMemo(() => {
    return data.map((row, index) => {
      // Map CSV columns to required fields
      const mappedRow = {};
      Object.entries(mapping).forEach(([requiredField, csvColumn]) => {
        mappedRow[requiredField] = row[csvColumn];
      });

      const errors = validateRow(mappedRow, index);
      return {
        rowIndex: index,
        data: row,
        errors,
        isValid: errors.length === 0,
      };
    });
  }, [data, mapping]);

  const filteredRows = useMemo(() => {
    if (filterMode === "all") return rowsWithValidation;
    if (filterMode === "errors")
      return rowsWithValidation.filter((r) => !r.isValid);
    return rowsWithValidation.filter((r) => r.isValid);
  }, [rowsWithValidation, filterMode]);

  const handleCellEdit = useCallback((rowIndex, field, value) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [field]: value };
    onDataChange(newData);
  }, [data, onDataChange]);

  const handleDeleteRow = useCallback((rowIndex) => {
    const newData = data.filter((_, i) => i !== rowIndex);
    onDataChange(newData);
  }, [data, onDataChange]);

  // Keyboard navigation handler
  const handleKeyNavigation = useCallback((e, rowIndex, colIndex, csvColumns) => {
    const totalRows = filteredRows.length;
    const totalCols = csvColumns.length + 2;

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        if (rowIndex > 0) {
          setFocusedRow(rowIndex - 1);
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (rowIndex < totalRows - 1) {
          setFocusedRow(rowIndex + 1);
        }
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (colIndex > 0) {
          setFocusedCol(colIndex - 1);
        }
        break;
      case "ArrowRight":
        e.preventDefault();
        if (colIndex < totalCols - 1) {
          setFocusedCol(colIndex + 1);
        }
        break;
      case "Enter":
      case " ":
        if (colIndex >= 2 && colIndex < totalCols - 1) {
          e.preventDefault();
          const csvColumn = csvColumns[colIndex - 2];
          const row = filteredRows[rowIndex];
          const value = row?.data?.[csvColumn];
          setEditingCell({ rowIndex: row.rowIndex, field: csvColumn });
          setEditValue(String(value || ""));
        }
        break;
      case "Delete":
      case "Backspace":
        if (!editingCell && e.ctrlKey) {
          e.preventDefault();
          const row = filteredRows[rowIndex];
          handleDeleteRow(row.rowIndex);
        }
        break;
      case "Escape":
        if (editingCell) {
          setEditingCell(null);
        }
        break;
      default:
        break;
    }
  }, [filteredRows, editingCell, handleDeleteRow]);

  const columns = useMemo(() => {
    const requiredFields = Object.keys(mapping);
    const csvColumns = Object.values(mapping);

    return [
      {
        id: "status",
        header: () => (
          <span className="sr-only">{t("a11y.status")}</span>
        ),
        size: 50,
        cell: ({ row }) => {
          const hasErrors = !row.original.isValid;
          return (
            <div 
              className="flex items-center justify-center"
              role="cell"
              aria-label={hasErrors ? t("a11y.invalid") : t("a11y.valid")}
            >
              {hasErrors ? (
                <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
              )}
            </div>
          );
        },
      },
      {
        id: "rowNumber",
        header: () => (
          <span aria-label={t("a11y.rowNumber")} className="text-xs">#</span>
        ),
        size: 50,
        cell: ({ row }) => (
          <div className="text-muted-foreground text-xs" role="cell">
            {row.original.rowIndex + 1}
          </div>
        ),
      },
      ...csvColumns.map((csvColumn, index) => {
        const requiredField = requiredFields[index];
        return {
          id: csvColumn,
          header: () => (
            <span className="truncate text-xs sm:text-sm">{csvColumn}</span>
          ),
          accessorFn: (row) => row.data?.[csvColumn],
          size: 150,
          cell: ({ row }) => {
            const rowData = row.original;
            const value = rowData?.data?.[csvColumn];
            const error = rowData?.errors?.find((e) => e.field === requiredField);
            const rowIndex = rowData?.rowIndex;
            const isEditing =
              editingCell?.rowIndex === rowIndex &&
              editingCell?.field === csvColumn;

            if (isEditing) {
              return (
                <Input
                  ref={editInputRef}
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => {
                    handleCellEdit(rowIndex, csvColumn, editValue);
                    setEditingCell(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCellEdit(rowIndex, csvColumn, editValue);
                      setEditingCell(null);
                    } else if (e.key === "Escape") {
                      setEditingCell(null);
                    }
                    e.stopPropagation();
                  }}
                  className="h-7 text-xs sm:text-sm"
                  aria-label={`${t("common.edit")} ${csvColumn} ${t("submit.row")} ${rowIndex + 1}`}
                />
              );
            }

            return (
              <div
                className={cn(
                  "px-1.5 sm:px-2 py-1 rounded cursor-pointer group flex items-center gap-1.5",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                  "transition-colors duration-150",
                  error && "bg-destructive/10 text-destructive"
                )}
                onClick={() => {
                  setEditingCell({ rowIndex: rowIndex, field: csvColumn });
                  setEditValue(String(value || ""));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setEditingCell({ rowIndex: rowIndex, field: csvColumn });
                    setEditValue(String(value || ""));
                  }
                }}
                tabIndex={0}
                role="gridcell"
                aria-label={error ? `${value || "empty"} - ${error.message}` : value || "empty"}
                aria-invalid={!!error}
                aria-describedby={error ? `error-${rowIndex}-${csvColumn}` : undefined}
                title={error?.message}
              >
                <span className="flex-1 truncate text-xs sm:text-sm">{String(value || "")}</span>
                <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex-shrink-0" aria-hidden="true" />
                {error && (
                  <span id={`error-${rowIndex}-${csvColumn}`} className="sr-only">
                    {error.message}
                  </span>
                )}
              </div>
            );
          },
        };
      }),
      {
        id: "actions",
        header: () => (
          <span className="sr-only">{t("common.delete")}</span>
        ),
        size: 50,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleDeleteRow(row.original?.rowIndex)}
            className="h-7 w-7 p-0 focus:ring-2 focus:ring-primary opacity-50 hover:opacity-100"
            aria-label={`${t("a11y.deleteRow")} ${row.original?.rowIndex + 1}`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        ),
      },
    ];
  }, [mapping, editingCell, editValue, handleCellEdit, handleDeleteRow]);

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 10,
  });

  const handleBulkFix = (type) => {
    const newData = data.map((row) => {
      const newRow = { ...row };

      if (type === "trim") {
        Object.keys(newRow).forEach((key) => {
          if (typeof newRow[key] === "string") {
            newRow[key] = newRow[key].trim();
          }
        });
      } else if (type === "normalize-phone") {
        const phoneColumn = mapping.phone
          ? Object.entries(mapping).find(([k]) => k === "phone")?.[1]
          : null;
        if (phoneColumn && newRow[phoneColumn]) {
          let phone = String(newRow[phoneColumn]).replace(/[^\d+]/g, "");
          if (phone.length === 10 && !phone.startsWith("+")) {
            phone = `+91${phone}`;
          } else if (!phone.startsWith("+")) {
            phone = `+${phone}`;
          }
          newRow[phoneColumn] = phone;
        }
      } else if (type === "default-priority") {
        const priorityColumn = mapping.priority
          ? Object.entries(mapping).find(([k]) => k === "priority")?.[1]
          : null;
        if (priorityColumn && !newRow[priorityColumn]) {
          newRow[priorityColumn] = "LOW";
        }
      } else if (type === "title-case-names") {
        const nameColumn = mapping.applicant_name
          ? Object.entries(mapping).find(([k]) => k === "applicant_name")?.[1]
          : null;
        if (nameColumn && newRow[nameColumn]) {
          const name = String(newRow[nameColumn]);
          newRow[nameColumn] = name
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim()
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        }
      } else if (type === "uppercase-category") {
        const categoryColumn = mapping.category
          ? Object.entries(mapping).find(([k]) => k === "category")?.[1]
          : null;
        if (categoryColumn && newRow[categoryColumn]) {
          newRow[categoryColumn] = String(newRow[categoryColumn]).toUpperCase();
        }
      }

      return newRow;
    });

    onDataChange(newData);
  };

  const stats = useMemo(() => {
    const total = rowsWithValidation.length;
    const valid = rowsWithValidation.filter((r) => r.isValid).length;
    const invalid = total - valid;
    return { total, valid, invalid };
  }, [rowsWithValidation]);

  const bulkActions = [
    { id: "trim", label: "Trim Whitespace", action: () => handleBulkFix("trim") },
    { id: "title-case", label: "Title Case Names", action: () => handleBulkFix("title-case-names") },
    { id: "normalize-phone", label: "Normalize Phones", action: () => handleBulkFix("normalize-phone") },
    { id: "uppercase-cat", label: "Uppercase Category", action: () => handleBulkFix("uppercase-category") },
    { id: "default-priority", label: "Default Priority", action: () => handleBulkFix("default-priority") },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in" role="region" aria-label={t("validation.title")}>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4" role="group" aria-label={t("validation.totalRows")}>
        <div className="p-3 sm:p-4 rounded-lg bg-card border border-border">
          <div className="text-lg sm:text-2xl font-bold" aria-label={t("validation.totalRows")}>
            {stats.total}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">{t("validation.totalRows")}</div>
        </div>
        <div className="p-3 sm:p-4 rounded-lg bg-success/10 border border-success/30">
          <div className="text-lg sm:text-2xl font-bold text-success" aria-label={t("validation.valid")}>
            {stats.valid}
          </div>
          <div className="text-xs sm:text-sm text-success/70">{t("validation.valid")}</div>
        </div>
        <div className="p-3 sm:p-4 rounded-lg bg-destructive/10 border border-destructive/30">
          <div className="text-lg sm:text-2xl font-bold text-destructive" aria-label={t("validation.errors")}>
            {stats.invalid}
          </div>
          <div className="text-xs sm:text-sm text-destructive/70">{t("validation.errors")}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div 
        className="flex flex-col sm:flex-row items-start sm:items-center gap-3" 
        role="toolbar" 
        aria-label={t("validation.title")}
      >
        <Select value={filterMode} onValueChange={(v) => setFilterMode(v)}>
          <SelectTrigger 
              className="w-full sm:w-[160px] data-[state=open]:bg-muted/50"
              aria-label={t("validation.allRows")}
            >
            <SelectValue />
          </SelectTrigger>
            <SelectContent className="bg-card">
            <SelectItem value="all">{t("validation.allRows")}</SelectItem>
            <SelectItem value="errors">{t("validation.errorsOnly")}</SelectItem>
            <SelectItem value="valid">{t("validation.validOnly")}</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        {/* Mobile: Toggle bulk actions */}
        <div className="lg:hidden w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBulkActions(!showBulkActions)}
            className="w-full"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Bulk Actions
          </Button>
          {showBulkActions && (
            <div className="mt-2 flex flex-wrap gap-2">
              {bulkActions.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  onClick={action.action}
                  className="text-xs"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop: Show all bulk actions */}
        <div className="hidden lg:flex flex-wrap gap-2">
          {bulkActions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              onClick={action.action}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Virtualized Table */}
      <div 
        className="border border-border rounded-lg overflow-hidden bg-card"
        role="grid"
        aria-label={t("validation.title")}
        aria-rowcount={filteredRows.length}
      >
        <div 
          ref={parentRef} 
          className="h-[400px] sm:h-[500px] lg:h-[600px] overflow-auto scrollbar-thin"
          tabIndex={0}
          onKeyDown={(e) => {
            const csvColumns = Object.values(mapping);
            handleKeyNavigation(e, focusedRow, focusedCol, csvColumns);
          }}
          aria-activedescendant={`row-${focusedRow}`}
        >
          <table className="w-full text-xs sm:text-sm">
            <thead className="sticky top-0 bg-muted z-10" role="rowgroup">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} role="row">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize(), minWidth: header.getSize() }}
                      className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-muted-foreground border-b border-border whitespace-nowrap"
                      role="columnheader"
                      scope="col"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody role="rowgroup">
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                const isFocused = virtualRow.index === focusedRow;
                return (
                  <tr
                    key={row.id}
                    id={`row-${virtualRow.index}`}
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${
                        virtualRow.start - virtualRow.index * virtualRow.size
                      }px)`,
                    }}
                    className={cn(
                      "border-b border-border hover:bg-accent/50 transition-colors",
                      isFocused && "ring-2 ring-inset ring-primary"
                    )}
                    role="row"
                    aria-rowindex={virtualRow.index + 1}
                    aria-selected={isFocused}
                    onClick={() => setFocusedRow(virtualRow.index)}
                  >
                    {row.getVisibleCells().map((cell, cellIndex) => (
                      <td
                        key={cell.id}
                        style={{ width: cell.column.getSize(), minWidth: cell.column.getSize() }}
                        className={cn(
                          "px-2 sm:px-4 py-1.5 sm:py-2",
                          isFocused && cellIndex === focusedCol && "bg-primary/10"
                        )}
                        role="gridcell"
                        onClick={() => setFocusedCol(cellIndex)}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs sm:text-sm text-muted-foreground text-center" role="status" aria-live="polite">
        Showing {filteredRows.length} of {stats.total} rows. 
        <span className="hidden sm:inline"> Click any cell to edit. Use arrow keys to navigate.</span>
      </div>
    </div>
  );
}
