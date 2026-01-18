# Data Integrity Fixes - Testing Checklist

Use this checklist to verify all data integrity fixes are working correctly.

## Pre-Deployment Checks

### 1. Validation Utilities Test
- [ ] Run TypeScript compilation: `npx tsc --noEmit`
- [ ] No errors in `frontend/lib/utils/validation.ts`
- [ ] All exported functions are accessible
- [ ] TypeScript types are correct

### 2. Payment Allocation Validation
**File:** `frontend/app/[locale]/(app)/sales/payments/page.tsx`

#### Test Scenarios:

**Scenario 1: Create Payment with Valid Allocation**
- [ ] Navigate to Payments page
- [ ] Click "Add Payment"
- [ ] Fill in payment details (amount: 1000)
- [ ] Select customer with outstanding invoices
- [ ] Add allocation to invoice (outstanding: 500)
- [ ] Set allocation amount to 500
- [ ] Verify no validation errors
- [ ] Submit successfully
- [ ] Verify payment created

**Scenario 2: Prevent Over-Allocation to Single Invoice**
- [ ] Create payment (amount: 1000)
- [ ] Select customer
- [ ] Add allocation to invoice (outstanding: 500)
- [ ] Try to set allocation amount to 600
- [ ] Verify input shows red border
- [ ] Verify error message: "Exceeds outstanding (500.00)"
- [ ] Verify submit button is disabled
- [ ] Reduce allocation to 500
- [ ] Verify validation error clears
- [ ] Submit button enabled

**Scenario 3: Prevent Over-Allocation to Multiple Invoices**
- [ ] Create payment (amount: 1000)
- [ ] Add allocation to Invoice A (outstanding: 500, allocate: 500)
- [ ] Add allocation to Invoice B (outstanding: 400, allocate: 400)
- [ ] Add allocation to Invoice C (outstanding: 200, allocate: 200)
- [ ] Total allocated: 1100 (exceeds payment: 1000)
- [ ] Verify warning panel shows over-allocation
- [ ] Verify submit button is disabled
- [ ] Remove Invoice C allocation
- [ ] Total allocated: 900 (within payment: 1000)
- [ ] Verify validation passes
- [ ] Submit successfully

**Scenario 4: Real-Time Validation on Amount Change**
- [ ] Create payment (amount: 1000)
- [ ] Add allocation (500)
- [ ] Change payment amount to 400
- [ ] Verify warning shows (500 allocated > 400 payment)
- [ ] Verify submit button disabled
- [ ] Change payment amount to 1000
- [ ] Verify validation passes

**Scenario 5: Handle Invalid Input**
- [ ] Try to enter negative amount
- [ ] Verify sanitized to 0
- [ ] Try to enter "abc" text
- [ ] Verify sanitized to 0
- [ ] Try to enter very large number (999999999)
- [ ] Verify handled gracefully

**Scenario 6: Edit Existing Payment**
- [ ] Create draft payment with allocations
- [ ] Edit payment
- [ ] Modify allocations
- [ ] Verify validation works on edit
- [ ] Save successfully

### 3. Invoice Calculation Tests
**File:** `frontend/app/[locale]/(app)/sales/invoices/page.tsx`

#### Test Scenarios:

**Scenario 1: Basic Line Calculation**
- [ ] Create new invoice
- [ ] Add line item: quantity=10, unitPrice=100, taxRate=15%, discount=10%
- [ ] Verify calculated total:
  - Subtotal: 1000
  - Discount: 100
  - Taxable: 900
  - Tax: 135
  - Total: 1035
- [ ] Submit successfully

**Scenario 2: Multiple Line Items**
- [ ] Add line 1: quantity=10, price=100
- [ ] Add line 2: quantity=5, price=50
- [ ] Verify totals:
  - Subtotal: 1250
  - Total calculated correctly
- [ ] Submit successfully

**Scenario 3: Zero Values**
- [ ] Try quantity=0, price=100
- [ ] Verify total=0
- [ ] Try quantity=10, price=0
- [ ] Verify total=0
- [ ] No crashes or errors

**Scenario 4: Invalid Input Handling**
- [ ] Enter quantity="abc"
- [ ] Verify treated as 0
- [ ] Enter price="-100"
- [ ] Verify treated as 0 or rejected
- [ ] Enter taxRate="150"
- [ ] Verify clamped to 100

**Scenario 5: Null Safety**
- [ ] Open invoice page
- [ ] Search/filter with various criteria
- [ ] Verify no null reference errors
- [ ] Try with empty invoice list
- [ ] Verify page renders correctly

### 4. Purchase Order Calculation Tests
**File:** `frontend/app/[locale]/(app)/purchases/purchase-orders/page.tsx`

#### Test Scenarios:

**Scenario 1: Basic PO Calculation**
- [ ] Create new purchase order
- [ ] Add line item: quantity=10, unitPrice=100, taxRate=5%, discount=5%
- [ ] Verify calculated total:
  - Subtotal: 1000
  - Discount: 50
  - Taxable: 950
  - Tax: 47.50
  - Total: 997.50
- [ ] Submit successfully

**Scenario 2: Multiple Items**
- [ ] Add multiple line items
- [ ] Verify totals accumulate correctly
- [ ] Submit successfully

**Scenario 3: Edge Cases**
- [ ] Try quantity=0
- [ ] Try price=0
- [ ] Try taxRate=100
- [ ] Try discount=100
- [ ] Verify all handled correctly

### 5. Null Safety Tests

#### Test Scenarios:

**Scenario 1: Empty Arrays**
- [ ] Navigate to pages with no data
- [ ] Verify pages render without errors
- [ ] No "Cannot read property of undefined" errors

**Scenario 2: Null Properties**
- [ ] Handle items with missing optional properties
- [ ] Verify optional chaining works
- [ ] No null reference errors

**Scenario 3: Filter/Map Operations**
- [ ] Filter empty arrays
- [ ] Map over undefined arrays
- [ ] Verify returns empty array, not error

### 6. Integration Tests

#### Test Scenarios:

**Scenario 1: Complete Payment Flow**
1. Create invoice with multiple line items
2. Post invoice
3. Create payment for that invoice
4. Allocate payment to invoice
5. Post payment
6. Verify invoice status updated

**Scenario 2: Edit After Validation**
1. Create draft payment
2. Add allocations
3. Change party
4. Verify allocations cleared
5. Add new allocations
6. Verify validation works

**Scenario 3: Concurrent Operations**
1. Open payment form
2. Start typing amount
3. Add allocation
4. Change amount again
5. Verify validation updates correctly

## Performance Tests

### 1. Validation Performance
- [ ] Test with 100 allocations (should be fast)
- [ ] Monitor rendering performance
- [ ] Verify no lag on input change
- [ ] Check useMemo is working

### 2. Large Data Sets
- [ ] Test with 1000+ invoices
- [ ] Verify filtering works smoothly
- [ ] Check pagination if applicable

## Browser Compatibility Tests

### 1. Chrome/Edge
- [ ] All features work
- [ ] Validation shows correctly
- [ ] No console errors

### 2. Firefox
- [ ] All features work
- [ ] Validation shows correctly
- [ ] No console errors

### 3. Safari (if available)
- [ ] All features work
- [ ] Validation shows correctly
- [ ] No console errors

## Error Handling Tests

### 1. API Errors
- [ ] Simulate API failure on submit
- [ ] Verify error message shown
- [ ] Verify form doesn't clear
- [ ] Can retry

### 2. Network Errors
- [ ] Disconnect network
- [ ] Try to submit
- [ ] Verify error handling
- [ ] Reconnect
- [ ] Retry successfully

### 3. Validation Errors
- [ ] Trigger validation errors
- [ ] Verify clear error messages
- [ ] Verify can fix and resubmit

## Accessibility Tests

### 1. Visual Feedback
- [ ] Red borders on invalid inputs
- [ ] Error messages visible
- [ ] Warning panels readable
- [ ] Color contrast adequate

### 2. Screen Reader
- [ ] Error messages announced
- [ ] Validation state clear
- [ ] Disabled buttons indicated

## Regression Tests

### 1. Existing Functionality
- [ ] All old features still work
- [ ] No breaking changes
- [ ] Data displays correctly
- [ ] Actions complete successfully

### 2. Data Display
- [ ] Currency formatting correct
- [ ] Number formatting correct
- [ ] Dates display correctly
- [ ] Status badges show correctly

## Code Quality Checks

### 1. TypeScript
- [ ] No TypeScript errors
- [ ] All types are correct
- [ ] No `any` types where specific type should be used

### 2. ESLint
- [ ] Run ESLint
- [ ] Fix any warnings
- [ ] No critical issues

### 3. Code Review
- [ ] Peer review completed
- [ ] All comments addressed
- [ ] Documentation updated

## Documentation Checks

### 1. Code Comments
- [ ] Complex functions commented
- [ ] Validation logic explained
- [ ] Examples provided

### 2. User Documentation
- [ ] Help text updated
- [ ] Error messages user-friendly
- [ ] Tooltips accurate

## Deployment Readiness

### Pre-Deployment
- [ ] All tests pass
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Documentation complete

### Post-Deployment
- [ ] Monitor error logs
- [ ] Check user feedback
- [ ] Verify production data integrity
- [ ] Be ready to rollback if needed

## Sign-Off

### Developer
- [ ] All tests completed
- [ ] No critical issues found
- [ ] Ready for QA review

### QA/Reviewer
- [ ] Tested all scenarios
- [ ] Verified fixes work
- [ ] Approved for deployment

### Deployment
- [ ] Deployed to staging
- [ ] Verified in staging
- [ ] Deployed to production
- [ ] Verified in production

## Notes

### Issues Found
Document any issues found during testing:

1.
2.
3.

### Workarounds
Document any workarounds needed:

1.
2.
3.

### Recommendations
Document any recommendations for future improvements:

1.
2.
3.

---

**Testing Date:** _______________
**Tester:** _______________
**Status:** [ ] Pass [ ] Fail
**Comments:** _______________________________
