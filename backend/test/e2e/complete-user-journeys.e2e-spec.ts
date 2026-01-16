import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Complete User Journeys E2E Tests', () => {
  let app: INestApplication;
  let authToken: string;
  let tenantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Setup: Sign up new tenant and user
    const signupResponse = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: `e2e-test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        firstName: 'E2E',
        lastName: 'Test',
        tenantName: 'E2E Test Tenant',
        industry: 'technology',
        country: 'Saudi Arabia',
        currency: 'SAR',
      })
      .expect(201);

    authToken = signupResponse.body.accessToken;
    tenantId = signupResponse.body.tenant.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Journey 1: New User Onboarding', () => {
    it('should signup -> setup chart of accounts -> create first invoice', async () => {
      // 1. User already signed up in beforeAll

      // 2. Access dashboard - should redirect to onboarding
      const dashboardResponse = await request(app.getHttpServer())
        .get('/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(dashboardResponse.body).toHaveProperty('onboardingRequired');

      // 3. Setup chart of accounts
      const coaResponse = await request(app.getHttpServer())
        .post('/onboarding/chart-of-accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          template: 'standard', // Use predefined template
        })
        .expect(201);

      expect(coaResponse.body).toHaveProperty('accounts');
      expect(coaResponse.body.accounts.length).toBeGreaterThan(0);

      // 4. Create first customer
      const customerResponse = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'CUST-001',
          nameEn: 'First Customer',
          nameAr: 'أول عميل',
          email: 'customer@example.com',
          phone: '+966501234567',
        })
        .expect(201);

      const customer = customerResponse.body;

      // 5. Create first invoice
      const invoiceResponse = await request(app.getHttpServer())
        .post('/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          invoiceType: 'sales',
          partyType: 'customer',
          partyId: customer.id,
          invoiceDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          lines: [
            {
              lineNumber: 1,
              description: 'Consulting Services',
              quantity: 10,
              unitPrice: 500,
              taxPercentage: 15,
            },
          ],
        })
        .expect(201);

      const invoice = invoiceResponse.body;
      expect(invoice.totalAmount).toBe(5750); // 5000 + 750 tax

      // 6. Approve and post invoice
      await request(app.getHttpServer())
        .patch(`/invoices/${invoice.id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/invoices/${invoice.id}/post`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // 7. Verify journal was created
      const journalsResponse = await request(app.getHttpServer())
        .get('/journals')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'posted' })
        .expect(200);

      expect(journalsResponse.body.length).toBeGreaterThan(0);

      // 8. Dashboard should now show data
      const updatedDashboardResponse = await request(app.getHttpServer())
        .get('/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(updatedDashboardResponse.body).toHaveProperty('totalRevenue');
      expect(updatedDashboardResponse.body).toHaveProperty('pendingInvoices');
      expect(updatedDashboardResponse.body.totalRevenue).toBeGreaterThan(0);
    });
  });

  describe('Journey 2: Complete Sales Cycle', () => {
    it('should create invoice -> receive payment -> reconcile', async () => {
      // 1. Create customer
      const customerResponse = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'CUST-002',
          nameEn: 'ABC Company',
          nameAr: 'شركة ABC',
        })
        .expect(201);

      const customer = customerResponse.body;

      // 2. Create invoice
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
              description: 'Product A',
              quantity: 5,
              unitPrice: 1000,
            },
          ],
        })
        .expect(201);

      const invoice = invoiceResponse.body;

      // 3. Approve and post
      await request(app.getHttpServer())
        .patch(`/invoices/${invoice.id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/invoices/${invoice.id}/post`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // 4. Receive payment
      const paymentResponse = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentType: 'receipt',
          partyType: 'customer',
          partyId: customer.id,
          paymentDate: new Date().toISOString(),
          amount: 5000,
          paymentMethod: 'bank_transfer',
          bankAccountId: 'bank-acc-1',
          allocations: [
            {
              invoiceId: invoice.id,
              amount: 5000,
            },
          ],
        })
        .expect(201);

      const payment = paymentResponse.body;

      // 5. Approve and post payment
      await request(app.getHttpServer())
        .patch(`/payments/${payment.id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/payments/${payment.id}/post`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // 6. Verify invoice is fully paid
      const paidInvoiceResponse = await request(app.getHttpServer())
        .get(`/invoices/${invoice.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(paidInvoiceResponse.body.balanceAmount).toBe(0);
      expect(paidInvoiceResponse.body.status).toBe('paid');

      // 7. Verify accounting entries
      const journalsResponse = await request(app.getHttpServer())
        .get('/journals')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'posted' })
        .expect(200);

      const salesJournals = journalsResponse.body.filter(
        (j: any) => j.journal_type === 'sales' || j.journal_type === 'receipt',
      );

      expect(salesJournals.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Journey 3: Expense Management', () => {
    it('should create vendor -> create purchase invoice -> record payment', async () => {
      // 1. Create vendor
      const vendorResponse = await request(app.getHttpServer())
        .post('/vendors')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'VEND-001',
          nameEn: 'XYZ Supplier',
          nameAr: 'مورد XYZ',
          email: 'supplier@example.com',
        })
        .expect(201);

      const vendor = vendorResponse.body;

      // 2. Create purchase invoice
      const purchaseResponse = await request(app.getHttpServer())
        .post('/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          invoiceType: 'purchase',
          partyType: 'vendor',
          partyId: vendor.id,
          invoiceDate: new Date().toISOString(),
          lines: [
            {
              lineNumber: 1,
              description: 'Office Supplies',
              quantity: 100,
              unitPrice: 50,
            },
          ],
        })
        .expect(201);

      const purchase = purchaseResponse.body;

      // 3. Approve and post
      await request(app.getHttpServer())
        .patch(`/invoices/${purchase.id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/invoices/${purchase.id}/post`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // 4. Record payment to vendor
      const paymentResponse = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentType: 'payment',
          partyType: 'vendor',
          partyId: vendor.id,
          paymentDate: new Date().toISOString(),
          amount: 5000,
          paymentMethod: 'bank_transfer',
          allocations: [
            {
              invoiceId: purchase.id,
              amount: 5000,
            },
          ],
        })
        .expect(201);

      const payment = paymentResponse.body;

      // 5. Approve and post payment
      await request(app.getHttpServer())
        .patch(`/payments/${payment.id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/payments/${payment.id}/post`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // 6. Verify expense tracking
      const expenseReport = await request(app.getHttpServer())
        .get('/reports/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
        })
        .expect(200);

      expect(expenseReport.body.totalExpenses).toBeGreaterThan(0);
    });
  });

  describe('Journey 4: Financial Period Close', () => {
    it('should create journals -> close period -> generate reports', async () => {
      // 1. Create various journal entries for the period
      const journalEntries = [
        {
          journalType: 'general',
          descriptionAr: 'قيد تعديل',
          descriptionEn: 'Adjusting Entry',
          lines: [
            { lineNumber: 1, accountId: 'acc-1', debit: 1000, credit: 0 },
            { lineNumber: 2, accountId: 'acc-2', debit: 0, credit: 1000 },
          ],
        },
        {
          journalType: 'general',
          descriptionAr: 'قيد إقفال',
          descriptionEn: 'Closing Entry',
          lines: [
            { lineNumber: 1, accountId: 'acc-3', debit: 2000, credit: 0 },
            { lineNumber: 2, accountId: 'acc-4', debit: 0, credit: 2000 },
          ],
        },
      ];

      const createdJournals = [];
      for (const entry of journalEntries) {
        const response = await request(app.getHttpServer())
          .post('/journals')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...entry,
            transactionDate: new Date().toISOString(),
          })
          .expect(201);

        createdJournals.push(response.body);

        // Approve and post
        await request(app.getHttpServer())
          .patch(`/journals/${response.body.id}/approve`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        await request(app.getHttpServer())
          .patch(`/journals/${response.body.id}/post`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      }

      // 2. Generate trial balance
      const trialBalanceResponse = await request(app.getHttpServer())
        .get('/reports/trial-balance')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ asOfDate: new Date().toISOString() })
        .expect(200);

      expect(trialBalanceResponse.body.totalDebit).toEqual(
        trialBalanceResponse.body.totalCredit,
      );

      // 3. Generate balance sheet
      const balanceSheetResponse = await request(app.getHttpServer())
        .get('/reports/balance-sheet')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ asOfDate: new Date().toISOString() })
        .expect(200);

      expect(balanceSheetResponse.body.assets).toBeDefined();
      expect(balanceSheetResponse.body.liabilities).toBeDefined();
      expect(balanceSheetResponse.body.equity).toBeDefined();

      // 4. Generate income statement
      const incomeStatementResponse = await request(app.getHttpServer())
        .get('/reports/income-statement')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
        })
        .expect(200);

      expect(incomeStatementResponse.body.revenue).toBeDefined();
      expect(incomeStatementResponse.body.expenses).toBeDefined();
      expect(incomeStatementResponse.body.netIncome).toBeDefined();
    });
  });

  describe('Journey 5: Export and Reporting', () => {
    it('should export data to PDF and Excel', async () => {
      // 1. Export invoices to PDF
      const pdfResponse = await request(app.getHttpServer())
        .get('/invoices/export')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ format: 'pdf' })
        .expect(200);

      expect(pdfResponse.headers['content-type']).toContain('application/pdf');

      // 2. Export journal entries to Excel
      const excelResponse = await request(app.getHttpServer())
        .get('/journals/export')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ format: 'excel' })
        .expect(200);

      expect(excelResponse.headers['content-type']).toContain(
        'application/vnd.openxmlformats-officedocument',
      );

      // 3. Export trial balance to PDF
      const trialBalanceExportResponse = await request(app.getHttpServer())
        .get('/reports/trial-balance/export')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ format: 'pdf', asOfDate: new Date().toISOString() })
        .expect(200);

      expect(trialBalanceExportResponse.headers['content-type']).toContain(
        'application/pdf',
      );
    });
  });

  describe('Journey 6: Multi-Currency Transactions', () => {
    it('should handle foreign currency invoice and payment', async () => {
      // 1. Create invoice in USD
      const customerResponse = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'CUST-USD-001',
          nameEn: 'US Customer',
          currency: 'USD',
        })
        .expect(201);

      const invoiceResponse = await request(app.getHttpServer())
        .post('/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          invoiceType: 'sales',
          partyType: 'customer',
          partyId: customerResponse.body.id,
          invoiceDate: new Date().toISOString(),
          currency: 'USD',
          exchangeRate: 3.75, // 1 USD = 3.75 SAR
          lines: [
            {
              lineNumber: 1,
              description: 'Services',
              quantity: 1,
              unitPrice: 1000, // USD
            },
          ],
        })
        .expect(201);

      const invoice = invoiceResponse.body;

      // 2. Verify base currency (SAR) calculation
      expect(invoice.baseCurrencyAmount).toBe(3750); // 1000 USD * 3.75

      // 3. Approve and post
      await request(app.getHttpServer())
        .patch(`/invoices/${invoice.id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/invoices/${invoice.id}/post`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // 4. Create journal entry should reflect base currency
      const journalsResponse = await request(app.getHttpServer())
        .get('/journals')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ sourceId: invoice.id })
        .expect(200);

      const journal = journalsResponse.body[0];
      expect(journal.currency).toBe('SAR'); // Base currency
    });
  });

  describe('Journey 7: Error Recovery', () => {
    it('should handle and recover from validation errors', async () => {
      // 1. Try to create invalid invoice (missing lines)
      await request(app.getHttpServer())
        .post('/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          invoiceType: 'sales',
          partyType: 'customer',
          partyId: 'some-customer-id',
          invoiceDate: new Date().toISOString(),
          lines: [], // Empty lines
        })
        .expect(400);

      // 2. Create valid invoice
      const customerResponse = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'CUST-REC-001',
          nameEn: 'Recovery Test Customer',
        })
        .expect(201);

      const validInvoiceResponse = await request(app.getHttpServer())
        .post('/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          invoiceType: 'sales',
          partyType: 'customer',
          partyId: customerResponse.body.id,
          invoiceDate: new Date().toISOString(),
          lines: [
            {
              lineNumber: 1,
              description: 'Product',
              quantity: 1,
              unitPrice: 100,
            },
          ],
        })
        .expect(201);

      expect(validInvoiceResponse.body).toHaveProperty('id');
    });
  });

  describe('Journey 8: Audit Trail', () => {
    it('should maintain complete audit trail for all operations', async () => {
      // 1. Create invoice
      const invoiceResponse = await request(app.getHttpServer())
        .post('/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          invoiceType: 'sales',
          partyType: 'customer',
          partyId: 'customer-1',
          invoiceDate: new Date().toISOString(),
          lines: [
            {
              lineNumber: 1,
              description: 'Product',
              quantity: 1,
              unitPrice: 100,
            },
          ],
        })
        .expect(201);

      const invoice = invoiceResponse.body;

      // 2. Check audit log
      const auditResponse = await request(app.getHttpServer())
        .get('/audit')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ entityType: 'invoice', entityId: invoice.id })
        .expect(200);

      expect(auditResponse.body.length).toBeGreaterThan(0);
      expect(auditResponse.body[0]).toHaveProperty('action');
      expect(auditResponse.body[0]).toHaveProperty('userId');
      expect(auditResponse.body[0]).toHaveProperty('timestamp');
    });
  });
});
