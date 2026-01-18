# Testing Patterns

**Analysis Date:** 2026-01-18

## Test Framework

**Runner:**
- **Backend:** Jest 30.0.0 with ts-jest 29.2.5
- **Frontend:** Not detected (no test framework configured in frontend)
- Config: `backend/jest.config.js`

**Assertion Library:**
- Jest's built-in `expect()` for backend
- No testing library configured for frontend

**Run Commands:**
```bash
# Backend - from backend/ directory
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:cov          # Coverage report
npm run test:debug        # Debug mode with inspector
npm run test:e2e          # End-to-end tests
```

## Test File Organization

**Location:**
- **Backend Unit Tests:** Co-located with source files
  - Pattern: `src/{module}/{module}.service.spec.ts`
  - Examples:
    - `backend/src/coa/coa.service.spec.ts`
    - `backend/src/customers/customers.service.spec.ts`
    - `backend/src/invoices/invoices.service.spec.ts`
    - `backend/src/journals/journals.service.spec.ts`
- **Backend Integration Tests:** Separate directory
  - Pattern: `test/integration/{feature}.spec.ts`
  - Example: `backend/test/integration/accounting-workflow.spec.ts`
- **Backend E2E Tests:** `test/` directory with `*.e2e-spec.ts` pattern
- **Frontend Tests:** Not detected (no test files found)

**Naming:**
- Unit tests: `{filename}.spec.ts`
- Integration tests: `{feature}.spec.ts` in `test/integration/`
- E2E tests: `{feature}.e2e-spec.ts` in `test/`

**Structure:**
```
backend/
├── src/
│   ├── coa/
│   │   ├── coa.service.ts
│   │   └── coa.service.spec.ts        # Unit tests
│   ├── customers/
│   │   ├── customers.service.ts
│   │   └── customers.service.spec.ts  # Unit tests
│   └── ...
├── test/
│   ├── integration/
│   │   └── accounting-workflow.spec.ts # Integration tests
│   ├── setup.ts                        # Global test setup
│   └── jest-e2e.json                   # E2E config
└── jest.config.js                       # Jest configuration
```

## Test Structure

**Suite Organization:**
```typescript
describe('ServiceName', () => {
  let service: ServiceType;
  let mockDependency: any;

  beforeEach(async () => {
    // Setup mock dependencies
    mockDependency = { /* mock implementation */ };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceToTest,
        {
          provide: DependencyService,
          useValue: mockDependency,
        },
      ],
    }).compile();

    service = module.get<ServiceType>(ServiceToTest);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should return expected result', async () => {
      // Arrange
      const mockData = { /* test data */ };
      mockDependency.method.mockResolvedValue({ data: mockData, error: null });

      // Act
      const result = await service.methodName('param1');

      // Assert
      expect(result).toEqual(mockData);
      expect(mockDependency.method).toHaveBeenCalledWith('table-name');
    });

    it('should throw error when operation fails', async () => {
      // Arrange
      mockDependency.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      // Act & Assert
      await expect(service.methodName('999')).rejects.toThrow();
    });
  });
});
```

**Patterns:**

**Setup Pattern:**
- Use `beforeEach()` to create fresh test module for each test
- Mock external dependencies (Supabase, other services)
- Use `Test.createTestingModule()` from `@nestjs/testing`
- Get service instance using `module.get<T>()`

**Teardown Pattern:**
- Use `afterEach()` to clear all mocks: `jest.clearAllMocks()`
- Reset global state in `afterAll()` if needed
- Close database connections in `afterAll()` for integration tests

**Assertion Pattern:**
- Use `expect().toEqual()` for object comparison
- Use `expect().toHaveBeenCalledWith()` to verify calls
- Use `expect().rejects.toThrow()` for error testing
- Use `expect().toHaveLength()` for array testing
- Use `expect().toHaveProperty()` for property existence

## Mocking

**Framework:** Jest's built-in mocking (`jest.fn()`, `jest.mock()`)

**Patterns:**

**Supabase Client Mocking:**
```typescript
// Mock Supabase client chain
let mockSupabaseClient: any;

beforeEach(async () => {
  mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    rpc: jest.fn().mockReturnThis(),
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      CoaService,
      {
        provide: SupabaseService,
        useValue: {
          getClient: jest.fn().mockReturnValue(mockSupabaseClient),
        },
      },
    ],
  }).compile();
});

// Use in tests
it('should query database correctly', async () => {
  mockSupabaseClient.eq.mockResolvedValue({
    data: mockAccounts,
    error: null,
  });

  await service.findAll(tenantId);

  expect(mockSupabaseClient.from).toHaveBeenCalledWith('chart_of_accounts');
  expect(mockSupabaseClient.eq).toHaveBeenCalledWith('tenant_id', tenantId);
});
```

**Service Dependency Mocking:**
```typescript
// Mock other services
const mockJournalsService = {
  create: jest.fn(),
  findOne: jest.fn(),
  postJournal: jest.fn(),
};

const module: TestingModule = await Test.createTestingModule({
  providers: [
    InvoicesService,
    {
      provide: JournalsService,
      useValue: mockJournalsService,
    },
  ],
}).compile();

// Verify interactions
it('should create journal when posting invoice', async () => {
  mockJournalsService.create.mockResolvedValue(mockJournal);

  await service.postInvoice(invoiceId, tenantId, userId);

  expect(mockJournalsService.create).toHaveBeenCalledWith(
    expect.objectContaining({
      journalType: 'sales',
      sourceId: invoiceId,
    })
  );
});
```

**What to Mock:**
- External services (Supabase database, SMTP, external APIs)
- Other NestJS services (avoid real database calls)
- File system operations
- Time-dependent code (use `jest.useFakeTimers()`)

**What NOT to Mock:**
- Pure functions (test them directly)
- DTO validation (class-validator should be tested)
- Business logic in the service under test

## Fixtures and Factories

**Test Data:**
```typescript
// Define fixture data at top of test file
const mockTenantId = 'test-tenant-id';
const mockUserId = 'test-user-id';

const mockAccount = {
  id: '1',
  code: '1000',
  name_en: 'Assets',
  name_ar: 'الأصول',
  type: 'asset',
  parent_id: null,
  is_active: true,
  level: 1,
};

const mockCustomer = {
  id: '1',
  code: 'CUST001',
  name_en: 'Customer 1',
  name_ar: 'عميل 1',
  email: 'customer@test.com',
  tenant_id: mockTenantId,
};
```

**Helper Functions (in `test/setup.ts`):**
```typescript
// Global test helpers
global.sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
global.generateTestId = () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
```

**Location:**
- Test fixtures inline in test files (preferred approach in codebase)
- Global helpers in `backend/test/setup.ts`
- No dedicated fixtures directory detected

## Coverage

**Requirements:** 70% coverage enforced
```javascript
// From backend/jest.config.js
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
}
```

**View Coverage:**
```bash
npm run test:cov
# Generates coverage/ directory with HTML report
```

**Collection Pattern:**
```javascript
// From jest.config.js
collectCoverageFrom: [
  '**/*.(t|j)s',
  '!**/*.spec.ts',
  '!**/*.e2e-spec.ts',
  '!**/node_modules/**',
  '!**/dist/**',
  '!**/test/**',
]
```

**Exclusions:**
- Test files (`.spec.ts`, `.e2e-spec.ts`)
- `node_modules/`
- Build output (`dist/`)
- Test directory (`test/`)

## Test Types

**Unit Tests:**
- **Scope:** Individual service methods
- **Approach:** Isolate the service, mock all dependencies
- **File Pattern:** `*.spec.ts` co-located with source
- **Examples:**
  - `CoaService.findAll()` - returns all accounts
  - `CustomersService.create()` - creates customer
  - `InvoicesService.postInvoice()` - posts invoice to journal
- **Focus:** Business logic, edge cases, error handling

**Integration Tests:**
- **Scope:** Multiple services working together
- **Approach:** Real HTTP requests via `supertest`, test database
- **File Pattern:** `test/integration/*.spec.ts`
- **Example:** `backend/test/integration/accounting-workflow.spec.ts`
- **Test Scenarios:**
  - Complete invoice-to-payment workflow
  - Multi-tenant isolation
  - Chart of accounts hierarchy
  - Journal entry workflow
  - Financial reports generation
  - Error handling and rollback
  - Data validation
- **Setup:**
  ```typescript
  let app: INestApplication;
  let authToken: string;
  let tenantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });
  ```

**E2E Tests:**
- **Framework:** Jest with supertest
- **Scope:** Full application stack
- **Approach:** HTTP requests to running NestJS app
- **Config:** `test/jest-e2e.json`
- **Command:** `npm run test:e2e`
- **Note:** Limited E2E test coverage detected

## Common Patterns

**Async Testing:**
```typescript
// Use async/await in tests
it('should return data from database', async () => {
  mockSupabaseClient.eq.mockResolvedValue({
    data: mockData,
    error: null,
  });

  const result = await service.findAll(tenantId);

  expect(result).toEqual(mockData);
});

// Test error cases
it('should throw on database error', async () => {
  mockSupabaseClient.eq.mockResolvedValue({
    data: null,
    error: new Error('Database error'),
  });

  await expect(service.findAll(tenantId)).rejects.toThrow('Database error');
});
```

**Error Testing:**
```typescript
// Test expected exceptions
it('should throw BadRequestException if code exists', async () => {
  mockSupabaseClient.single.mockResolvedValueOnce({
    data: { id: 'existing' },
    error: null,
  });

  await expect(service.create(dto, tenantId)).rejects.toThrow(BadRequestException);
  await expect(service.create(dto, tenantId)).rejects.toThrow('Account code already exists');
});

// Test multiple error scenarios
describe('remove', () => {
  it('should throw BadRequestException when account has children', async () => {
    mockSupabaseClient.limit.mockResolvedValueOnce({
      data: [{ id: 'child-1' }],
      error: null,
    });

    await expect(service.remove('1', tenantId)).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when account has transactions', async () => {
    mockSupabaseClient.limit
      .mockResolvedValueOnce({ data: [], error: null })  // No children
      .mockResolvedValueOnce({ data: [{ id: 'trans-1' }], error: null });  // Has transactions

    await expect(service.remove('1', tenantId)).rejects.toThrow('Cannot delete account with posted transactions');
  });
});
```

**Timeout Configuration:**
```javascript
// From jest.config.js
testTimeout: 10000,  // 10 seconds per test

// From test/setup.ts
jest.setTimeout(10000);  // Global timeout
```

**Test Isolation:**
- Each test runs in isolation (fresh module in `beforeEach`)
- Clear all mocks in `afterEach()`
- Use unique test IDs (via `global.generateTestId()`)
- Avoid shared state between tests

**NestJS-Specific Patterns:**
```typescript
// Test module creation
const module: TestingModule = await Test.createTestingModule({
  providers: [
    ServiceToTest,
    {
      provide: Dependency,
      useValue: mockDependency,
    },
  ],
}).compile();

// Get service instance
service = module.get<ServiceType>(ServiceToTest);

// Override provider for specific test
it('should use custom config', async () => {
  const customModule = await Test.createTestingModule({
    providers: [ServiceToTest],
  })
    .overrideProvider(Dependency)
    .useValue(customMock)
    .compile();

  const customService = customModule.get<ServiceType>(ServiceToTest);
  // Test with custom override
});
```

---

*Testing analysis: 2026-01-18*
