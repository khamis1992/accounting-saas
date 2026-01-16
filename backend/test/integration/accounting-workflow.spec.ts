import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Accounting Workflow Integration Tests', () => {
  let app: INestApplication;
  let authToken: string;
  let tenantId: string;
  let createdResources: any = {};

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Setup test tenant and authenticate
    // This would typically involve creating a test user and getting auth token
    tenantId = 'test-tenant-integration';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete Invoice to Payment Workflow', () => {
    it('should create customer -> create invoice -> approve -> post -> create payment -> allocate', async () => {
      // Step 1: Create customer
      const customerResponse = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'INT-001',
          nameEn: 'Integration Test Customer',
          nameAr: 'عميل اختبار التكامل',
          email: 'integration@test.com',
        })
        .expect(201);

      const customer = customerResponse.body;
      createdResources.customer = customer.id;
      expect(customer).toHaveProperty('id');

      // Step 2: Create invoice
      const invoiceResponse = await request(app.getHttpServer())
        .post('/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          invoiceType: 'sales',
          partyType: 'customer',
          partyId: customer.id,
          invoiceDate: new Date().toISOString(),
          lines: [
            {
              lineNumber: 1,
              description: 'Test Product',
              quantity: 2,
              unitPrice: 500,
              taxPercentage: 15,
            },
          ],
        })
        .expect(201);

      const invoice = invoiceResponse.body;
      createdResources.invoice = invoice.id;
      expect(invoice).toHaveProperty('id');
      expect(invoice.status).toBe('draft');
      expect(invoice.totalAmount).toBe(1150); // 1000 + 150 tax

      // Step 3: Approve invoice
      const approveInvoiceResponse = await request(app.getHttpServer())
        .patch(`/invoices/${invoice.id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(approveInvoiceResponse.body.status).toBe('approved');

      // Step 4: Post invoice (should create journal)
      const postInvoiceResponse = await request(app.getHttpServer())
        .patch(`/invoices/${invoice.id}/post`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(postInvoiceResponse.body.status).toBe('posted');

      // Verify journal was created
      const journalsResponse = await request(app.getHttpServer())
        .get('/journals')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ sourceId: invoice.id })
        .expect(200);

      expect(journalsResponse.body).toHaveLength(1);
      createdResources.journal = journalsResponse.body[0].id;

      // Step 5: Create payment
      const paymentResponse = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentType: 'receipt',
          partyType: 'customer',
          partyId: customer.id,
          paymentDate: new Date().toISOString(),
          amount: 1150,
          paymentMethod: 'bank_transfer',
          allocations: [
            {
              invoiceId: invoice.id,
              amount: 1150,
            },
          ],
        })
        .expect(201);

      const payment = paymentResponse.body;
      createdResources.payment = payment.id;
      expect(payment).toHaveProperty('id');
      expect(payment.status).toBe('draft');

      // Step 6: Approve payment
      const approvePaymentResponse = await request(app.getHttpServer())
        .patch(`/payments/${payment.id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(approvePaymentResponse.body.status).toBe('approved');

      // Step 7: Post payment (should create journal and update invoice balance)
      const postPaymentResponse = await request(app.getHttpServer())
        .patch(`/payments/${payment.id}/post`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(postPaymentResponse.body.status).toBe('posted');

      // Step 8: Verify invoice balance is now zero
      const updatedInvoiceResponse = await request(app.getHttpServer())
        .get(`/invoices/${invoice.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(updatedInvoiceResponse.body.balanceAmount).toBe(0);
      expect(updatedInvoiceResponse.body.paidAmount).toBe(1150);
    });

    it('should maintain double-entry balance throughout workflow', async () => {
      // Get all journals created
      const journalsResponse = await request(app.getHttpServer())
        .get('/journals')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'posted' })
        .expect(200);

      const journals = journalsResponse.body;

      // Each journal should be balanced
      journals.forEach((journal: any) => {
        const totalDebit = journal.journal_lines.reduce(
          (sum: number, line: any) => sum + line.debit,
          0,
        );
        const totalCredit = journal.journal_lines.reduce(
          (sum: number, line: any) => sum + line.credit,
          0,
        );

        expect(totalDebit).toEqual(totalCredit);
        expect(totalDebit).toBeGreaterThan(0);
      });
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('should not allow tenant A to access tenant B data', async () => {
      // Create tenant A customer
      const customerAResponse = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', 'tenant-a')
        .send({
          code: 'A-001',
          nameEn: 'Tenant A Customer',
        })
        .expect(201);

      const customerA = customerAResponse.body;

      // Try to access with tenant B context - should fail
      await request(app.getHttpServer())
        .get(`/customers/${customerA.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', 'tenant-b')
        .expect(404); // Not found because different tenant
    });

    it('should isolate journals between tenants', async () => {
      // Create journal for tenant A
      await request(app.getHttpServer())
        .post('/journals')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', 'tenant-a')
        .send({
          journalType: 'general',
          descriptionAr: 'قيد يومية',
          transactionDate: new Date().toISOString(),
          lines: [
            { lineNumber: 1, accountId: 'acc1', debit: 1000, credit: 0 },
            { lineNumber: 2, accountId: 'acc2', debit: 0, credit: 1000 },
          ],
        })
        .expect(201);

      // Query with tenant B - should return empty
      const response = await request(app.getHttpServer())
        .get('/journals')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', 'tenant-b')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('Chart of Accounts Hierarchy', () => {
    it('should create and maintain account hierarchy', async () => {
      // Create root account
      const rootResponse = await request(app.getHttpServer())
        .post('/coa')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'TEST-1000',
          nameEn: 'Test Root',
          nameAr: 'جذر اختبار',
          type: 'asset',
        })
        .expect(201);

      const root = rootResponse.body;
      expect(root.level).toBe(1);

      // Create child account
      const childResponse = await request(app.getHttpServer())
        .post('/coa')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'TEST-1100',
          nameEn: 'Test Child',
          nameAr: 'فرع اختبار',
          type: 'asset',
          parentId: root.id,
        })
        .expect(201);

      const child = childResponse.body;
      expect(child.level).toBe(2);

      // Fetch all accounts with hierarchy
      const hierarchyResponse = await request(app.getHttpServer())
        .get('/coa')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const accounts = hierarchyResponse.body;
      const rootAccount = accounts.find((a: any) => a.id === root.id);
      expect(rootAccount.children).toHaveLength(1);
      expect(rootAccount.children[0].id).toBe(child.id);
    });

    it('should calculate consolidated balances for parent accounts', async () => {
      // This test would verify that parent account balances include children
      // Implementation depends on business logic
    });
  });

  describe('Journal Entry Workflow', () => {
    it('should enforce journal approval workflow', async () => {
      // Create draft journal
      const createResponse = await request(app.getHttpServer())
        .post('/journals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          journalType: 'general',
          descriptionAr: 'قيد يومية',
          transactionDate: new Date().toISOString(),
          lines: [
            { lineNumber: 1, accountId: 'acc1', debit: 1000, credit: 0 },
            { lineNumber: 2, accountId: 'acc2', debit: 0, credit: 1000 },
          ],
        })
        .expect(201);

      const journal = createResponse.body;
      expect(journal.status).toBe('draft');

      // Try to post without approval - should fail
      await request(app.getHttpServer())
        .patch(`/journals/${journal.id}/post`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      // Approve
      await request(app.getHttpServer())
        .patch(`/journals/${journal.id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Now post should succeed
      const postResponse = await request(app.getHttpServer())
        .patch(`/journals/${journal.id}/post`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(postResponse.body.status).toBe('posted');
    });

    it('should validate double-entry before posting', async () => {
      // Try to create unbalanced journal
      const response = await request(app.getHttpServer())
        .post('/journals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          journalType: 'general',
          descriptionAr: 'قيد غير متوازن',
          transactionDate: new Date().toISOString(),
          lines: [
            { lineNumber: 1, accountId: 'acc1', debit: 1000, credit: 0 },
            { lineNumber: 2, accountId: 'acc2', debit: 0, credit: 500 }, // Not balanced
          ],
        })
        .expect(400); // Bad request

      expect(response.body.message).toContain('balanced');
    });
  });

  describe('Financial Reports Integration', () => {
    it('should generate trial balance from posted journals', async () => {
      const response = await request(app.getHttpServer())
        .get('/reports/trial-balance')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ asOfDate: new Date().toISOString() })
        .expect(200);

      expect(response.body).toHaveProperty('accounts');
      expect(response.body).toHaveProperty('totalDebit');
      expect(response.body).toHaveProperty('totalCredit');
      expect(response.body.totalDebit).toEqual(response.body.totalCredit);
    });

    it('should generate balance sheet', async () => {
      const response = await request(app.getHttpServer())
        .get('/reports/balance-sheet')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ asOfDate: new Date().toISOString() })
        .expect(200);

      expect(response.body).toHaveProperty('assets');
      expect(response.body).toHaveProperty('liabilities');
      expect(response.body).toHaveProperty('equity');
    });

    it('should generate income statement', async () => {
      const response = await request(app.getHttpServer())
        .get('/reports/income-statement')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        })
        .expect(200);

      expect(response.body).toHaveProperty('revenue');
      expect(response.body).toHaveProperty('expenses');
      expect(response.body).toHaveProperty('netIncome');
    });
  });

  describe('Error Handling', () => {
    it('should rollback on payment allocation failure', async () => {
      // This test verifies transaction rollback on error
      const response = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentType: 'receipt',
          partyType: 'customer',
          partyId: 'non-existent',
          amount: 1000,
          allocations: [
            { invoiceId: 'non-existent', amount: 1000 },
          ],
        })
        .expect(400); // Bad request

      // Verify payment was not created
      await request(app.getHttpServer())
        .get(`/payments/${response.body?.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should handle concurrent invoice updates', async () => {
      // This would test optimistic locking or similar
      // Implementation depends on concurrency control mechanism
    });
  });

  describe('Data Validation', () => {
    it('should validate required fields on creation', async () => {
      await request(app.getHttpServer())
        .post('/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
        })
        .expect(400);
    });

    it('should validate email formats', async () => {
      await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'TEST-001',
          nameEn: 'Test',
          email: 'invalid-email', // Invalid format
        })
        .expect(400);
    });

    it('should validate tax number format', async () => {
      await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'TEST-001',
          nameEn: 'Test',
          taxNumber: '123', // Too short for Saudi tax number
        })
        .expect(400);
    });
  });
});
