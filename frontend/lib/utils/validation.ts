/**
 * Data Validation and Integrity Utilities
 *
 * CRITICAL: These utilities prevent null reference errors, unsafe calculations,
 * and data corruption in financial operations.
 */

/**
 * Safely parse a string to a number with validation
 * @param value - The value to parse (string, number, or undefined)
 * @param defaultValue - Default value if parsing fails (default: 0)
 * @returns Validated number or default
 *
 * @example
 * safeParseFloat("123.45") // 123.45
 * safeParseFloat("invalid") // 0
 * safeParseFloat(undefined) // 0
 * safeParseFloat("123.45", 100) // 123.45
 * safeParseFloat("invalid", 100) // 100
 */
export function safeParseFloat(
  value: string | number | undefined | null,
  defaultValue: number = 0
): number {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  // If already a number, validate it
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : defaultValue;
  }

  // Parse string
  const parsed = parseFloat(value);

  // Validate result
  if (Number.isNaN(parsed)) {
    return defaultValue;
  }

  if (!Number.isFinite(parsed)) {
    return defaultValue;
  }

  return parsed;
}

/**
 * Safely parse an integer with validation
 * @param value - The value to parse
 * @param defaultValue - Default value if parsing fails (default: 0)
 * @returns Validated integer or default
 */
export function safeParseInt(
  value: string | number | undefined | null,
  defaultValue: number = 0
): number {
  const parsed = safeParseFloat(value, defaultValue);
  return Math.floor(parsed);
}

/**
 * Validate that a number is within a specific range
 * @param value - The value to validate
 * @param min - Minimum allowed value (optional)
 * @param max - Maximum allowed value (optional)
 * @param defaultValue - Default value if out of range (default: 0)
 * @returns Validated number or default
 */
export function safeRange(
  value: number,
  min?: number,
  max?: number,
  defaultValue: number = 0
): number {
  const validated = safeParseFloat(value, defaultValue);

  if (min !== undefined && validated < min) {
    return defaultValue;
  }

  if (max !== undefined && validated > max) {
    return defaultValue;
  }

  return validated;
}

/**
 * Safely access an array element
 * @param array - The array to access
 * @param index - The index to access
 * @param defaultValue - Default value if index is out of bounds
 * @returns Array element or default
 */
export function safeArrayAccess<T>(
  array: T[] | undefined | null,
  index: number,
  defaultValue: T
): T {
  if (!array || !Array.isArray(array)) {
    return defaultValue;
  }

  if (index < 0 || index >= array.length) {
    return defaultValue;
  }

  return array[index];
}

/**
 * Validate payment allocation amounts
 * @param allocations - Array of allocations to validate
 * @param paymentAmount - Total payment amount
 * @param invoices - Map of invoice ID to outstanding amount
 * @returns Object with validation results
 */
export interface AllocationValidation {
  isValid: boolean;
  errors: string[];
  totalAllocated: number;
  remainingAmount: number;
  overAllocations: Array<{
    invoiceId: string;
    allocated: number;
    outstanding: number;
    overAmount: number;
  }>;
}

export function validatePaymentAllocations(
  allocations: Array<{ invoiceId: string; amount: string | number }>,
  paymentAmount: number,
  invoices: Map<string, number>
): AllocationValidation {
  const errors: string[] = [];
  let totalAllocated = 0;
  const overAllocations: AllocationValidation["overAllocations"] = [];

  // Validate payment amount
  const validatedPaymentAmount = safeParseFloat(paymentAmount, 0);

  // Check each allocation
  allocations.forEach((alloc) => {
    const allocatedAmount = safeParseFloat(alloc.amount, 0);
    const outstandingAmount = invoices.get(alloc.invoiceId) || 0;

    totalAllocated += allocatedAmount;

    // Check if allocation exceeds outstanding amount
    if (allocatedAmount > outstandingAmount) {
      overAllocations.push({
        invoiceId: alloc.invoiceId,
        allocated: allocatedAmount,
        outstanding: outstandingAmount,
        overAmount: allocatedAmount - outstandingAmount,
      });
      errors.push(
        `Invoice ${alloc.invoiceId}: Allocated ${allocatedAmount.toFixed(2)} exceeds outstanding ${outstandingAmount.toFixed(2)}`
      );
    }
  });

  // Check if total allocated exceeds payment amount
  if (totalAllocated > validatedPaymentAmount) {
    errors.push(
      `Total allocated (${totalAllocated.toFixed(2)}) exceeds payment amount (${validatedPaymentAmount.toFixed(2)})`
    );
  }

  return {
    isValid: errors.length === 0 && overAllocations.length === 0,
    errors,
    totalAllocated,
    remainingAmount: validatedPaymentAmount - totalAllocated,
    overAllocations,
  };
}

/**
 * Validate invoice line item calculations
 * @param quantity - Item quantity
 * @param unitPrice - Unit price
 * @param taxRate - Tax rate percentage
 * @param discountPercent - Discount percentage
 * @returns Calculated totals with validation
 */
export interface LineItemCalculation {
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
  isValid: boolean;
}

export function calculateLineItem(
  quantity: string | number,
  unitPrice: string | number,
  taxRate: string | number = 0,
  discountPercent: string | number = 0
): LineItemCalculation {
  const validatedQuantity = safeParseFloat(quantity, 0);
  const validatedUnitPrice = safeParseFloat(unitPrice, 0);
  const validatedTaxRate = safeParseFloat(taxRate, 0);
  const validatedDiscount = safeParseFloat(discountPercent, 0);

  // Validate ranges
  const finalQuantity = safeRange(validatedQuantity, 0, undefined, 0);
  const finalUnitPrice = safeRange(validatedUnitPrice, 0, undefined, 0);
  const finalTaxRate = safeRange(validatedTaxRate, 0, 100, 0);
  const finalDiscount = safeRange(validatedDiscount, 0, 100, 0);

  const subtotal = finalQuantity * finalUnitPrice;
  const discountAmount = subtotal * (finalDiscount / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (finalTaxRate / 100);
  const total = taxableAmount + taxAmount;

  return {
    quantity: finalQuantity,
    unitPrice: finalUnitPrice,
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    total,
    isValid: finalQuantity >= 0 && finalUnitPrice >= 0,
  };
}

/**
 * Validate and calculate invoice totals
 * @param lines - Array of line items
 * @returns Calculated totals with validation
 */
export interface InvoiceTotals {
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  totalAmount: number;
  isValid: boolean;
  lineCount: number;
}

export function calculateInvoiceTotals(
  lines: Array<{
    quantity: string | number;
    unitPrice: string | number;
    taxRate?: string | number;
    discountPercent?: string | number;
  }>
): InvoiceTotals {
  if (!lines || !Array.isArray(lines) || lines.length === 0) {
    return {
      subtotal: 0,
      totalDiscount: 0,
      totalTax: 0,
      totalAmount: 0,
      isValid: false,
      lineCount: 0,
    };
  }

  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  let isValid = true;

  lines.forEach((line) => {
    const calculation = calculateLineItem(
      line.quantity,
      line.unitPrice,
      line.taxRate || 0,
      line.discountPercent || 0
    );

    subtotal += calculation.subtotal;
    totalDiscount += calculation.discountAmount;
    totalTax += calculation.taxAmount;

    if (!calculation.isValid) {
      isValid = false;
    }
  });

  const totalAmount = subtotal - totalDiscount + totalTax;

  return {
    subtotal,
    totalDiscount,
    totalTax,
    totalAmount,
    isValid,
    lineCount: lines.length,
  };
}

/**
 * Format currency for display
 * @param amount - Amount to format
 * @param currency - Currency code (default: "QAR")
 * @param locale - Locale for formatting (default: "en-US")
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: string | number | undefined | null,
  currency: string = "QAR",
  locale: string = "en-US"
): string {
  const validatedAmount = safeParseFloat(amount, 0);

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(validatedAmount);
  } catch (error) {
    // Fallback if currency code is invalid
    return `${currency} ${validatedAmount.toFixed(2)}`;
  }
}

/**
 * Clamp a number between min and max values
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  const validated = safeParseFloat(value, min);
  return Math.min(Math.max(validated, min), max);
}

/**
 * Check if a value is a valid positive number
 * @param value - Value to check
 * @returns True if valid positive number
 */
export function isPositiveNumber(value: string | number | undefined | null): boolean {
  const validated = safeParseFloat(value, -1);
  return validated >= 0;
}

/**
 * Safe division with zero check
 * @param numerator - Numerator
 * @param denominator - Denominator
 * @param defaultValue - Default value if division by zero (default: 0)
 * @returns Result or default
 */
export function safeDivide(
  numerator: number,
  denominator: number,
  defaultValue: number = 0
): number {
  const validatedNumerator = safeParseFloat(numerator, 0);
  const validatedDenominator = safeParseFloat(denominator, 0);

  if (validatedDenominator === 0) {
    return defaultValue;
  }

  return validatedNumerator / validatedDenominator;
}

/**
 * Validate and sanitize input for calculations
 * @param value - Input value
 * @param options - Validation options
 * @returns Sanitized value
 */
export interface SanitizeOptions {
  allowNegative?: boolean;
  maxDecimals?: number;
  min?: number;
  max?: number;
  default?: number;
}

export function sanitizeInput(
  value: string | number | undefined | null,
  options: SanitizeOptions = {}
): number {
  const { allowNegative = false, maxDecimals, min, max, default: defaultValue = 0 } = options;

  let result = safeParseFloat(value, defaultValue);

  // Apply min/max constraints
  if (min !== undefined) {
    result = Math.max(result, min);
  }

  if (max !== undefined) {
    result = Math.min(result, max);
  }

  // Apply negative constraint
  if (!allowNegative && result < 0) {
    result = defaultValue;
  }

  // Round to max decimals if specified
  if (maxDecimals !== undefined) {
    const multiplier = Math.pow(10, maxDecimals);
    result = Math.round(result * multiplier) / multiplier;
  }

  return result;
}
