# Validation Utilities Quick Reference

Quick guide for using the validation utilities in `frontend/lib/utils/validation.ts`.

## Import

```typescript
import {
  safeParseFloat,
  safeParseInt,
  safeRange,
  safeArrayAccess,
  validatePaymentAllocations,
  calculateLineItem,
  calculateInvoiceTotals,
  formatCurrency,
  clamp,
  isPositiveNumber,
  safeDivide,
  sanitizeInput,
} from "@/lib/utils/validation";
```

## Common Patterns

### 1. Parse User Input (Most Common)

**Instead of:**

```typescript
const amount = parseFloat(value); // Can be NaN
```

**Use:**

```typescript
const amount = safeParseFloat(value, 0); // Guaranteed number
```

### 2. Handle Form Data

```typescript
const formData = {
  quantity: "10",
  unitPrice: "100.50",
  taxRate: "15",
  discountPercent: "",
};

// Safe parsing
const validated = {
  quantity: safeParseFloat(formData.quantity, 0),
  unitPrice: safeParseFloat(formData.unitPrice, 0),
  taxRate: safeParseFloat(formData.taxRate, 0),
  discountPercent: safeParseFloat(formData.discountPercent, 0),
};

// All values are valid numbers, no NaN
```

### 3. Calculate Line Totals

```typescript
const lineTotal = calculateLineItem(
  formData.quantity,
  formData.unitPrice,
  formData.taxRate,
  formData.discountPercent
);

// Returns:
// {
//   quantity: 10,
//   unitPrice: 100.50,
//   subtotal: 1005,
//   discountAmount: 100.50,
//   taxableAmount: 904.50,
//   taxAmount: 135.68,
//   total: 1040.18,
//   isValid: true
// }
```

### 4. Validate Payment Allocations

```typescript
// Build invoice map
const invoiceMap = new Map<string, number>();
availableInvoices.forEach((inv) => {
  invoiceMap.set(inv.id, inv.outstanding_amount);
});

// Validate
const validation = validatePaymentAllocations(
  allocations,
  safeParseFloat(paymentAmount, 0),
  invoiceMap
);

// Check results
if (!validation.isValid) {
  // Show errors
  validation.errors.forEach((error) => toast.error(error));
  return;
}

// Access results
console.log("Total allocated:", validation.totalAllocated);
console.log("Remaining:", validation.remainingAmount);

// Check over-allocations
validation.overAllocations.forEach((over) => {
  console.error(`Invoice ${over.invoiceId} over-allocated by ${over.overAmount}`);
});
```

### 5. Calculate Invoice Totals

```typescript
const lines = [
  { quantity: "10", unitPrice: "100", taxRate: "15", discountPercent: "10" },
  { quantity: "5", unitPrice: "50", taxRate: "15", discountPercent: "5" },
];

const totals = calculateInvoiceTotals(lines);

// Returns:
// {
//   subtotal: 1250,
//   totalDiscount: 112.50,
//   totalTax: 170.63,
//   totalAmount: 1308.13,
//   isValid: true,
//   lineCount: 2
// }
```

### 6. Null-Safe Array Operations

**Instead of:**

```typescript
const filtered = items.filter((item) => item.value > 100); // Crashes if items is null
```

**Use:**

```typescript
const filtered = items?.filter((item) => item?.value > 100) || [];
```

### 7. Safe Input Sanitization

```typescript
// Sanitize currency input
const amount = sanitizeInput(userInput, {
  allowNegative: false,
  maxDecimals: 2,
  min: 0,
  max: 1000000,
  default: 0,
});

// Sanitize percentage
const rate = sanitizeInput(userInput, {
  allowNegative: false,
  maxDecimals: 0,
  min: 0,
  max: 100,
  default: 0,
});
```

### 8. Format Currency

```typescript
const formatted = formatCurrency(1234.56, "QAR", "en-US");
// "QAR 1,234.56"

const formatted2 = formatCurrency(invoice.total, invoice.currency);
// Automatically uses correct currency symbol
```

### 9. Check for Valid Numbers

```typescript
// Check if positive
if (isPositiveNumber(value)) {
  // Value is >= 0
}

// Safe division
const result = safeDivide(numerator, denominator, 0);
// Returns 0 if denominator is 0 instead of Infinity
```

## API Reference

### safeParseFloat(value, defaultValue?)

Safely parse a string to a number.

```typescript
safeParseFloat("123.45"); // 123.45
safeParseFloat("invalid"); // 0
safeParseFloat(undefined); // 0
safeParseFloat("123.45", 100); // 123.45
safeParseFloat("invalid", 100); // 100
```

### safeParseInt(value, defaultValue?)

Safely parse an integer (floors the value).

```typescript
safeParseInt("123.99"); // 123
safeParseInt("invalid"); // 0
```

### safeRange(value, min?, max?, defaultValue?)

Validate a number is within range.

```typescript
safeRange(50, 0, 100); // 50
safeRange(-10, 0, 100); // 0 (below min)
safeRange(150, 0, 100); // 0 (above max)
```

### safeArrayAccess(array, index, defaultValue)

Safely access array element.

```typescript
const arr = ["a", "b", "c"];
safeArrayAccess(arr, 1, "default"); // 'b'
safeArrayAccess(arr, 10, "default"); // 'default'
safeArrayAccess(null, 0, "default"); // 'default'
```

### validatePaymentAllocations(allocations, paymentAmount, invoices)

Validate payment allocations against outstanding amounts.

Returns:

```typescript
{
  isValid: boolean,
  errors: string[],
  totalAllocated: number,
  remainingAmount: number,
  overAllocations: Array<{
    invoiceId: string,
    allocated: number,
    outstanding: number,
    overAmount: number
  }>
}
```

### calculateLineItem(quantity, unitPrice, taxRate?, discountPercent?)

Calculate line item totals.

Returns:

```typescript
{
  quantity: number,
  unitPrice: number,
  subtotal: number,
  discountAmount: number,
  taxableAmount: number,
  taxAmount: number,
  total: number,
  isValid: boolean
}
```

### calculateInvoiceTotals(lines)

Calculate invoice totals from line items.

Returns:

```typescript
{
  subtotal: number,
  totalDiscount: number,
  totalTax: number,
  totalAmount: number,
  isValid: boolean,
  lineCount: number
}
```

### formatCurrency(amount, currency?, locale?)

Format number as currency.

```typescript
formatCurrency(1234.56); // "QAR 1,234.56"
formatCurrency(1234.56, "USD"); // "$1,234.56"
formatCurrency(1234.56, "EUR", "de-DE"); // "1.234,56 €"
```

### clamp(value, min, max)

Clamp value between min and max.

```typescript
clamp(50, 0, 100); // 50
clamp(-10, 0, 100); // 0
clamp(150, 0, 100); // 100
```

### isPositiveNumber(value)

Check if value is a valid positive number.

```typescript
isPositiveNumber(100); // true
isPositiveNumber(0); // true
isPositiveNumber(-10); // false
isPositiveNumber("invalid"); // false
```

### safeDivide(numerator, denominator, defaultValue?)

Divide with zero check.

```typescript
safeDivide(100, 2); // 50
safeDivide(100, 0); // 0 (default)
safeDivide(100, 0, -1); // -1 (custom default)
```

### sanitizeInput(value, options?)

Sanitize and validate input.

Options:

```typescript
{
  allowNegative?: boolean,
  maxDecimals?: number,
  min?: number,
  max?: number,
  default?: number
}
```

Example:

```typescript
sanitizeInput("123.456", {
  allowNegative: false,
  maxDecimals: 2,
  min: 0,
  max: 10000,
  default: 0,
}); // 123.46 (rounded to 2 decimals)
```

## Examples by Use Case

### Form Input Handler

```typescript
const handleChange = (field: string, value: string) => {
  // Sanitize based on field type
  let sanitized: string;

  switch (field) {
    case "amount":
    case "unitPrice":
      sanitized = sanitizeInput(value, {
        allowNegative: false,
        maxDecimals: 2,
        min: 0,
      }).toString();
      break;

    case "quantity":
      sanitized = sanitizeInput(value, {
        allowNegative: false,
        maxDecimals: 0,
        min: 1,
      }).toString();
      break;

    case "taxRate":
    case "discountPercent":
      sanitized = sanitizeInput(value, {
        allowNegative: false,
        maxDecimals: 0,
        min: 0,
        max: 100,
      }).toString();
      break;

    default:
      sanitized = value;
  }

  setFormData((prev) => ({ ...prev, [field]: sanitized }));
};
```

### Submit Handler

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Parse and validate all numbers
  const validatedData = {
    quantity: safeParseFloat(formData.quantity, 0),
    unitPrice: safeParseFloat(formData.unitPrice, 0),
    taxRate: safeParseFloat(formData.taxRate, 0),
    discountPercent: safeParseFloat(formData.discountPercent, 0),
  };

  // Check validity
  const lineCalc = calculateLineItem(
    validatedData.quantity,
    validatedData.unitPrice,
    validatedData.taxRate,
    validatedData.discountPercent
  );

  if (!lineCalc.isValid) {
    toast.error("Invalid line item values");
    return;
  }

  // Submit...
};
```

### Display Formatter

```typescript
const formatForDisplay = (amount: string | number, currency: string) => {
  const parsed = safeParseFloat(amount, 0);
  return formatCurrency(parsed, currency);
};

// In component
<td>{formatForDisplay(invoice.total_amount, invoice.currency)}</td>
```

## Best Practices

### 1. Always Use Safe Parsing

```typescript
// ❌ Bad
const amount = parseFloat(input);

// ✅ Good
const amount = safeParseFloat(input, 0);
```

### 2. Validate Before Submit

```typescript
// ❌ Bad - submit without validation
await api.create(data);

// ✅ Good - validate first
if (validatePaymentAllocations(...).isValid) {
  await api.create(data);
}
```

### 3. Provide Defaults

```typescript
// ❌ Bad - might return undefined
const amount = safeParseFloat(input);

// ✅ Good - always has value
const amount = safeParseFloat(input, 0);
```

### 4. Use Null Checks

```typescript
// ❌ Bad - crashes if null
items.map((item) => item.value);

// ✅ Good - handles null
items?.map((item) => item.value) || [];
```

### 5. Sanitize User Input

```typescript
// ❌ Bad - trusts user input
setFormData({ ...formData, amount: value });

// ✅ Good - sanitizes first
const sanitized = sanitizeInput(value, { maxDecimals: 2, min: 0 });
setFormData({ ...formData, amount: sanitized.toString() });
```

## Troubleshooting

### Q: Why is my validation always failing?

A: Make sure you're passing `safeParseFloat()` results, not strings.

```typescript
// ❌ Wrong
validatePaymentAllocations(allocations, "100.50", map);

// ✅ Correct
validatePaymentAllocations(allocations, safeParseFloat("100.50", 0), map);
```

### Q: Why am I getting NaN in calculations?

A: Use `safeParseFloat()` instead of `parseFloat()`.

```typescript
// ❌ Returns NaN
const total = parseFloat("invalid") + 100;

// ✅ Returns 100
const total = safeParseFloat("invalid", 0) + 100;
```

### Q: How do I handle optional fields?

A: Use `||` or `??` with default values.

```typescript
const taxRate = safeParseFloat(line.taxRate || "0", 0);
```

## Testing

### Unit Test Example

```typescript
import { safeParseFloat, calculateLineItem } from "@/lib/utils/validation";

describe("Validation", () => {
  test("safeParseFloat handles invalid input", () => {
    expect(safeParseFloat("invalid")).toBe(0);
    expect(safeParseFloat(undefined)).toBe(0);
    expect(safeParseFloat("123.45")).toBe(123.45);
  });

  test("calculateLineItem returns correct totals", () => {
    const result = calculateLineItem("10", "100", "15", "10");
    expect(result.isValid).toBe(true);
    expect(result.total).toBeCloseTo(1035);
  });
});
```

---

For more details, see the full documentation in `frontend/lib/utils/validation.ts`.
