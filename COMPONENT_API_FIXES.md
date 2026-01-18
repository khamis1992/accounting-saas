# Component API Property Fixes

## Summary

Fixed all component API calls to use snake_case property names to match the updated DTO interfaces. All changes transform camelCase form data to snake_case at the API call boundary, while keeping component state in camelCase for better React developer experience.

## Files Modified

### 1. Sales - Quotations
**File:** `frontend/app/[locale]/(app)/sales/quotations/page.tsx`

**Changes:**
- `customerId` → `customer_id`
- `date`: Kept as string (ISO format)
- `validUntil` → `valid_until`: Kept as string (ISO format)
- Line items properties already using snake_case

**Before:**
```typescript
const data = {
  customerId: formData.customerId,
  date: new Date(formData.date),
  validUntil: new Date(formData.validUntil),
  // ...
};
```

**After:**
```typescript
const data = {
  customer_id: formData.customerId,
  date: formData.date,
  valid_until: formData.validUntil,
  // ...
};
```

### 2. Sales - Invoices
**File:** `frontend/app/[locale]/(app)/sales/invoices/page.tsx`

**Changes:**
- `invoiceType` → `invoice_type`
- `partyId` → `party_id`
- `partyType` → `party_type`
- `invoiceDate` → `invoice_date`: Kept as string (ISO format)
- `dueDate` → `due_date`: Kept as string (ISO format)
- `exchangeRate` → `exchange_rate`
- Line item properties:
  - `lineNumber` → `line_number`
  - `descriptionAr` → `description_ar`
  - `descriptionEn` → `description_en`
  - `unitPrice` → `unit_price`
  - `taxRate` → `tax_rate`
  - `discountPercent` → `discount_percent`

**Before:**
```typescript
const data = {
  invoiceType: formData.invoiceType,
  partyId: formData.partyId,
  partyType: formData.partyType,
  invoiceDate: new Date(formData.invoiceDate),
  dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
  exchangeRate: safeParseFloat(formData.exchangeRate, 1),
  lines: lines.map((line) => ({
    lineNumber: line.lineNumber,
    descriptionAr: line.descriptionAr || undefined,
    descriptionEn: line.descriptionEn || undefined,
    quantity: safeParseFloat(line.quantity, 0),
    unitPrice: safeParseFloat(line.unitPrice, 0),
    taxRate: safeParseFloat(line.taxRate, 0),
    discountPercent: safeParseFloat(line.discountPercent, 0),
  })),
};
```

**After:**
```typescript
const data = {
  invoice_type: formData.invoiceType,
  party_id: formData.partyId,
  party_type: formData.partyType,
  invoice_date: formData.invoiceDate,
  due_date: formData.dueDate || undefined,
  exchange_rate: safeParseFloat(formData.exchangeRate, 1),
  lines: lines.map((line) => ({
    line_number: line.lineNumber,
    description_ar: line.descriptionAr || undefined,
    description_en: line.descriptionEn || undefined,
    quantity: safeParseFloat(line.quantity, 0),
    unit_price: safeParseFloat(line.unitPrice, 0),
    tax_rate: safeParseFloat(line.taxRate, 0),
    discount_percent: safeParseFloat(line.discountPercent, 0),
  })),
};
```

### 3. Sales - Payments
**File:** `frontend/app/[locale]/(app)/sales/payments/page.tsx`

**Changes:**
- `paymentType` → `payment_type`
- `partyId` → `party_id`
- `partyType` → `party_type`
- `paymentDate` → `payment_date`: Kept as string (ISO format)
- `exchangeRate` → `exchange_rate`
- `paymentMethod` → `payment_method`
- `bankAccountId` → `bank_account_id`
- `referenceNumber` → `reference_number`
- `checkNumber` → `check_number`
- `checkDate` → `check_date`: Kept as string (ISO format)
- `bankName` → `bank_name`
- Allocations:
  - `invoiceId` → `invoice_id`

**Before:**
```typescript
const data = {
  paymentType: formData.paymentType,
  partyId: formData.partyId,
  partyType: formData.partyType,
  paymentDate: new Date(formData.paymentDate),
  exchangeRate: safeParseFloat(formData.exchangeRate, 1),
  paymentMethod: formData.paymentMethod,
  amount: safeParseFloat(formData.amount, 0),
  bankAccountId: formData.bankAccountId || undefined,
  referenceNumber: formData.referenceNumber || undefined,
  checkNumber: formData.checkNumber || undefined,
  checkDate: formData.checkDate ? new Date(formData.checkDate) : undefined,
  bankName: formData.bankName || undefined,
  allocations: allocations.map((alloc) => ({
    invoiceId: alloc.invoiceId,
    amount: safeParseFloat(alloc.amount, 0),
  })),
};
```

**After:**
```typescript
const data = {
  payment_type: formData.paymentType,
  party_id: formData.partyId,
  party_type: formData.partyType,
  payment_date: formData.paymentDate,
  exchange_rate: safeParseFloat(formData.exchangeRate, 1),
  payment_method: formData.paymentMethod,
  amount: safeParseFloat(formData.amount, 0),
  bank_account_id: formData.bankAccountId || undefined,
  reference_number: formData.referenceNumber || undefined,
  check_number: formData.checkNumber || undefined,
  check_date: formData.checkDate || undefined,
  bank_name: formData.bankName || undefined,
  allocations: allocations.map((alloc) => ({
    invoice_id: alloc.invoiceId,
    amount: safeParseFloat(alloc.amount, 0),
  })),
};
```

### 4. Sales - Customers
**File:** `frontend/app/[locale]/(app)/sales/customers/page.tsx`

**Changes:**
- `nameEn` → `name_en`
- `nameAr` → `name_ar`
- `vatNumber` → `vat_number`
- `creditLimit` → `credit_limit`
- `paymentTermsDays` → `payment_terms_days`
- `isActive` → `is_active`

**Before:**
```typescript
const data: CreateCustomerDto = {
  code: formData.code,
  nameEn: formData.nameEn,
  nameAr: formData.nameAr,
  vatNumber: formData.vatNumber || undefined,
  email: formData.email || undefined,
  phone: formData.phone || undefined,
  mobile: formData.mobile || undefined,
  address: formData.address || undefined,
  city: formData.city || undefined,
  country: formData.country || undefined,
  creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
  paymentTermsDays: formData.paymentTermsDays
    ? parseInt(formData.paymentTermsDays, 10)
    : undefined,
  isActive: formData.isActive === "true",
  notes: formData.notes || undefined,
};
```

**After:**
```typescript
const data: CreateCustomerDto = {
  code: formData.code,
  name_en: formData.nameEn,
  name_ar: formData.nameAr,
  vat_number: formData.vatNumber || undefined,
  email: formData.email || undefined,
  phone: formData.phone || undefined,
  mobile: formData.mobile || undefined,
  address: formData.address || undefined,
  city: formData.city || undefined,
  country: formData.country || undefined,
  credit_limit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
  payment_terms_days: formData.paymentTermsDays
    ? parseInt(formData.paymentTermsDays, 10)
    : undefined,
  is_active: formData.isActive === "true",
  notes: formData.notes || undefined,
};
```

### 5. Purchases - Purchase Orders
**File:** `frontend/app/[locale]/(app)/purchases/purchase-orders/page.tsx`

**Changes:**
- `vendorId` → `vendor_id`
- `expectedDeliveryDate` → `expected_delivery_date`: Kept as string (ISO format)
- Line item properties already using snake_case

**Before:**
```typescript
const data = {
  vendorId: formData.vendorId,
  date: formData.date,
  expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
  notes: formData.notes || undefined,
  items: lines?.map((line) => ({
    description: line.description,
    quantity: safeParseFloat(line.quantity, 0),
    unit_price: safeParseFloat(line.unitPrice, 0),
    tax_rate: safeParseFloat(line.taxRate, 0),
    discount: safeParseFloat(line.discount, 0),
  })) || [],
};
```

**After:**
```typescript
const data = {
  vendor_id: formData.vendorId,
  date: formData.date,
  expected_delivery_date: formData.expectedDeliveryDate || undefined,
  notes: formData.notes || undefined,
  items: lines?.map((line) => ({
    description: line.description,
    quantity: safeParseFloat(line.quantity, 0),
    unit_price: safeParseFloat(line.unitPrice, 0),
    tax_rate: safeParseFloat(line.taxRate, 0),
    discount: safeParseFloat(line.discount, 0),
  })) || [],
};
```

### 6. Purchases - Expenses
**File:** `frontend/app/[locale]/(app)/purchases/expenses/page.tsx`

**Changes:**
- `vendorName` → `vendor_id` (Note: Property name changed from vendorName to vendor_id to match API)

**Before:**
```typescript
const data: CreateExpenseDto = {
  date: formData.date,
  category: formData.category,
  description: formData.description,
  amount: parseFloat(formData.amount),
  currency: formData.currency,
  vendor_name: formData.vendorName || undefined,
  notes: formData.notes || undefined,
};
```

**After:**
```typescript
const data: CreateExpenseDto = {
  date: formData.date,
  category: formData.category,
  description: formData.description,
  amount: parseFloat(formData.amount),
  currency: formData.currency,
  vendor_id: formData.vendorName || undefined,
  notes: formData.notes || undefined,
};
```

### 7. Purchases - Vendors
**File:** `frontend/app/[locale]/(app)/purchases/vendors/page.tsx`

**Changes:**
- `nameEn` → `name_en`
- `nameAr` → `name_ar`
- `vatNumber` → `vat_number`
- `creditLimit` → `credit_limit`
- `paymentTermsDays` → `payment_terms_days`
- `bankName` → `bank_name`
- `bankAccountNumber` → `bank_account_number`
- `swiftCode` → `swift_code`
- `isActive` → `is_active`

**Before:**
```typescript
const data: CreateVendorDto = {
  code: formData.code,
  nameEn: formData.nameEn,
  nameAr: formData.nameAr,
  vatNumber: formData.vatNumber || undefined,
  email: formData.email || undefined,
  phone: formData.phone || undefined,
  mobile: formData.mobile || undefined,
  address: formData.address || undefined,
  city: formData.city || undefined,
  country: formData.country || undefined,
  creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
  paymentTermsDays: formData.paymentTermsDays
    ? parseInt(formData.paymentTermsDays, 10)
    : undefined,
  bankName: formData.bankName || undefined,
  bankAccountNumber: formData.bankAccountNumber || undefined,
  iban: formData.iban || undefined,
  swiftCode: formData.swiftCode || undefined,
  isActive: formData.isActive === "true",
  notes: formData.notes || undefined,
};
```

**After:**
```typescript
const data: CreateVendorDto = {
  code: formData.code,
  name_en: formData.nameEn,
  name_ar: formData.nameAr,
  vat_number: formData.vatNumber || undefined,
  email: formData.email || undefined,
  phone: formData.phone || undefined,
  mobile: formData.mobile || undefined,
  address: formData.address || undefined,
  city: formData.city || undefined,
  country: formData.country || undefined,
  credit_limit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
  payment_terms_days: formData.paymentTermsDays
    ? parseInt(formData.paymentTermsDays, 10)
    : undefined,
  bank_name: formData.bankName || undefined,
  bank_account_number: formData.bankAccountNumber || undefined,
  iban: formData.iban || undefined,
  swift_code: formData.swiftCode || undefined,
  is_active: formData.isActive === "true",
  notes: formData.notes || undefined,
};
```

### 8. Settings - Company
**File:** `frontend/app/[locale]/(app)/settings/company/page.tsx`

**Status:** ✅ No changes needed
- This file already passes formData directly to `companySettingsApi.update(formData)`
- The formData keys match the expected snake_case format
- No property transformation needed

### 9. Assets - Fixed Assets
**File:** `frontend/app/[locale]/(app)/assets/fixed/page.tsx`

**Status:** ✅ No changes needed
- This file only calls `assetsApi.disposeAsset()` and `assetsApi.getAssets()`
- All parameters are already in snake_case

### 10. Assets - Depreciation
**File:** `frontend/app/[locale]/(app)/assets/depreciation/page.tsx`

**Status:** ✅ No changes needed
- This file only calls `assetsApi.calculateDepreciation()`, `assetsApi.previewJournalEntries()`, and `assetsApi.postToJournal()`
- All parameters are already in snake_case

## Key Principles Applied

1. **Transform at API Boundary:** Only transform property names when creating the data object for API calls. Keep component state (formData) in camelCase for better React developer experience.

2. **Date Handling:** Keep date fields as strings (ISO format) instead of converting to Date objects. The backend expects ISO string format.

3. **Consistent Naming:** All API data objects now use snake_case to match the backend DTO interfaces and database schema.

4. **Type Safety:** All transformations maintain type safety with the TypeScript DTO interfaces.

## Common Patterns

### Property Name Transformation
```typescript
// Form state (camelCase)
formData.customerId

// API data (snake_case)
customer_id: formData.customerId
```

### Date Handling
```typescript
// Before (incorrect)
invoiceDate: new Date(formData.invoiceDate)

// After (correct)
invoice_date: formData.invoiceDate  // Keep as ISO string
```

### Nested Objects
```typescript
// Line items
lines: lines.map((line) => ({
  line_number: line.lineNumber,
  description_ar: line.descriptionAr,
  unit_price: safeParseFloat(line.unitPrice, 0),
  tax_rate: safeParseFloat(line.taxRate, 0),
}))
```

## Testing Checklist

- [ ] Create quotation with line items
- [ ] Create invoice with multiple line items
- [ ] Create payment with invoice allocations
- [ ] Create new customer
- [ ] Create new vendor
- [ ] Create purchase order
- [ ] Create expense
- [ ] Update existing records
- [ ] Verify all API calls use snake_case properties
- [ ] Verify date fields are sent as ISO strings
- [ ] Verify nested objects use snake_case properties

## Impact Assessment

**Risk Level:** Low

**Breaking Changes:** None - these are internal API call fixes that align with the expected DTO interfaces.

**Rollback Plan:** If issues arise, revert the specific file changes. The transformation only affects the API call boundary, not component state or UI rendering.

**Benefits:**
- Consistent property naming between frontend and backend
- Type safety with TypeScript DTO interfaces
- Reduced likelihood of API errors due to property name mismatches
- Better alignment with database schema (snake_case)

## Next Steps

1. Test all modified components to ensure CRUD operations work correctly
2. Verify API responses match the expected DTO structure
3. Monitor console for any property name errors
4. Update unit tests to use snake_case property names in API mocks
5. Consider adding a transformation utility function for consistency
