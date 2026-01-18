# API Type Definitions - snake_case Migration Summary

## Overview
This document summarizes all changes made to TypeScript API type definitions to use **snake_case** consistently instead of camelCase. All DTO (Data Transfer Object) interfaces and filter interfaces have been updated to match the backend API's snake_case convention.

## Date Type Flexibility
All Date properties in DTOs now accept `Date | string` for maximum flexibility. The API methods automatically handle conversion to ISO strings when making requests.

---

## Files Modified

### 1. `lib/api/purchase-orders.ts`

**DTOs Updated:**

#### `CreatePurchaseOrderDto`
```typescript
// Before: camelCase
vendorId: string;
expectedDeliveryDate?: string;

// After: snake_case
vendor_id: string;
date: Date | string;
expected_delivery_date?: Date | string;
```

#### `UpdatePurchaseOrderDto`
```typescript
// Before: camelCase
vendorId?: string;
expectedDeliveryDate?: string;

// After: snake_case
vendor_id?: string;
date?: Date | string;
expected_delivery_date?: Date | string;
```

**Implementation Changes:**
- `create()` and `update()` methods now map `vendor_id`, `date`, and `expected_delivery_date` properties
- Date properties handle both `Date` and `string` types with automatic ISO conversion

---

### 2. `lib/api/invoices.ts`

**DTOs Updated:**

#### `CreateInvoiceDto`
```typescript
// Before: camelCase
invoiceType: "sales" | "purchase";
partyId: string;
partyType: "customer" | "vendor";
invoiceDate: Date;
dueDate?: Date;
exchangeRate?: number;
attachmentUrl?: string;
lines: Array<{
  lineNumber: number;
  descriptionAr?: string;
  descriptionEn?: string;
  unitPrice: number;
  taxRate: number;
  discountPercent: number;
  accountId?: string;
}>;

// After: snake_case
invoice_type: "sales" | "purchase";
party_id: string;
party_type: "customer" | "vendor";
invoice_date: Date | string;
due_date?: Date | string;
exchange_rate?: number;
attachment_url?: string;
lines: Array<{
  line_number: number;
  description_ar?: string;
  description_en?: string;
  unit_price: number;
  tax_rate: number;
  discount_percent: number;
  account_id?: string;
}>;
```

#### `UpdateInvoiceDto`
```typescript
// Before: camelCase
invoiceDate?: Date;
dueDate?: Date;
exchangeRate?: number;
attachmentUrl?: string;

// After: snake_case
invoice_date?: Date | string;
due_date?: Date | string;
exchange_rate?: number;
attachment_url?: string;
```

#### `InvoiceFilters`
```typescript
// Before: camelCase
invoiceType?: "sales" | "purchase";
partyType?: "customer" | "vendor";
startDate?: string;
endDate?: string;

// After: snake_case
invoice_type?: "sales" | "purchase";
party_type?: "customer" | "vendor";
start_date?: string;
end_date?: string;
```

**Implementation Changes:**
- `getAll()`, `create()`, and `update()` methods updated to use snake_case properties
- Automatic Date/string handling for date fields

---

### 3. `lib/api/payments.ts`

**DTOs Updated:**

#### `CreatePaymentDto`
```typescript
// Before: camelCase
paymentType: "receipt" | "payment";
partyId: string;
partyType: "customer" | "vendor";
paymentDate: Date;
exchangeRate?: number;
paymentMethod: "cash" | "bank_transfer" | "check";
bankAccountId?: string;
referenceNumber?: string;
checkNumber?: string;
checkDate?: Date;
bankName?: string;
allocations: Array<{
  invoiceId: string;
  amount: number;
}>;

// After: snake_case
payment_type: "receipt" | "payment";
party_id: string;
party_type: "customer" | "vendor";
payment_date: Date | string;
exchange_rate?: number;
payment_method: "cash" | "bank_transfer" | "check";
bank_account_id?: string;
reference_number?: string;
check_number?: string;
check_date?: Date | string;
bank_name?: string;
allocations: Array<{
  invoice_id: string;
  amount: number;
}>;
```

#### `UpdatePaymentDto`
```typescript
// Before: camelCase
paymentDate?: Date;
exchangeRate?: number;
paymentMethod?: "cash" | "bank_transfer" | "check";
bankAccountId?: string;
referenceNumber?: string;
checkNumber?: string;
checkDate?: Date;
bankName?: string;

// After: snake_case
payment_date?: Date | string;
exchange_rate?: number;
payment_method?: "cash" | "bank_transfer" | "check";
bank_account_id?: string;
reference_number?: string;
check_number?: string;
check_date?: Date | string;
bank_name?: string;
```

#### `PaymentFilters`
```typescript
// Before: camelCase
paymentType?: "receipt" | "payment";
partyType?: "customer" | "vendor";
startDate?: string;
endDate?: string;

// After: snake_case
payment_type?: "receipt" | "payment";
party_type?: "customer" | "vendor";
start_date?: string;
end_date?: string;
```

**Implementation Changes:**
- All API methods updated to use snake_case property mapping
- Date/string type flexibility added

---

### 4. `lib/api/customers.ts`

**DTOs Updated:**

#### `CreateCustomerDto`
```typescript
// Before: camelCase
nameEn: string;
nameAr: string;
vatNumber?: string;
creditLimit?: number;
paymentTermsDays?: number;
isActive?: boolean;

// After: snake_case
name_en: string;
name_ar: string;
vat_number?: string;
credit_limit?: number;
payment_terms_days?: number;
is_active?: boolean;
```

#### `UpdateCustomerDto`
```typescript
// Before: camelCase
nameEn?: string;
nameAr?: string;
vatNumber?: string;
creditLimit?: number;
paymentTermsDays?: number;
isActive?: boolean;

// After: snake_case
name_en?: string;
name_ar?: string;
vat_number?: string;
credit_limit?: number;
payment_terms_days?: number;
is_active?: boolean;
```

#### `CustomerFilters`
```typescript
// Before: camelCase
isActive?: boolean;

// After: snake_case
is_active?: boolean;
```

**Implementation Changes:**
- `getAll()`, `create()`, and `update()` methods updated to use snake_case properties

---

### 5. `lib/api/vendors.ts`

**DTOs Updated:**

#### `CreateVendorDto`
```typescript
// Before: camelCase
nameEn: string;
nameAr: string;
vatNumber?: string;
creditLimit?: number;
paymentTermsDays?: number;
bankName?: string;
bankAccountNumber?: string;
swiftCode?: string;
isActive?: boolean;

// After: snake_case
name_en: string;
name_ar: string;
vat_number?: string;
credit_limit?: number;
payment_terms_days?: number;
bank_name?: string;
bank_account_number?: string;
swift_code?: string;
is_active?: boolean;
```

#### `UpdateVendorDto`
```typescript
// Before: camelCase
nameEn?: string;
nameAr?: string;
vatNumber?: string;
creditLimit?: number;
paymentTermsDays?: number;
bankName?: string;
bankAccountNumber?: string;
swiftCode?: string;
isActive?: boolean;

// After: snake_case
name_en?: string;
name_ar?: string;
vat_number?: string;
credit_limit?: number;
payment_terms_days?: number;
bank_name?: string;
bank_account_number?: string;
swift_code?: string;
is_active?: boolean;
```

#### `VendorFilters`
```typescript
// Before: camelCase
isActive?: boolean;

// After: snake_case
is_active?: boolean;
```

**Implementation Changes:**
- All API methods updated to use snake_case properties

---

### 6. `lib/api/expenses.ts`

**DTOs Updated:**

#### `CreateExpenseDto`
```typescript
// Before: camelCase
date: string;
vendor_name?: string;
vendor_id?: string;

// After: snake_case
date: Date | string;
vendor_name?: string;
vendor_id?: string;
```

#### `UpdateExpenseDto`
```typescript
// Before: camelCase
date?: string;
vendor_name?: string;
vendor_id?: string;

// After: snake_case
date?: Date | string;
vendor_name?: string;
vendor_id?: string;
```

**Implementation Changes:**
- `create()` and `update()` methods now handle Date/string conversion
- Payload transformation added for date field

---

### 7. `lib/api/journals.ts`

**DTOs Updated:**

#### `CreateJournalDto`
```typescript
// Before: camelCase
journalNumber?: string;
journalType: "general" | "sales" | "purchase" | ...;
referenceNumber?: string;
descriptionAr: string;
descriptionEn?: string;
transactionDate: Date;
postingDate?: Date;
exchangeRate?: number;
attachmentUrl?: string;
sourceModule?: string;
sourceId?: string;
lines: Array<{
  lineNumber: number;
  accountId: string;
  descriptionAr?: string;
  descriptionEn?: string;
  costCenterId?: string;
  exchangeRate?: number;
  referenceType?: string;
  referenceId?: string;
}>;

// After: snake_case
journal_number?: string;
journal_type: "general" | "sales" | "purchase" | ...;
reference_number?: string;
description_ar: string;
description_en?: string;
transaction_date: Date | string;
posting_date?: Date | string;
exchange_rate?: number;
attachment_url?: string;
source_module?: string;
source_id?: string;
lines: Array<{
  line_number: number;
  account_id: string;
  description_ar?: string;
  description_en?: string;
  cost_center_id?: string;
  exchange_rate?: number;
  reference_type?: string;
  reference_id?: string;
}>;
```

#### `UpdateJournalDto`
```typescript
// Before: camelCase
descriptionAr?: string;
descriptionEn?: string;
transactionDate?: Date;
postingDate?: Date;
exchangeRate?: number;
attachmentUrl?: string;

// After: snake_case
description_ar?: string;
description_en?: string;
transaction_date?: Date | string;
posting_date?: Date | string;
exchange_rate?: number;
attachment_url?: string;
```

#### `JournalFilters`
```typescript
// Before: camelCase
journalType?: string;
startDate?: string;
endDate?: string;

// After: snake_case
journal_type?: string;
start_date?: string;
end_date?: string;
```

**Implementation Changes:**
- `getAll()`, `create()`, `update()`, and `updateLines()` methods updated
- Comprehensive date/string handling added
- All nested line items updated to use snake_case

---

### 8. `lib/api/banking.ts`

**Function Parameters Updated:**

#### `getTransactions()`
```typescript
// Before: camelCase filters
filters?: {
  startDate?: string;
  endDate?: string;
  type?: "debit" | "credit";
  search?: string;
}

// After: snake_case filters
filters?: {
  start_date?: string;
  end_date?: string;
  type?: "debit" | "credit";
  search?: string;
}
```

#### `startReconciliation()`
```typescript
// Before: camelCase parameters
accountId: string,
statementDate: string,
statementBalance: number

// After: snake_case parameters
accountId: string,
statement_date: string,
statement_balance: number
```

#### `matchTransactions()`
```typescript
// Before: camelCase parameters
reconciliationId: string,
bankTxId: string,
bookTxId: string

// After: snake_case parameters
reconciliationId: string,
bank_transaction_id: string,
book_transaction_id: string
```

**Implementation Changes:**
- Query parameters now use snake_case
- Function parameters standardized to snake_case
- API payload mapping updated

---

### 9. `lib/api/quotations.ts`

**No Changes Required**
The quotations API already uses snake_case consistently in DTOs. This file was reviewed and confirmed to follow the correct pattern:
- `CreateQuotationDto` already uses `customer_id`, `date`, `valid_until`
- `UpdateQuotationDto` already uses snake_case
- `QuotationFilters` already uses `customer_id`, `start_date`, `end_date`

---

### 10. `lib/api/assets.ts`

**No Changes Required**
The assets API already uses snake_case consistently:
- No DTO interfaces with camelCase found
- Function parameters properly map to snake_case in API calls

---

## Common Property Mappings

The following camelCase → snake_case conversions were applied consistently across all APIs:

| camelCase | snake_case |
|-----------|------------|
| `customerId` | `customer_id` |
| `vendorId` | `vendor_id` |
| `partyId` | `party_id` |
| `partyType` | `party_type` |
| `invoiceType` | `invoice_type` |
| `paymentType` | `payment_type` |
| `invoiceDate` | `invoice_date` |
| `dueDate` | `due_date` |
| `paymentDate` | `payment_date` |
| `expectedDeliveryDate` | `expected_delivery_date` |
| `checkDate` | `check_date` |
| `validUntil` | `valid_until` |
| `unitPrice` | `unit_price` |
| `taxRate` | `tax_rate` |
| `exchangeRate` | `exchange_rate` |
| `discountPercent` | `discount_percent` |
| `descriptionAr` | `description_ar` |
| `descriptionEn` | `description_en` |
| `accountId` | `account_id` |
| `bankAccountId` | `bank_account_id` |
| `accountNumber` | `account_number` |
| `bankName` | `bank_name` |
| `bankAccountNumber` | `bank_account_number` |
| `swiftCode` | `swift_code` |
| `iban` | `iban` (unchanged) |
| `vatNumber` | `vat_number` |
| `creditLimit` | `credit_limit` |
| `paymentTermsDays` | `payment_terms_days` |
| `phoneNumber` | `phone_number` |
| `emailAddress` | `email_address` |
| `referenceNumber` | `reference_number` |
| `checkNumber` | `check_number` |
| `lineNumber` | `line_number` |
| `invoiceId` | `invoice_id` |
| `journalNumber` | `journal_number` |
| `journalType` | `journal_type` |
| `transactionDate` | `transaction_date` |
| `postingDate` | `posting_date` |
| `attachmentUrl` | `attachment_url` |
| `sourceModule` | `source_module` |
| `sourceId` | `source_id` |
| `costCenterId` | `cost_center_id` |
| `isActive` | `is_active` |
| `startDate` | `start_date` |
| `endDate` | `end_date` |
| `statementDate` | `statement_date` |
| `statementBalance` | `statement_balance` |
| `bankTransactionId` | `bank_transaction_id` |
| `bookTransactionId` | `book_transaction_id` |
| `reconciliationId` | `reconciliation_id` |

---

## Date Handling Pattern

All date properties in DTOs now use this pattern:

```typescript
// In DTO interfaces
date_field?: Date | string;

// In API methods
const payload = {
  date_field: data.date_field
    ? (typeof data.date_field === 'string'
        ? data.date_field
        : data.date_field.toISOString())
    : undefined
};
```

This provides:
- **Flexibility**: Accept both Date objects and ISO strings
- **Type Safety**: Proper TypeScript typing
- **Compatibility**: Works with both frontend forms and API responses

---

## Breaking Changes

These changes are **breaking** for any code that uses these DTOs. Consumers will need to update:

1. **Form submissions** - Change property names from camelCase to snake_case
2. **Filter objects** - Update filter property names
3. **Type definitions** - Update any local type definitions

**Example Migration:**

```typescript
// Before
const newInvoice: CreateInvoiceDto = {
  invoiceType: "sales",
  partyId: "123",
  invoiceDate: new Date(),
  lines: [{
    lineNumber: 1,
    unitPrice: 100,
    taxRate: 0.15,
  }]
};

// After
const newInvoice: CreateInvoiceDto = {
  invoice_type: "sales",
  party_id: "123",
  invoice_date: new Date(), // or "2024-01-01T00:00:00.000Z"
  lines: [{
    line_number: 1,
    unit_price: 100,
    tax_rate: 0.15,
  }]
};
```

---

## Benefits

1. **Consistency**: All DTOs now match backend API convention
2. **Type Safety**: Strong typing with snake_case throughout
3. **Maintainability**: Clear mapping between frontend and backend
4. **Flexibility**: Date properties accept both Date and string types
5. **Developer Experience**: Predictable property naming

---

## Testing Recommendations

After applying these changes:

1. **Unit Tests**: Update test fixtures to use snake_case
2. **Integration Tests**: Verify API calls work correctly
3. **E2E Tests**: Update form submissions to use snake_case properties
4. **Manual Testing**: Test all create/update forms in the UI

---

## Next Steps

1. Update all UI components that use these DTOs
2. Update form libraries (React Hook Form, Formik, etc.)
3. Update any custom hooks that create DTOs
4. Update test files
5. Run TypeScript compiler to catch any remaining issues

---

## Files Summary

| File | DTOs Updated | Filter Interfaces Updated | Status |
|------|--------------|---------------------------|--------|
| `purchase-orders.ts` | 2 | 1 | ✅ Complete |
| `invoices.ts` | 2 | 1 | ✅ Complete |
| `payments.ts` | 2 | 1 | ✅ Complete |
| `customers.ts` | 2 | 1 | ✅ Complete |
| `vendors.ts` | 2 | 1 | ✅ Complete |
| `expenses.ts` | 2 | 0 | ✅ Complete |
| `journals.ts` | 2 | 1 | ✅ Complete |
| `banking.ts` | 0* | 1 | ✅ Complete |
| `quotations.ts` | 0 | 0 | ✅ Already Correct |
| `assets.ts` | 0 | 0 | ✅ Already Correct |

*Banking has no DTOs, but function parameters were updated for consistency.

---

**Date Created**: 2025-01-17
**Author**: Claude Code
**Version**: 1.0
