# Test Quick Reference

## Commands

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:cov

# Run unit tests only (fastest)
npm run test:unit

# Run E2E tests only
npm run test:e2e

# Watch mode (re-run on changes)
npm run test:watch

# Debug tests
npm run test:debug

# Run specific test file
npm test -- coa.service.spec.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create"
```

## Test Structure

```
backend/
├── src/
│   ├── coa/coa.service.spec.ts           (50+ tests)
│   ├── journals/journals.service.spec.ts (30+ tests)
│   ├── customers/customers.service.spec.ts (30+ tests)
│   ├── vendors/vendors.service.spec.ts   (30+ tests)
│   ├── invoices/invoices.service.spec.ts (30+ tests)
│   └── payments/payments.service.spec.ts (30+ tests)
└── test/
    ├── setup.ts                          (Global setup)
    ├── utils/test-helpers.ts             (Utilities)
    ├── fixtures/chart-of-accounts.ts     (Test data)
    ├── integration/accounting-workflow.spec.ts (Integration)
    └── e2e/complete-user-journeys.e2e-spec.ts (E2E)
```

## Quick Stats

- **Total Tests**: 269
- **Test Files**: 10
- **Coverage Target**: 70%+
- **Time to Run**: ~30 seconds (unit), ~2 minutes (all)

## Common Tasks

### Add New Test to Service

```typescript
it('should describe what the test does', async () => {
  // Arrange: Setup test data
  const mockData = { /* ... */ };

  // Act: Execute the function
  const result = await service.method(mockData);

  // Assert: Verify the result
  expect(result).toHaveProperty('id');
});
```

### Mock Supabase Client

```typescript
mockSupabaseClient.single.mockResolvedValue({
  data: { id: '1', /* ... */ },
  error: null,
});
```

### Clean Up After Tests

```typescript
afterEach(() => {
  jest.clearAllMocks();
});
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Tests timeout | Increase timeout: `jest.setTimeout(30000)` |
| Database errors | Check TEST_DATABASE_URL environment variable |
| Mock not working | Use `jest.clearAllMocks()` in `afterEach` |
| Coverage low | Add tests for uncovered code paths |

## Environment Variables Required

```bash
TEST_DATABASE_URL=postgresql://...
TEST_SUPABASE_URL=https://...
TEST_SUPABASE_ANON_KEY=...
TEST_SUPABASE_SERVICE_ROLE_KEY=...
```

## Test Utilities Available

- `createTestTenant()` - Create test tenant
- `createTestUser()` - Create test user
- `createTestAccount()` - Create test account
- `createTestCustomer()` - Create test customer
- `createTestVendor()` - Create test vendor
- `cleanupTestData()` - Clean up test data
- `generateTestEmail()` - Generate unique email
- `generateTestCode()` - Generate unique code

## Coverage Reports

After running `npm run test:cov`:

```bash
# Open coverage report
open coverage/index.html  # Mac
start coverage/index.html # Windows
xdg-open coverage/index.html # Linux
```

## CI/CD Integration

```yaml
# GitHub Actions example
- name: Run Tests
  run: npm test

- name: Generate Coverage
  run: npm run test:cov

- name: Upload Coverage
  uses: codecov/codecov-action@v2
```

## More Information

See `TESTING.md` for comprehensive documentation.
See `TEST_SUMMARY.md` for implementation details.
