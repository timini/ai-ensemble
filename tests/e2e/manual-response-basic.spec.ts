import { test, expect } from '@playwright/test';

test.describe('Manual Response Basic Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate((envVars) => {
      localStorage.setItem('ensemble-provider-keys', JSON.stringify({
        openai: envVars.OPENAI_API_KEY || 'test-key',
        google: envVars.GOOGLE_API_KEY || 'test-key',
      }));
    }, {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    });
    await page.reload();
    await expect(page.locator('button:has-text("Configure Providers (2/4)")')).toBeVisible();
  });

  test('should add manual response and verify it appears in UI', async ({ page }) => {
    // Select models
    await page.click('button:has-text("Select Models")');
    await page.check('input[value="gpt-4"]');
    await page.check('input[value="gemini-pro"]');
    await page.click('button:has-text("Done")');

    // Add a manual response
    await page.click('button:has-text("+ Add Manual Response")');
    await page.fill('input[name="modelName"]', 'My Manual Model');
    await page.selectOption('select[name="provider"]', 'openai');
    await page.fill('textarea[name="response"]', 'This is a test response.');
    await page.click('button:has-text("Add Manual Response")');

    // Verify the manual response is in the selected models display
    await expect(page.locator('text=My Manual Model (Manual)')).toBeVisible();
  });

  test('should show manual response form validation', async ({ page }) => {
    // Select models
    await page.click('button:has-text("Select Models")');
    await page.check('input[value="gpt-4"]');
    await page.check('input[value="gemini-pro"]');
    await page.click('button:has-text("Done")');

    // Open the manual response modal
    await page.click('button:has-text("+ Add Manual Response")');

    // Try to add with empty fields
    await page.click('button:has-text("Add Manual Response")');

    // Verify validation messages
    await expect(page.locator('text=Model name is required')).toBeVisible();
    await expect(page.locator('text=Response is required')).toBeVisible();

    // Fill in only the model name
    await page.fill('input[name="modelName"]', 'My Manual Model');
    await page.click('button:has-text("Add Manual Response")');
    await expect(page.locator('text=Response is required')).toBeVisible();
  });
});
