import { test, expect } from '@playwright/test';

test.describe('Login Test', () => {
  test('should login successfully with provided credentials', async ({ page }) => {
    // Navigate to the login page
    await page.goto('https://frontend-ivory-eta-13.vercel.app/en/signin');
    
    // Fill in the login form with provided credentials
    await page.fill('input[type="email"]', 'admin@admin.com');
    await page.fill('input[type="password"]', '123456');
    
    // Take a screenshot before submitting
    await page.screenshot({ path: 'login-form.png' });
    
    // Submit the login form
    await page.click('button:has-text("Sign In")');
    
    // Wait for redirect to dashboard or any page
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    
    // Verify we're on the dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Take a screenshot of the dashboard
    await page.screenshot({ path: 'dashboard-after-login.png' });
    
    // Verify we're logged in by checking for some dashboard elements
    const welcomeText = page.locator('text=Welcome');
    await expect(welcomeText).toBeVisible();
    
    console.log('Login successful!');
  });
});