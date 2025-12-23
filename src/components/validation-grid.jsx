"use client";

import { useState, useMemo, useRef } from "react";
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
import { AlertCircle, CheckCircle2, Trash2, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateRow } from "../utils/validation";

export function ValidationGrid({ data, mapping, onDataChange }) {
  const [sorting, setSorting] = useState([]);
  const [filterMode, setFilterMode] = useState("all");
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");

  const parentRef = useRef(null);

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

  const columns = useMemo(() => {
    const requiredFields = Object.keys(mapping);
    const csvColumns = Object.values(mapping);

    return [
      {
        id: "status",
        header: "Status",
        size: 80,
        cell: ({ row }) => {
          const hasErrors = !row.original.isValid;
          return (
            <div className="flex items-center justify-center">
              {hasErrors ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-success" />
              )}
            </div>
          );
        },
      },
      {
        id: "rowNumber",
        header: "#",
        size: 60,
        cell: ({ row }) => (
          <div className="text-muted-foreground">
            {row.original.rowIndex + 1}
          </div>
        ),
      },
      ...csvColumns.map((csvColumn, index) => {
        const requiredField = requiredFields[index];
        return {
          id: csvColumn,
          header: csvColumn,
          accessorFn: (row) => row.data[csvColumn],
          size: 180,
          cell: ({ row }) => {
            const value = row.data[csvColumn];
            const error = row.errors.find((e) => e.field === requiredField);
            const isEditing =
              editingCell?.rowIndex === row.rowIndex &&
              editingCell?.field === csvColumn;

            if (isEditing) {
              return (
                <Input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => {
                    handleCellEdit(row.rowIndex, csvColumn, editValue);
                    setEditingCell(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCellEdit(row.rowIndex, csvColumn, editValue);
                      setEditingCell(null);
                    } else if (e.key === "Escape") {
                      setEditingCell(null);
                    }
                  }}
                  className="h-8"
                />
              );
            }

            return (
              <div
                className={cn(
                  "px-2 py-1 rounded cursor-pointer group flex items-center gap-2",
                  error && "bg-destructive/10 text-destructive"
                )}
                onClick={() => {
                  setEditingCell({ rowIndex: row.rowIndex, field: csvColumn });
                  setEditValue(String(value || ""));
                }}
                title={error?.message}
              >
                <span className="flex-1 truncate">{String(value || "")}</span>
                <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            );
          },
        };
      }),
      {
        id: "actions",
        header: "Actions",
        size: 80,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteRow(row.rowIndex)}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
      },
    ];
  }, [mapping, editingCell, editValue]);

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
    estimateSize: () => 48,
    overscan: 10,
  });

  const handleCellEdit = (rowIndex, field, value) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [field]: value };
    onDataChange(newData);
  };

  const handleDeleteRow = (rowIndex) => {
    const newData = data.filter((_, i) => i !== rowIndex);
    onDataChange(newData);
  };

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
          const phone = String(newRow[phoneColumn]).replace(/[^\d+]/g, "");
          newRow[phoneColumn] = phone.startsWith("+") ? phone : `+${phone}`;
        }
      } else if (type === "default-priority") {
        const priorityColumn = mapping.priority
          ? Object.entries(mapping).find(([k]) => k === "priority")?.[1]
          : null;
        if (priorityColumn && !newRow[priorityColumn]) {
          newRow[priorityColumn] = "medium";
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

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Rows</div>
        </div>
        <div className="p-4 rounded-lg bg-success/10 border border-success/30">
          <div className="text-2xl font-bold text-success">{stats.valid}</div>
          <div className="text-sm text-success-foreground/70">Valid</div>
        </div>
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
          <div className="text-2xl font-bold text-destructive">
            {stats.invalid}
          </div>
          <div className="text-sm text-destructive-foreground/70">Errors</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filterMode} onValueChange={(v) => setFilterMode(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rows</SelectItem>
            <SelectItem value="errors">Errors Only</SelectItem>
            <SelectItem value="valid">Valid Only</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleBulkFix("trim")}
        >
          Trim Whitespace
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleBulkFix("normalize-phone")}
        >
          Normalize Phones
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleBulkFix("default-priority")}
        >
          Set Default Priority
        </Button>
      </div>

      {/* Virtualized Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <div ref={parentRef} className="h-[600px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className="px-4 py-3 text-left font-medium text-muted-foreground border-b border-border"
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
            <tbody>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <tr
                    key={row.id}
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${
                        virtualRow.start - virtualRow.index * virtualRow.size
                      }px)`,
                    }}
                    className="border-b border-border hover:bg-accent/50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                        className="px-4 py-2"
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

      <div className="text-sm text-muted-foreground">
        Showing {filteredRows.length} of {stats.total} rows. Click any cell to
        edit. Press Enter to save, Escape to cancel.
      </div>
    </div>
  );
}
