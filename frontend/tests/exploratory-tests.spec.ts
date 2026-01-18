import { test, expect } from '@playwright/test';

test.describe('Exploratory Tests', () => {
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

  test('should explore the dashboard and find available elements', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('body');
    
    // Take a screenshot to see the actual page structure
    await page.screenshot({ path: 'dashboard-elements.png' });
    
    // Get all available text content to understand the structure
    const bodyText = await page.textContent('body');
    console.log('Body text:', bodyText.substring(0, 1000)); // First 1000 chars
    
    // Look for common elements using more generic selectors
    const headers = await page.$$('h1, h2, h3, .text-3xl, .text-2xl');
    console.log(`Found ${headers.length} header elements`);
    
    for (let i = 0; i < headers.length; i++) {
      const text = await headers[i].textContent();
      console.log(`Header ${i}: ${text}`);
    }
    
    // Look for buttons
    const buttons = await page.$$('.btn, button, [role="button"]');
    console.log(`Found ${buttons.length} button elements`);
    
    // Just verify that we're on a page that loaded
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    // Look for any text that might indicate we're on the dashboard
    await expect(page.locator('body')).toContainText('Dashboard');
    
    console.log('Dashboard exploration completed successfully!');
  });

  test('should explore sidebar navigation structure', async ({ page }) => {
    await page.waitForSelector('body');
    
    // Take a screenshot of the sidebar
    await page.screenshot({ path: 'sidebar-structure.png' });
    
    // Look for sidebar elements - using more flexible selectors
    const sidebarLinks = await page.$$('.sidebar a, nav a, [data-testid="nav-item"], li a, .nav-link');
    console.log(`Found ${sidebarLinks.length} potential sidebar links`);
    
    for (let i = 0; i < sidebarLinks.length; i++) {
      const text = await sidebarLinks[i].textContent();
      console.log(`Sidebar link ${i}: ${text}`);
    }
    
    // Try to find navigation elements by their aria labels or titles
    const navItems = await page.$$('.sidebar *, nav *, [role="navigation"] *');
    console.log(`Found ${navItems.length} navigation elements`);
    
    // Look for common accounting terms that might be in the navigation
    const hasAccounting = await page.locator('text=Accounting').isVisible();
    const hasSales = await page.locator('text=Sales').isVisible();
    const hasPurchases = await page.locator('text=Purchases').isVisible();
    const hasSettings = await page.locator('text=Settings').isVisible();
    
    console.log(`Has Accounting: ${hasAccounting}`);
    console.log(`Has Sales: ${hasSales}`);
    console.log(`Has Purchases: ${hasPurchases}`);
    console.log(`Has Settings: ${hasSettings}`);
    
    console.log('Sidebar exploration completed!');
  });
});