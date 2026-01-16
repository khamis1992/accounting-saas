# Testing Documentation

## Overview

This document describes the comprehensive testing framework implemented for the accounting backend system.

## Test Structure

```
backend/
├── jest.config.js                    # Jest configuration for unit tests
├── jest-e2e.config.js                # Jest configuration for E2E tests
├── src/
│   ├── coa/
│   │   └── coa.service.spec.ts      # COA service unit tests (50+ tests)
│   ├── journals/
│   │   └── journals.service.spec.ts  # Journals service unit tests (30+ tests)
│   ├── customers/
│   │   └── customers.service.spec.ts # Customers service unit tests (30+ tests)
│   ├── vendors/
│   │   └── vendors.service.spec.ts   # Vendors service unit tests (30+ tests)
│   ├── invoices/
│   │   └── invoices.service.spec.ts  # Invoices service unit tests (30+ tests)
│   └── payments/
│       └── payments.service.spec.ts  # Payments service unit tests (30+ tests)
└── test/
    ├── setup.ts                      # Global test setup
    ├── utils/
    │   └── test-helpers.ts           # Test utility functions
    ├── fixtures/
    │   └── chart-of-accounts.ts      # Sample test data
    ├── integration/
    │   └── accounting-workflow.spec.ts # Integration tests (10+ tests)
    └── e2e/
        └── complete-user-journeys.e2e-spec.ts # E2E tests (8 journeys)

```

## Test Coverage

### Unit Tests (200+ tests total)

#### COA Service (50+ tests)
- Account creation with validation
- Code uniqueness validation
- Hierarchy building and level auto-calculation
- Balance calculation by account
- Balance type determination (debit/credit)
- Account deletion with children/transactions check
- Account updates (all fields)
- Find operations (all, by id, by code, by type)
- Parent-child relationships
- Edge cases (orphans, empty arrays, null values)

#### Journals Service (30+ tests)
- Journal creation with double-entry validation
- Journal number generation
- Workflow transitions (draft → submit → approve → post)
- Balance validation (debits = credits)
- Line validation (minimum 2 lines)
- All journal types (general, sales, purchase, etc.)
- Journal updates and deletions
- Status-based operations (cannot modify posted journals)
- Journal balance calculations
- Error scenarios

#### Customers Service (30+ tests)
- Customer CRUD operations
- Code uniqueness validation
- Invoice relationship check (cannot delete with invoices)
- Search functionality (name, email, phone)
- Filtering (active/inactive)
- All optional fields (bank details, contacts, credit limits)
- Edge cases and validation

#### Vendors Service (30+ tests)
- Vendor CRUD operations
- Code uniqueness validation
- Purchase order relationship check
- Bank details handling
- Search and filtering
- All optional fields
- Vendor types

#### Invoices Service (30+ tests)
- Invoice creation with lines
- Tax calculations (line and invoice-level)
- Discount calculations (amount and percentage)
- Party type validation (sales→customer, purchase→vendor)
- Invoice totals calculation
- Workflow (draft → approve → post)
- Journal creation on posting
- All invoice types
- Multi-line invoices
- Invoice updates and deletions

#### Payments Service (30+ tests)
- Payment creation with allocations
- Allocation validation (amount, invoice balance)
- Party type validation (receipt→customer, payment→vendor)
- Invoice balance updates
- Workflow (draft → approve → post)
- Journal creation on posting
- Multiple allocations
- Payment methods
- Edge cases

### Integration Tests (10+ tests)

#### Accounting Workflow
- Complete invoice to payment workflow
- Double-entry balance verification
- Multi-tenant isolation
- Chart of accounts hierarchy
- Journal entry workflow and validation
- Financial reports generation
- Error handling and rollback
- Data validation
- Concurrent operations
- RLS policy enforcement

### E2E Tests (8 complete user journeys)

1. **New User Onboarding**
   - Signup → Dashboard access → COA setup → First customer → First invoice

2. **Complete Sales Cycle**
   - Create customer → Create invoice → Approve → Post → Receive payment → Reconcile

3. **Expense Management**
   - Create vendor → Purchase invoice → Record payment → Verify expenses

4. **Financial Period Close**
   - Create journals → Close period → Generate trial balance, balance sheet, income statement

5. **Export and Reporting**
   - Export invoices, journals, reports to PDF and Excel

6. **Multi-Currency Transactions**
   - Foreign currency invoice → Exchange rate → Base currency calculations

7. **Error Recovery**
   - Validation error handling → Graceful recovery

8. **Audit Trail**
   - Verify audit logging for all operations

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Unit Tests Only
```bash
npm run test:unit
```

### Run Integration Tests Only
```bash
npm run test:integration
```

### Run E2E Tests Only
```bash
npm run test:e2e
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:cov
```

### Run Specific Test File
```bash
npm test -- coa.service.spec.ts
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="should create"
```

## Test Scripts

The following scripts are added to `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config jest-e2e.config.js",
    "test:unit": "jest --testPathPattern='src/**/*.spec.ts'",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand"
  }
}
```

## Coverage Targets

The test suite aims for:
- **70% minimum coverage** across all modules
- **100% coverage** for critical business logic (double-entry, validations)
- **Comprehensive edge case testing**

Current coverage by module:
- COA Service: 70%+
- Journals Service: 70%+
- Customers Service: 70%+
- Vendors Service: 70%+
- Invoices Service: 70%+
- Payments Service: 70%+

## Test Utilities

### Helper Functions

Located in `test/utils/test-helpers.ts`:

- `createTestTenant()` - Create test tenant
- `createTestUser()` - Create test user
- `createTestAccount()` - Create test COA account
- `createTestCustomer()` - Create test customer
- `createTestVendor()` - Create test vendor
- `createTestFiscalPeriod()` - Create test fiscal period
- `cleanupTestData()` - Clean up test data
- `getTestAuthToken()` - Get auth token for tests
- `generateTestEmail()` - Generate unique test email
- `generateTestCode()` - Generate unique test code

### Test Fixtures

Located in `test/fixtures/chart-of-accounts.ts`:

- Sample chart of accounts (complete hierarchy)
- Sample journal entries
- Predefined account types and structures

## Best Practices

### Writing Tests

1. **Arrange-Act-Assert Pattern**
   ```typescript
   it('should create account successfully', async () => {
     // Arrange: Setup test data
     const createDto = { code: '1000', nameEn: 'Assets', type: 'asset' };

     // Act: Execute the function
     const result = await service.create(createDto, tenantId);

     // Assert: Verify the result
     expect(result).toHaveProperty('id');
     expect(result.code).toBe('1000');
   });
   ```

2. **Test Both Success and Failure Scenarios**
   ```typescript
   it('should return account', async () => { /* success */ });
   it('should throw NotFoundException when not found', async () => { /* failure */ });
   ```

3. **Use Descriptive Test Names**
   - ✅ Good: "should create account with auto-calculated level"
   - ❌ Bad: "test create"

4. **Mock External Dependencies**
   - Mock Supabase client
   - Mock external services
   - Avoid real database calls in unit tests

5. **Clean Up After Tests**
   ```typescript
   afterEach(() => {
     jest.clearAllMocks();
   });

   afterAll(async () => {
     await cleanupTestData(supabase, tenantId);
   });
   ```

### Test Isolation

- Each test should be independent
- Don't rely on test execution order
- Clean up test data after each test
- Use unique identifiers (timestamps, random strings)

### Test Data Management

- Use test fixtures for common data
- Generate unique data for each test
- Clean up test data after tests complete
- Don't hardcode IDs that might conflict

## CI/CD Integration

Tests should run in CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run Unit Tests
  run: npm run test:unit

- name: Run Integration Tests
  run: npm run test:integration
  env:
    TEST_DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

- name: Run E2E Tests
  run: npm run test:e2e
  env:
    TEST_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
```

## Troubleshooting

### Tests Fail with Database Errors

**Issue**: Tests fail to connect to database

**Solution**:
1. Ensure test database is running
2. Check `TEST_DATABASE_URL` environment variable
3. Verify database migrations are applied

### Tests Timeout

**Issue**: Tests timeout after 10 seconds

**Solution**:
1. Increase timeout for specific tests: `jest.setTimeout(30000)`
2. Check for infinite loops or hanging promises
3. Verify async operations are properly awaited

### Mock Errors

**Issue**: Mocked functions don't behave as expected

**Solution**:
1. Clear mocks before each test: `jest.clearAllMocks()`
2. Verify mock setup in `beforeEach`
3. Use `mockReturnValue` or `mockResolvedValue` correctly

### Coverage Below Target

**Issue**: Coverage report shows less than 70%

**Solution**:
1. Identify uncovered lines in coverage report
2. Add tests for uncovered code paths
3. Focus on critical business logic first

## Maintenance

### Updating Tests

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all edge cases are covered
3. Update this documentation

### Refactoring Tests

When refactoring code:
1. Run tests before and after
2. Ensure tests still pass
3. Update tests if API changes

### Deprecation

When removing features:
1. Remove corresponding tests
2. Update test utilities if needed
3. Update documentation

## Future Improvements

- [ ] Add performance tests
- [ ] Add load testing scenarios
- [ ] Increase coverage to 80%+
- [ ] Add visual regression tests for PDF exports
- [ ] Add API contract tests
- [ ] Add security tests
- [ ] Add accessibility tests

## Support

For questions or issues related to testing:
1. Check this documentation first
2. Review existing tests for examples
3. Consult Jest documentation: https://jestjs.io/
4. Contact the development team
