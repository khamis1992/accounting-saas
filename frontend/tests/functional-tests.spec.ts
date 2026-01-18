import { test, expect } from '@playwright/test';

// Test suite for the accounting system
test.describe('Accounting System Button Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the dashboard since we're testing the deployed version
    await page.goto('https://frontend-ivory-eta-13.vercel.app/en/dashboard');
  });

  test('should navigate to dashboard and test dashboard buttons', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Wait for page to load
    await page.waitForSelector('h1');
    
    // Look for dashboard elements without assuming specific button text
    const header = page.locator('h1:has-text("Dashboard")');
    await expect(header).toBeVisible();
    
    // Test that the page loaded correctly by checking for some elements
    const welcomeText = page.locator('text=Welcome back');
    await expect(welcomeText).toBeVisible();
  });

  test('should navigate to chart of accounts and test buttons', async ({ page }) => {
    // Navigate to chart of accounts using the sidebar
    await page.click('text=Accounting');
    await page.click('text=Chart of Accounts');
    
    // Wait for navigation
    await page.waitForURL('**/coa');
    await expect(page).toHaveURL(/.*coa/);
    
    // Check that the page loaded by looking for a characteristic element
    const header = page.locator('h1:has-text("Chart of Accounts")');
    await expect(header).toBeVisible();
    
    // Test add account button
    const addAccountButton = page.locator('button:has-text("Add Account")');
    await expect(addAccountButton).toBeVisible();
    
    // Test search functionality
    const searchInput = page.locator('input[type="search"]');
    await expect(searchInput).toBeVisible();
  });

  test('should navigate to journal entries and test buttons', async ({ page }) => {
    // Navigate to journal entries using the sidebar
    await page.click('text=Accounting');
    await page.click('text=Journals');
    
    // Wait for navigation
    await page.waitForURL('**/journals');
    await expect(page).toHaveURL(/.*journals/);
    
    // Check that the page loaded by looking for a characteristic element
    const header = page.locator('h1:has-text("Journal Entries")');
    await expect(header).toBeVisible();
    
    // Test add journal button
    const addJournalButton = page.locator('button:has-text("Add Journal Entry")');
    await expect(addJournalButton).toBeVisible();
  });

  test('should navigate to general ledger and test buttons', async ({ page }) => {
    // Navigate to general ledger using the sidebar
    await page.click('text=Accounting');
    await page.click('text=General Ledger');
    
    // Wait for navigation
    await page.waitForURL('**/general-ledger');
    await expect(page).toHaveURL(/.*general-ledger/);
    
    // Check that the page loaded by looking for a characteristic element
    const header = page.locator('h1:has-text("General Ledger")');
    await expect(header).toBeVisible();
    
    // Test export buttons
    const exportPdfButton = page.locator('button:has-text("PDF")');
    await expect(exportPdfButton).toBeVisible();
    
    const exportExcelButton = page.locator('button:has-text("Excel")');
    await expect(exportExcelButton).toBeVisible();
  });

  test('should navigate to trial balance and test buttons', async ({ page }) => {
    // Navigate to trial balance using the sidebar
    await page.click('text=Accounting');
    await page.click('text=Trial Balance');
    
    // Wait for navigation
    await page.waitForURL('**/trial-balance');
    await expect(page).toHaveURL(/.*trial-balance/);
    
    // Check that the page loaded by looking for a characteristic element
    const header = page.locator('h1:has-text("Trial Balance")');
    await expect(header).toBeVisible();
    
    // Test export buttons
    const exportPdfButton = page.locator('button:has-text("PDF")');
    await expect(exportPdfButton).toBeVisible();
    
    const exportExcelButton = page.locator('button:has-text("Excel")');
    await expect(exportExcelButton).toBeVisible();
  });

  test('should navigate to financial statements and test buttons', async ({ page }) => {
    // Navigate to financial statements using the sidebar
    await page.click('text=Accounting');
    await page.click('text=Financial Statements');
    
    // Wait for navigation
    await page.waitForURL('**/statements');
    await expect(page).toHaveURL(/.*statements/);
    
    // Check that the page loaded by looking for a characteristic element
    const header = page.locator('h1:has-text("Financial Statements")');
    await expect(header).toBeVisible();
    
    // Test tab navigation
    const balanceSheetTab = page.locator('button:has-text("Balance Sheet")');
    await expect(balanceSheetTab).toBeVisible();
    
    const incomeStatementTab = page.locator('button:has-text("Income Statement")');
    await expect(incomeStatementTab).toBeVisible();
  });

  test('should navigate to sales customers and test buttons', async ({ page }) => {
    // Navigate to customers using the sidebar
    await page.click('text=Sales');
    await page.click('text=Customers');
    
    // Wait for navigation
    await page.waitForURL('**/customers');
    await expect(page).toHaveURL(/.*customers/);
    
    // Check that the page loaded by looking for a characteristic element
    const header = page.locator('h1:has-text("Customers")');
    await expect(header).toBeVisible();
    
    // Test add customer button
    const addCustomerButton = page.locator('button:has-text("Add Customer")');
    await expect(addCustomerButton).toBeVisible();
  });

  test('should navigate to sales invoices and test buttons', async ({ page }) => {
    // Navigate to invoices using the sidebar
    await page.click('text=Sales');
    await page.click('text=Invoices');
    
    // Wait for navigation
    await page.waitForURL('**/invoices');
    await expect(page).toHaveURL(/.*invoices/);
    
    // Check that the page loaded by looking for a characteristic element
    const header = page.locator('h1:has-text("Invoices")');
    await expect(header).toBeVisible();
    
    // Test add invoice button
    const addInvoiceButton = page.locator('button:has-text("Add Invoice")');
    await expect(addInvoiceButton).toBeVisible();
  });

  test('should navigate to sales payments and test buttons', async ({ page }) => {
    // Navigate to payments using the sidebar
    await page.click('text=Sales');
    await page.click('text=Payments');
    
    // Wait for navigation
    await page.waitForURL('**/payments');
    await expect(page).toHaveURL(/.*payments/);
    
    // Check that the page loaded by looking for a characteristic element
    const header = page.locator('h1:has-text("Payments")');
    await expect(header).toBeVisible();
    
    // Test add payment button
    const addPaymentButton = page.locator('button:has-text("Add Payment")');
    await expect(addPaymentButton).toBeVisible();
  });

  test('should navigate to sales quotations and test buttons', async ({ page }) => {
    // Navigate to quotations using the sidebar
    await page.click('text=Sales');
    await page.click('text=Quotations');
    
    // Wait for navigation
    await page.waitForURL('**/quotations');
    await expect(page).toHaveURL(/.*quotations/);
    
    // Check that the page loaded by looking for a characteristic element
    const header = page.locator('h1:has-text("Quotations")');
    await expect(header).toBeVisible();
    
    // Test new quotation button
    const newQuotationButton = page.locator('button:has-text("New Quotation")');
    await expect(newQuotationButton).toBeVisible();
  });

  test('should navigate to purchases vendors and test buttons', async ({ page }) => {
    // Navigate to vendors using the sidebar
    await page.click('text=Purchases');
    await page.click('text=Vendors');
    
    // Wait for navigation
    await page.waitForURL('**/vendors');
    await expect(page).toHaveURL(/.*vendors/);
    
    // Check that the page loaded by looking for a characteristic element
    const header = page.locator('h1:has-text("Vendors")');
    await expect(header).toBeVisible();
    
    // Test add vendor button
    const addVendorButton = page.locator('button:has-text("Add Vendor")');
    await expect(addVendorButton).toBeVisible();
  });

  test('should navigate to purchases purchase orders and test buttons', async ({ page }) => {
    // Navigate to purchase orders using the sidebar
    await page.click('text=Purchases');
    await page.click('text=Purchase Orders');
    
    // Wait for navigation
    await page.waitForURL('**/orders');
    await expect(page).toHaveURL(/.*orders/);
    
    // Check that the page loaded by looking for a characteristic element
    const header = page.locator('h1:has-text("Purchase Orders")');
    await expect(header).toBeVisible();
    
    // Test new purchase order button
    const newPoButton = page.locator('button:has-text("New Purchase Order")');
    await expect(newPoButton).toBeVisible();
  });

  test('should navigate to purchases expenses and test buttons', async ({ page }) => {
    // Navigate to expenses using the sidebar
    await page.click('text=Purchases');
    await page.click('text=Expenses');
    
    // Wait for navigation
    await page.waitForURL('**/expenses');
    await expect(page).toHaveURL(/.*expenses/);
    
    // Check that the page loaded by looking for a characteristic element
    const header = page.locator('h1:has-text("Expenses")');
    await expect(header).toBeVisible();
    
    // Test new expense button
    const newExpenseButton = page.locator('button:has-text("New Expense")');
    await expect(newExpenseButton).toBeVisible();
  });

  test('should navigate to banking accounts and test buttons', async ({ page }) => {
    // Navigate to bank accounts using the sidebar
    await page.click('text=Banking');
    await page.click('text=Bank Accounts');
    
    // Wait for navigation
    await page.waitForURL('**/accounts');
    await expect(page).toHaveURL(/.*accounts/);
    
    // Check that the page loaded by looking for a characteristic element
    const header = page.locator('h1:has-text("Bank Accounts")');
    await expect(header).toBeVisible();
    
    // Test add account button
    const addAccountButton = page.locator('button:has-text("New Account")');
    await expect(addAccountButton).toBeVisible();
  });

  test('should navigate to assets fixed and test buttons', async ({ page }) => {
    // Navigate to fixed assets using the sidebar
    await page.click('text=Assets');
    await page.click('text=Fixed Assets');
    
    // Wait for navigation
    await page.waitForURL('**/fixed');
    await expect(page).toHaveURL(/.*fixed/);
    
    // Check that the page loaded by looking for a characteristic element
    const header = page.locator('h1:has-text("Fixed Assets")');
    await expect(header).toBeVisible();
    
    // Test add asset button
    const addAssetButton = page.locator('button:has-text("Add Asset")');
    await expect(addAssetButton).toBeVisible();
  });

  test('should navigate to tax vat and test buttons', async ({ page }) => {
    // Navigate to VAT using the sidebar
    await page.click('text=Tax');
    await page.click('text=VAT');
    
    // Wait for navigation
    await page.waitForURL('**/vat');
    await expect(page).toHaveURL(/.*vat/);
    
    // Check that the page loaded by looking for a characteristic element
    const header = page.locator('h1:has-text("VAT Management")');
    await expect(header).toBeVisible();
    
    // Test add rate button
    const addRateButton = page.locator('button:has-text("Add VAT Rate")');
    await expect(addRateButton).toBeVisible();
  });

  test('should navigate to reports and test buttons', async ({ page }) => {
    // Navigate to reports using the sidebar
    await page.click('text=Reports');
    
    // Wait for navigation
    await page.waitForURL('**/reports');
    await expect(page).toHaveURL(/.*reports/);
    
    // Check that the page loaded by looking for a characteristic element
    const header = page.locator('h1:has-text("Reports")');
    await expect(header).toBeVisible();
    
    // Test search functionality
    const searchInput = page.locator('input[type="search"]');
    await expect(searchInput).toBeVisible();
  });

  test('should navigate to settings users and test buttons', async ({ page }) => {
    // Navigate to users using the sidebar
    await page.click('text=Settings');
    await page.click('text=Users');
    
    // Wait for navigation
    await page.waitForURL('**/users');
    await expect(page).toHaveURL(/.*users/);
    
    // Check that the page loaded by looking for a characteristic element
    const header = page.locator('h1:has-text("Users")');
    await expect(header).toBeVisible();
    
    // Test invite user button
    const inviteButton = page.locator('button:has-text("Invite User")');
    await expect(inviteButton).toBeVisible();
  });

  test('should navigate to settings roles and test buttons', async ({ page }) => {
    // Navigate to roles using the sidebar
    await page.click('text=Settings');
    await page.click('text=Roles');
    
    // Wait for navigation
    await page.waitForURL('**/roles');
    await expect(page).toHaveURL(/.*roles/);
    
    // Check that the page loaded by looking for a characteristic element
    const header = page.locator('h1:has-text("Roles")');
    await expect(header).toBeVisible();
    
    // Test create role button
    const createRoleButton = page.locator('button:has-text("Create Role")');
    await expect(createRoleButton).toBeVisible();
  });

  test('should navigate to settings company and test buttons', async ({ page }) => {
    // Navigate to company settings using the sidebar
    await page.click('text=Settings');
    await page.click('text=Company');
    
    // Wait for navigation
    await page.waitForURL('**/company');
    await expect(page).toHaveURL(/.*company/);
    
    // Check that the page loaded by looking for a characteristic element
    const header = page.locator('h1:has-text("Company Settings")');
    await expect(header).toBeVisible();
    
    // Test save settings button
    const saveButton = page.locator('button:has-text("Save Settings")');
    await expect(saveButton).toBeVisible();
  });

  test('should test sidebar navigation', async ({ page }) => {
    // Test sidebar navigation items are visible
    const accountingLink = page.locator('text=Accounting');
    await expect(accountingLink).toBeVisible();
    
    const salesLink = page.locator('text=Sales');
    await expect(salesLink).toBeVisible();
    
    const purchasesLink = page.locator('text=Purchases');
    await expect(purchasesLink).toBeVisible();
    
    const bankingLink = page.locator('text=Banking');
    await expect(bankingLink).toBeVisible();
    
    const assetsLink = page.locator('text=Assets');
    await expect(assetsLink).toBeVisible();
    
    const taxLink = page.locator('text=Tax');
    await expect(taxLink).toBeVisible();
    
    const reportsLink = page.locator('text=Reports');
    await expect(reportsLink).toBeVisible();
    
    const settingsLink = page.locator('text=Settings');
    await expect(settingsLink).toBeVisible();
  });

  test('should test that main navigation works', async ({ page }) => {
    // Test that we can navigate to different main sections
    await page.click('text=Accounting');
    await page.click('text=Chart of Accounts');
    await page.waitForURL('**/coa');
    await expect(page).toHaveURL(/.*coa/);
    
    // Go back to dashboard
    await page.goto('https://frontend-ivory-eta-13.vercel.app/en/dashboard');
    
    // Navigate to Sales
    await page.click('text=Sales');
    await page.click('text=Invoices');
    await page.waitForURL('**/invoices');
    await expect(page).toHaveURL(/.*invoices/);
    
    // Go back to dashboard
    await page.goto('https://frontend-ivory-eta-13.vercel.app/en/dashboard');
    
    // Navigate to Purchases
    await page.click('text=Purchases');
    await page.click('text=Vendors');
    await page.waitForURL('**/vendors');
    await expect(page).toHaveURL(/.*vendors/);
  });
});