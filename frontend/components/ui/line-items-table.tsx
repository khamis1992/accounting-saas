/**
 * LineItemsTable Component
 *
 * Enhanced line item management with keyboard navigation
 * Features:
 * - Tab to add new row
 * - Enter to save and add new row
 * - Inline editing with validation
 * - Quick delete with undo
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { safeParseFloat, calculateLineItem } from "@/lib/utils/validation";

export interface LineItem {
  id: string;
  lineNumber: number;
  descriptionAr: string;
  descriptionEn: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
  discountPercent: string;
}

interface LineItemsTableProps {
  lines: LineItem[];
  onChange: (lines: LineItem[]) => void;
  currency?: string;
  disabled?: boolean;
  onLineDelete?: (lineId: string) => void;
}

export function LineItemsTable({
  lines,
  onChange,
  currency = "QAR",
  disabled = false,
  onLineDelete,
}: LineItemsTableProps) {
  const [focusedCell, setFocusedCell] = useState<{
    lineIndex: number;
    field: keyof LineItem;
  } | null>(null);

  const tableRef = useRef<HTMLDivElement>(null);

  // Calculate line total
  const calculateLineTotal = useCallback((line: LineItem): number => {
    const result = calculateLineItem(
      line.quantity,
      line.unitPrice,
      line.taxRate,
      line.discountPercent
    );
    return result.total;
  }, []);

  // Update line field
  const updateLine = useCallback(
    (lineIndex: number, field: keyof LineItem, value: string) => {
      const newLines = [...lines];
      newLines[lineIndex] = {
        ...newLines[lineIndex],
        [field]: value,
      };
      onChange(newLines);
    },
    [lines, onChange]
  );

  // Add new line
  const addLine = useCallback(() => {
    const newLine: LineItem = {
      id: Math.random().toString(36).substring(7),
      lineNumber: (lines?.length || 0) + 1,
      descriptionAr: "",
      descriptionEn: "",
      quantity: "1",
      unitPrice: "0",
      taxRate: "0",
      discountPercent: "0",
    };

    onChange([...(lines || []), newLine]);

    // Focus first field of new line after render
    setTimeout(() => {
      setFocusedCell({
        lineIndex: lines.length,
        field: "descriptionEn",
      });
    }, 0);
  }, [lines, onChange]);

  // Remove line
  const removeLine = useCallback(
    (lineIndex: number) => {
      if (lines && lines.length > 1) {
        const newLines = lines.filter((_, i) => i !== lineIndex);
        const renumbered = newLines.map((line, i) => ({
          ...line,
          lineNumber: i + 1,
        }));
        onChange(renumbered);

        onLineDelete?.(lines[lineIndex].id);
      }
    },
    [lines, onChange, onLineDelete]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, lineIndex: number, field: keyof LineItem) => {
      // Tab: move to next field or add new row
      if (e.key === "Tab") {
        const fields: (keyof LineItem)[] = [
          "descriptionEn",
          "descriptionAr",
          "quantity",
          "unitPrice",
          "taxRate",
          "discountPercent",
        ];

        const currentIndex = fields.indexOf(field);

        if (e.shiftKey) {
          // Move to previous field
          if (currentIndex > 0) {
            e.preventDefault();
            setFocusedCell({
              lineIndex,
              field: fields[currentIndex - 1],
            });
          } else if (lineIndex > 0) {
            e.preventDefault();
            setFocusedCell({
              lineIndex: lineIndex - 1,
              field: fields[fields.length - 1],
            });
          }
        } else {
          // Move to next field
          if (currentIndex < fields.length - 1) {
            e.preventDefault();
            setFocusedCell({
              lineIndex,
              field: fields[currentIndex + 1],
            });
          } else if (lineIndex < lines.length - 1) {
            // Move to next line
            e.preventDefault();
            setFocusedCell({
              lineIndex: lineIndex + 1,
              field: fields[0],
            });
          } else {
            // Add new line
            e.preventDefault();
            addLine();
          }
        }
      }

      // Enter: save and move to next line
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (lineIndex < lines.length - 1) {
          setFocusedCell({
            lineIndex: lineIndex + 1,
            field: "descriptionEn",
          });
        } else {
          addLine();
        }
      }

      // Escape: cancel editing
      if (e.key === "Escape") {
        setFocusedCell(null);
      }

      // Ctrl+D: delete current line
      if (e.key === "d" && e.ctrlKey && lines.length > 1) {
        e.preventDefault();
        removeLine(lineIndex);
      }
    },
    [lines, addLine, removeLine]
  );

  // Focus management
  useEffect(() => {
    if (focusedCell) {
      const { lineIndex, field } = focusedCell;
      const input = document.querySelector(
        `[data-line-index="${lineIndex}"][data-field="${field}"]`
      ) as HTMLInputElement;

      if (input) {
        input.focus();
        input.select();
      }
    }
  }, [focusedCell]);

  // Render input cell
  const renderInput = (
    lineIndex: number,
    field: keyof LineItem,
    type: "text" | "number" = "text",
    placeholder?: string,
    dir?: "ltr" | "rtl"
  ) => {
    const line = lines[lineIndex];
    const isFocused = focusedCell?.lineIndex === lineIndex && focusedCell?.field === field;

    return (
      <Input
        type={type}
        step={type === "number" ? "0.01" : undefined}
        value={line[field]}
        onChange={(e) => updateLine(lineIndex, field, e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, lineIndex, field)}
        disabled={disabled}
        placeholder={placeholder}
        dir={dir}
        data-line-index={lineIndex}
        data-field={field}
        className={isFocused ? "ring-2 ring-zinc-400" : ""}
      />
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Line Items</div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addLine}
          disabled={disabled}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Line
          <kbd className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-xs">Tab</kbd>
        </Button>
      </div>

      <div className="rounded-md border" ref={tableRef}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Description (EN)</TableHead>
              <TableHead>Description (AR)</TableHead>
              <TableHead className="w-24">Quantity</TableHead>
              <TableHead className="w-32">Unit Price</TableHead>
              <TableHead className="w-24">Tax %</TableHead>
              <TableHead className="w-24">Discount %</TableHead>
              <TableHead className="w-32">Total</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line, index) => (
              <TableRow key={line.id}>
                <TableCell className="font-mono text-sm">{line.lineNumber}</TableCell>
                <TableCell>
                  {renderInput(index, "descriptionEn", "text", "Description", "ltr")}
                </TableCell>
                <TableCell>{renderInput(index, "descriptionAr", "text", "الوصف", "rtl")}</TableCell>
                <TableCell>{renderInput(index, "quantity", "number", "1")}</TableCell>
                <TableCell>{renderInput(index, "unitPrice", "number", "0.00")}</TableCell>
                <TableCell>{renderInput(index, "taxRate", "number", "0")}</TableCell>
                <TableCell>{renderInput(index, "discountPercent", "number", "0")}</TableCell>
                <TableCell className="text-right font-medium">
                  {currency} {calculateLineTotal(line).toFixed(2)}
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLine(index)}
                    disabled={disabled || lines.length === 1}
                    title="Delete line (Ctrl+D)"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs text-zinc-500">
        <strong>Keyboard shortcuts:</strong> Tab to navigate, Enter to add line, Ctrl+D to delete,
        Escape to cancel
      </div>
    </div>
  );
}
