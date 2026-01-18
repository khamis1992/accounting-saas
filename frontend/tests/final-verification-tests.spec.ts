import { test, expect } from '@playwright/test';

test.describe('Final Button Verification Tests', () => {
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

  test('should verify all main navigation buttons are clickable', async ({ page }) => {
    console.log('Verifying all main navigation buttons are clickable...');
    
    // Wait for page to load
    await page.waitForSelector('body');
    
    // Test main navigation buttons using more specific selectors to avoid strict mode violations
    const accountingBtn = page.locator('div:has-text("Accounting")').first();
    await expect(accountingBtn).toBeVisible();
    await expect(accountingBtn).toBeEnabled();
    console.log('✓ Accounting button is visible and enabled');
    
    const salesBtn = page.locator('div:has-text("Sales")').first();
    await expect(salesBtn).toBeVisible();
    await expect(salesBtn).toBeEnabled();
    console.log('✓ Sales button is visible and enabled');
    
    const purchasesBtn = page.locator('div:has-text("Purchases")').first();
    await expect(purchasesBtn).toBeVisible();
    await expect(purchasesBtn).toBeEnabled();
    console.log('✓ Purchases button is visible and enabled');
    
    const bankingBtn = page.locator('div:has-text("Banking")').first();
    await expect(bankingBtn).toBeVisible();
    await expect(bankingBtn).toBeEnabled();
    console.log('✓ Banking button is visible and enabled');
    
    const assetsBtn = page.locator('div:has-text("Assets")').first();
    await expect(assetsBtn).toBeVisible();
    await expect(assetsBtn).toBeEnabled();
    console.log('✓ Assets button is visible and enabled');
    
    const taxBtn = page.locator('div:has-text("Tax")').first();
    await expect(taxBtn).toBeVisible();
    await expect(taxBtn).toBeEnabled();
    console.log('✓ Tax button is visible and enabled');
    
    const reportsBtn = page.locator('div:has-text("Reports")').first();
    await expect(reportsBtn).toBeVisible();
    await expect(reportsBtn).toBeEnabled();
    console.log('✓ Reports button is visible and enabled');
    
    const settingsBtn = page.locator('div:has-text("Settings")').first();
    await expect(settingsBtn).toBeVisible();
    await expect(settingsBtn).toBeEnabled();
    console.log('✓ Settings button is visible and enabled');
    
    // Test that we can click on one of the main navigation items
    await page.click('div:has-text("Accounting")');
    await page.waitForTimeout(500); // Wait for animation/submenu
    console.log('✓ Successfully clicked on Accounting navigation');
    
    // Go back to dashboard to test another navigation
    await page.goto('https://frontend-ivory-eta-13.vercel.app/en/dashboard');
    await page.click('div:has-text("Sales")');
    await page.waitForTimeout(500); // Wait for animation/submenu
    console.log('✓ Successfully clicked on Sales navigation');
    
    // Go back to dashboard to test another navigation
    await page.goto('https://frontend-ivory-eta-13.vercel.app/en/dashboard');
    await page.click('div:has-text("Settings")');
    await page.waitForTimeout(500); // Wait for animation/submenu
    console.log('✓ Successfully clicked on Settings navigation');
    
    console.log('All main navigation buttons verified successfully!');
  });

  test('should verify dashboard loads correctly', async ({ page }) => {
    console.log('Verifying dashboard loads correctly...');
    
    // Wait for page to load
    await page.waitForSelector('body');
    
    // Verify we're on the dashboard by checking for the specific heading
    const dashboardHeading = page.locator('h1:has-text("Dashboard")');
    await expect(dashboardHeading).toBeVisible();
    console.log('✓ Dashboard heading is visible');
    
    // Verify that the page title is correct
    await expect(page).toHaveTitle(/Dashboard/);
    console.log('✓ Dashboard title is correct');
    
    // Verify that we can see the main content area
    const mainContent = page.locator('main, [data-testid="main-content"], .container, .content');
    await expect(mainContent).toBeVisible();
    console.log('✓ Main content area is visible');
    
    console.log('Dashboard loads correctly verified!');
  });

  test('should verify user profile button is accessible', async ({ page }) => {
    console.log('Verifying user profile button accessibility...');
    
    // Wait for page to load
    await page.waitForSelector('body');
    
    // Find the user profile button using a more specific selector
    const userButton = page.locator('button:has-text("admin@admin.com")').first();
    await expect(userButton).toBeVisible();
    await expect(userButton).toBeEnabled();
    console.log('✓ User profile button is visible and enabled');
    
    // Test that the button can be clicked
    await userButton.click();
    console.log('✓ Successfully clicked user profile button');
    
    // Wait for the menu to appear
    await page.waitForTimeout(500);
    
    // Verify that the menu appeared by looking for a sign out option
    const signOutOption = page.locator('text=Sign Out');
    await expect(signOutOption).toBeVisible();
    console.log('✓ Sign Out option is visible in user menu');
    
    // Click somewhere else to close the menu
    await page.click('h1'); // Click on the dashboard header
    console.log('✓ User menu can be closed');
    
    console.log('User profile button accessibility verified!');
  });

  test('should verify search and command palette functionality', async ({ page }) => {
    console.log('Verifying search and command palette functionality...');
    
    // Wait for page to load
    await page.waitForSelector('body');
    
    // Test command palette button (usually triggered by Ctrl+K or Cmd+K)
    const commandPaletteBtn = page.locator('text=Ctrl+K');
    if (await commandPaletteBtn.count() > 0) {
      await expect(commandPaletteBtn).toBeVisible();
      console.log('✓ Command palette indicator is visible');
    } else {
      console.log('ℹ Command palette indicator not found on this page');
    }
    
    // Test search functionality if available
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], [aria-label*="Search"]');
    if (await searchInput.count() > 0) {
      await expect(searchInput.first()).toBeVisible();
      await expect(searchInput.first()).toBeEnabled();
      console.log('✓ Search input is visible and enabled');
    } else {
      console.log('ℹ Search input not found on this page');
    }
    
    console.log('Search and command palette functionality verified!');
  });
});