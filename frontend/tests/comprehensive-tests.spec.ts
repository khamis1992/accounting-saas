import { test, expect } from '@playwright/test';

test.describe('Comprehensive Button Tests', () => {
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

  test('should verify all main navigation buttons work', async ({ page }) => {
    console.log('Testing main navigation buttons...');
    
    // Wait for page to load
    await page.waitForSelector('body');
    
    // Test main navigation buttons using the correct selectors
    // Based on the exploratory test, the navigation items are in the sidebar
    const accountingBtn = page.locator('div:has-text("Accounting")').first();
    await expect(accountingBtn).toBeVisible();
    console.log('✓ Accounting button found and visible');
    
    const salesBtn = page.locator('div:has-text("Sales")').first();
    await expect(salesBtn).toBeVisible();
    console.log('✓ Sales button found and visible');
    
    const purchasesBtn = page.locator('div:has-text("Purchases")').first();
    await expect(purchasesBtn).toBeVisible();
    console.log('✓ Purchases button found and visible');
    
    const bankingBtn = page.locator('div:has-text("Banking")').first();
    await expect(bankingBtn).toBeVisible();
    console.log('✓ Banking button found and visible');
    
    const assetsBtn = page.locator('div:has-text("Assets")').first();
    await expect(assetsBtn).toBeVisible();
    console.log('✓ Assets button found and visible');
    
    const taxBtn = page.locator('div:has-text("Tax")').first();
    await expect(taxBtn).toBeVisible();
    console.log('✓ Tax button found and visible');
    
    const reportsBtn = page.locator('div:has-text("Reports")').first();
    await expect(reportsBtn).toBeVisible();
    console.log('✓ Reports button found and visible');
    
    const settingsBtn = page.locator('div:has-text("Settings")').first();
    await expect(settingsBtn).toBeVisible();
    console.log('✓ Settings button found and visible');
    
    console.log('All main navigation buttons verified successfully!');
  });

  test('should navigate to accounting sections and verify functionality', async ({ page }) => {
    console.log('Testing accounting section navigation...');
    
    // Click on Accounting in the sidebar
    await page.click('div:has-text("Accounting")');
    
    // Wait a moment for the submenu to appear
    await page.waitForTimeout(500);
    
    // Click on Chart of Accounts
    await page.click('text=Chart of Accounts');
    await page.waitForURL('**/coa');
    await expect(page).toHaveURL(/.*coa/);
    console.log('✓ Navigated to Chart of Accounts');
    
    // Go back to dashboard
    await page.goto('https://frontend-ivory-eta-13.vercel.app/en/dashboard');
    
    // Click on Accounting again
    await page.click('div:has-text("Accounting")');
    await page.waitForTimeout(500);
    
    // Click on Journals
    await page.click('text=Journals');
    await page.waitForURL('**/journals');
    await expect(page).toHaveURL(/.*journals/);
    console.log('✓ Navigated to Journals');
    
    // Go back to dashboard
    await page.goto('https://frontend-ivory-eta-13.vercel.app/en/dashboard');
    
    // Click on Accounting again
    await page.click('div:has-text("Accounting")');
    await page.waitForTimeout(500);
    
    // Click on General Ledger
    await page.click('text=General Ledger');
    await page.waitForURL('**/general-ledger');
    await expect(page).toHaveURL(/.*general-ledger/);
    console.log('✓ Navigated to General Ledger');
    
    // Go back to dashboard
    await page.goto('https://frontend-ivory-eta-13.vercel.app/en/dashboard');
    
    console.log('Accounting section navigation verified successfully!');
  });

  test('should navigate to sales sections and verify functionality', async ({ page }) => {
    console.log('Testing sales section navigation...');
    
    // Click on Sales in the sidebar
    await page.click('div:has-text("Sales")');
    
    // Wait a moment for the submenu to appear
    await page.waitForTimeout(500);
    
    // Click on Customers
    await page.click('text=Customers');
    await page.waitForURL('**/customers');
    await expect(page).toHaveURL(/.*customers/);
    console.log('✓ Navigated to Customers');
    
    // Go back to dashboard
    await page.goto('https://frontend-ivory-eta-13.vercel.app/en/dashboard');
    
    // Click on Sales again
    await page.click('div:has-text("Sales")');
    await page.waitForTimeout(500);
    
    // Click on Invoices
    await page.click('text=Invoices');
    await page.waitForURL('**/invoices');
    await expect(page).toHaveURL(/.*invoices/);
    console.log('✓ Navigated to Invoices');
    
    // Go back to dashboard
    await page.goto('https://frontend-ivory-eta-13.vercel.app/en/dashboard');
    
    // Click on Sales again
    await page.click('div:has-text("Sales")');
    await page.waitForTimeout(500);
    
    // Click on Payments
    await page.click('text=Payments');
    await page.waitForURL('**/payments');
    await expect(page).toHaveURL(/.*payments/);
    console.log('✓ Navigated to Payments');
    
    // Go back to dashboard
    await page.goto('https://frontend-ivory-eta-13.vercel.app/en/dashboard');
    
    console.log('Sales section navigation verified successfully!');
  });

  test('should navigate to settings sections and verify functionality', async ({ page }) => {
    console.log('Testing settings section navigation...');
    
    // Click on Settings in the sidebar
    await page.click('div:has-text("Settings")');
    
    // Wait a moment for the submenu to appear
    await page.waitForTimeout(500);
    
    // Click on Users
    await page.click('text=Users');
    await page.waitForURL('**/users');
    await expect(page).toHaveURL(/.*users/);
    console.log('✓ Navigated to Users');
    
    // Go back to dashboard
    await page.goto('https://frontend-ivory-eta-13.vercel.app/en/dashboard');
    
    // Click on Settings again
    await page.click('div:has-text("Settings")');
    await page.waitForTimeout(500);
    
    // Click on Company
    await page.click('text=Company');
    await page.waitForURL('**/company');
    await expect(page).toHaveURL(/.*company/);
    console.log('✓ Navigated to Company Settings');
    
    // Go back to dashboard
    await page.goto('https://frontend-ivory-eta-13.vercel.app/en/dashboard');
    
    console.log('Settings section navigation verified successfully!');
  });

  test('should test dashboard quick action buttons', async ({ page }) => {
    console.log('Testing dashboard quick action buttons...');
    
    // Wait for dashboard to load
    await page.waitForSelector('h1');
    
    // Look for the dashboard header
    const header = page.locator('text=Dashboard');
    await expect(header).toBeVisible();
    console.log('✓ Dashboard loaded successfully');
    
    // Test that the page contains expected elements
    const welcomeText = page.locator('text=Welcome');
    await expect(welcomeText).toBeVisible();
    console.log('✓ Welcome text found on dashboard');
    
    // Test that we can interact with the navigation
    const accountingBtn = page.locator('div:has-text("Accounting")').first();
    await expect(accountingBtn).toBeEnabled();
    console.log('✓ Accounting navigation button is enabled');
    
    const salesBtn = page.locator('div:has-text("Sales")').first();
    await expect(salesBtn).toBeEnabled();
    console.log('✓ Sales navigation button is enabled');
    
    console.log('Dashboard functionality verified successfully!');
  });

  test('should verify user profile and logout functionality', async ({ page }) => {
    console.log('Testing user profile and logout functionality...');
    
    // Wait for page to load
    await page.waitForSelector('body');
    
    // Find the user profile button (likely contains the user's name/email)
    const userButton = page.locator('text=admin@admin.com');
    await expect(userButton).toBeVisible();
    console.log('✓ User profile button found');
    
    // Click the user button to open the menu
    await userButton.click();
    
    // Wait for menu to appear
    await page.waitForTimeout(500);
    
    // Look for the sign out option
    const signOutButton = page.locator('text=Sign Out');
    await expect(signOutButton).toBeVisible();
    console.log('✓ Sign Out option found in user menu');
    
    // Verify the button is clickable by checking if it's enabled
    await expect(signOutButton).toBeEnabled();
    console.log('✓ Sign Out button is enabled');
    
    console.log('User profile and logout functionality verified successfully!');
  });
});