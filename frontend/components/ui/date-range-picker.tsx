/**
 * DateRangePicker Component
 *
 * Enhanced date picker with timezone support
 * Features:
 * - Timezone display
 * - UTC normalization
 * - Range validation
 * - Keyboard navigation
 */

"use client";

import { useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDateTimezone } from "@/hooks/use-date-timezone";

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface DateRangePickerProps {
  /** Current date range */
  value: DateRange;
  /** On change callback */
  onChange: (range: DateRange) => void;
  /** Label */
  label?: string;
  /** Required validation */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Show timezone indicator */
  showTimezone?: boolean;
  /** Minimum date (YYYY-MM-DD) */
  minDate?: string;
  /** Maximum date (YYYY-MM-DD) */
  maxDate?: string;
}

export function DateRangePicker({
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  showTimezone = true,
  minDate,
  maxDate,
}: DateRangePickerProps) {
  const { timezoneInfo, formatDate, isInDateRange, parseToUTC } = useDateTimezone();

  const [error, setError] = useState<string | null>(null);

  // Validate date range
  const validateRange = useCallback(
    (startDate: string, endDate: string): string | null => {
      if (!startDate || !endDate) {
        return required ? "Both dates are required" : null;
      }

      const start = parseToUTC(startDate);
      const end = parseToUTC(endDate);

      if (start > end) {
        return "Start date must be before end date";
      }

      if (minDate && start < parseToUTC(minDate)) {
        return `Start date must be after ${formatDate(minDate)}`;
      }

      if (maxDate && end > parseToUTC(maxDate)) {
        return `End date must be before ${formatDate(maxDate)}`;
      }

      return null;
    },
    [required, minDate, maxDate, parseToUTC, formatDate]
  );

  // Handle start date change
  const handleStartDateChange = (newStartDate: string) => {
    const validationError = validateRange(newStartDate, value.endDate);
    setError(validationError);

    if (!validationError) {
      onChange({
        startDate: newStartDate,
        endDate: value.endDate,
      });
    }
  };

  // Handle end date change
  const handleEndDateChange = (newEndDate: string) => {
    const validationError = validateRange(value.startDate, newEndDate);
    setError(validationError);

    if (!validationError) {
      onChange({
        startDate: value.startDate,
        endDate: newEndDate,
      });
    }
  };

  // Quick select presets
  const presets = [
    { label: "Today", days: 0 },
    { label: "Last 7 Days", days: 7 },
    { label: "Last 30 Days", days: 30 },
    { label: "This Month", days: 30 },
    { label: "Last 3 Months", days: 90 },
  ];

  const handlePresetClick = (days: number) => {
    const end = new Date();
    const start = new Date();

    if (days === 0) {
      // Today
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else {
      // Last N days
      start.setDate(start.getDate() - days);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    const startDate = start.toISOString().split("T")[0];
    const endDate = end.toISOString().split("T")[0];

    onChange({ startDate, endDate });
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            type="date"
            value={value.startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            disabled={disabled}
            min={minDate}
            max={maxDate || value.endDate}
            className={error ? "border-red-500" : ""}
          />
        </div>

        <span className="text-zinc-400">to</span>

        <div className="flex-1">
          <Input
            type="date"
            value={value.endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            disabled={disabled}
            min={value.startDate}
            max={maxDate}
            className={error ? "border-red-500" : ""}
          />
        </div>
      </div>

      {showTimezone && (
        <Badge variant="outline" className="text-xs">
          {timezoneInfo.timezone} ({timezoneInfo.offset})
        </Badge>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Quick presets */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => handlePresetClick(preset.days)}
            disabled={disabled}
            className="text-xs rounded-md border border-zinc-200 px-2 py-1 hover:bg-zinc-50 disabled:opacity-50"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
