import { SupabaseClient } from '@supabase/supabase-js';

// Global test setup
beforeAll(async () => {
  // Setup that runs before all tests
  console.log('🧪 Setting up test environment...');

  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  process.env.SUPABASE_URL = process.env.TEST_SUPABASE_URL || process.env.SUPABASE_URL;
  process.env.SUPABASE_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Initialize test database connection
  // This will be handled by individual test suites
});

afterAll(async () => {
  // Cleanup that runs after all tests
  console.log('🧹 Cleaning up test environment...');
});

// Global timeout for all tests
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error to see actual errors
  // error: console.error,
};

// Helper function to wait for async operations
global.sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to generate test IDs
global.generateTestId = () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
