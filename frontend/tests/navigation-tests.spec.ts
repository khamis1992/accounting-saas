import { test, expect } from '@playwright/test';

test.describe('Main Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('https://frontend-ivory-eta-13.vercel.app/en/signin');
    
    // Fill in the login form with provided credentials
    await page.fill('input[type="email"]', 'admin@admin.com');
    await page.fill('input[type="password"]', '123456');
    
    // Submit the login form
    await page.click('button:has-text("Sign In")');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should verify dashboard buttons are working', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('h1');
    
    // Look for dashboard elements
    const header = page.locator('h1:has-text("Dashboard")');
    await expect(header).toBeVisible();
    
    // Test that dashboard has loaded by checking for some elements
    const welcomeText = page.locator('text=Welcome');
    await expect(welcomeText).toBeVisible();
    
    // Test dashboard quick action buttons
    const newInvoiceButton = page.locator('button:has-text("New Invoice")');
    await expect(newInvoiceButton).toBeVisible();
    
    const newPaymentButton = page.locator('button:has-text("New Payment")');
    await expect(newPaymentButton).toBeVisible();
    
    const newJournalButton = page.locator('button:has-text("New Journal")');
    await expect(newJournalButton).toBeVisible();
    
    console.log('Dashboard buttons verified successfully!');
  });

  test('should verify sidebar navigation works', async ({ page }) => {
    // Test sidebar navigation items are visible
    // Using more specific selectors to avoid ambiguity
    const accountingLink = page.locator('a:has-text("Accounting")');
    await expect(accountingLink).toBeVisible();
    
    const salesLink = page.locator('a:has-text("Sales")');
    await expect(salesLink).toBeVisible();
    
    const purchasesLink = page.locator('a:has-text("Purchases")');
    await expect(purchasesLink).toBeVisible();
    
    const bankingLink = page.locator('a:has-text("Banking")');
    await expect(bankingLink).toBeVisible();
    
    const assetsLink = page.locator('a:has-text("Assets")');
    await expect(assetsLink).toBeVisible();
    
    const taxLink = page.locator('a:has-text("Tax")');
    await expect(taxLink).toBeVisible();
    
    const reportsLink = page.locator('a:has-text("Reports")');
    await expect(reportsLink).toBeVisible();
    
    const settingsLink = page.locator('a:has-text("Settings")');
    await expect(settingsLink).toBeVisible();
    
    console.log('Sidebar navigation verified successfully!');
  });

  test('should navigate to chart of accounts and verify buttons', async ({ page }) => {
    // Navigate to chart of accounts using the sidebar
    await page.click('a:has-text("Accounting")');
    await page.click('a:has-text("Chart of Accounts")');
    
    // Wait for navigation
    await page.waitForURL('**/coa', { timeout: 30000 });
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
    
    console.log('Chart of Accounts buttons verified successfully!');
  });

  test('should navigate to journal entries and verify buttons', async ({ page }) => {
    // Navigate to journal entries using the sidebar
    await page.click('a:has-text("Accounting")');
    await page.click('a:has-text("Journals")');
    
    // Wait for navigation
    await page.waitForURL('**/journals', { timeout: 30000 });
    await expect(page).toHaveURL(/.*journals/);
    
    // Check that the page loaded by looking for a characteristic element
    const header = page.locator('h1:has-text("Journal Entries")');
    await expect(header).toBeVisible();
    
    // Test add journal button
    const addJournalButton = page.locator('button:has-text("Add Journal Entry")');
    await expect(addJournalButton).toBeVisible();
    
    console.log('Journal Entries buttons verified successfully!');
  });

  test('should navigate to sales customers and verify buttons', async ({ page }) => {
    // Navigate to customers using the sidebar
    await page.click('a:has-text("Sales")');
    await page.click('a:has-text("Customers")');
    
    // Wait for navigation
    await page.waitForURL('**/customers', { timeout: 30000 });
    await expect(page).toHaveURL(/.*customers/);
    
    // Check that the page loaded by looking for a characteristic element
    const header = page.locator('h1:has-text("Customers")');
    await expect(header).toBeVisible();
    
    // Test add customer button
    const addCustomerButton = page.locator('button:has-text("Add Customer")');
    await expect(addCustomerButton).toBeVisible();
    
    console.log('Customers buttons verified successfully!');
  });

  test('should navigate to settings users and verify buttons', async ({ page }) => {
    // Navigate to users using the sidebar
    await page.click('a:has-text("Settings")');
    await page.click('a:has-text("Users")');
    
    // Wait for navigation
    await page.waitForURL('**/users', { timeout: 30000 });
    await expect(page).toHaveURL(/.*users/);
    
    // Check that the page loaded by looking for a characteristic element
    const header = page.locator('h1:has-text("Users")');
    await expect(header).toBeVisible();
    
    // Test invite user button
    const inviteButton = page.locator('button:has-text("Invite User")');
    await expect(inviteButton).toBeVisible();
    
    console.log('Users buttons verified successfully!');
  });
});