import { test, expect, Page } from '@playwright/test';
import { testPrompts, expectedResponseKeywords, testConfigurations } from '../fixtures/test-data';

test.describe('AI Ensemble Application', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Load and Basic UI', () => {
    test('should load the main page successfully', async () => {
      await expect(page).toHaveTitle(/AI Ensemble/);
      await expect(page.locator('h1')).toContainText('AI');
      await expect(page.locator('h1')).toContainText('Ensemble');
      await expect(page.locator('text=The smartest AI is an ensemble')).toBeVisible();
    });

    test('should display configuration section', async () => {
      await expect(page.locator('text=Configuration')).toBeVisible();
      await expect(page.locator('text=Configure Providers (0/4)')).toBeVisible();
      await expect(page.locator('text=Select Models (0/8)')).toBeVisible();
    });

    test('should display prompt input and submit button', async () => {
      await expect(page.locator('textarea[placeholder*="Enter your prompt here"]')).toBeVisible();
      await expect(page.locator('button:has-text("Compare 0 Models")')).toBeVisible();
    });
  });

  test.describe('Provider Configuration', () => {
    test('should allow configuring providers', async () => {
      // Click on provider configuration button
      await page.click('text=Configure Providers (0/4)');
      
      // Should open provider settings modal
      await expect(page.locator('text=AI Provider Configuration')).toBeVisible();
      
      // Configure OpenAI (if API key is available)
      if (process.env.OPENAI_API_KEY) {
        await page.fill('input[placeholder*="sk-..."]', process.env.OPENAI_API_KEY);
        await page.waitForTimeout(2000); // Wait for validation
      }
      
      // Close modal - use force click for mobile compatibility
      await page.click('button:has-text("Done")', { force: true });
      
      // Modal should be closed
      await expect(page.locator('text=AI Provider Configuration')).not.toBeVisible();
    });

    test('should validate API keys', async () => {
      await page.click('text=Configure Providers (0/4)');
      
      // Try with invalid key
      await page.fill('input[placeholder*="sk-..."]', 'invalid-key');
      await page.waitForTimeout(2000); // Wait for validation
      
      // Should show validation error
      await expect(page.locator('text=❌ Invalid API key')).toBeVisible();
    });
  });

  test.describe('Model Selection', () => {
    test('should show model selection modal', async () => {
      // Click model selection
      await page.click('text=Select Models (0/8)');
      await expect(page.locator('text=Model Selection')).toBeVisible();
      
      // Should show message about no providers configured
      await expect(page.locator('text=No providers configured yet.')).toBeVisible();
      
      // Close modal - use force click for mobile compatibility
      await page.click('button:has-text("Done")', { force: true });
      await expect(page.locator('text=Model Selection')).not.toBeVisible();
    });
  });

  test.describe('AI Ensemble Query', () => {
    test('should show validation message when no models selected', async () => {
      // Enter a test prompt
      await page.fill('textarea[placeholder*="Enter your prompt here"]', testPrompts.simple);
      
      // Should show validation message
      await expect(page.locator('text=Select at least 2 AI models to start')).toBeVisible();
      
      // Submit button should be disabled
      await expect(page.locator('button:has-text("Compare 0 Models")')).toBeDisabled();
    });

    test('should show validation message when no prompt entered', async () => {
      // Should show validation message
      await expect(page.locator('text=Configure providers and select 2-8 AI models to start comparing responses.')).toBeVisible();
      
      // Submit button should be disabled
      await expect(page.locator('button:has-text("Compare 0 Models")')).toBeDisabled();
    });
  });

  test.describe('Sharing Functionality', () => {
    test('should not show share button when no responses available', async () => {
      // Should not show share button when no responses
      await expect(page.locator('button:has-text("Share Response")')).not.toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid API keys gracefully', async () => {
      await page.click('text=Configure Providers (0/4)');
      await page.fill('input[placeholder*="sk-..."]', 'invalid-key');
      await page.waitForTimeout(2000); // Wait for validation
      
      // Should show error
      await expect(page.locator('text=❌ Invalid API key')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page: mobilePage }) => {
      await mobilePage.setViewportSize({ width: 375, height: 667 });
      await mobilePage.goto('/');
      
      // Should show mobile-friendly layout
      await expect(mobilePage.locator('h1')).toBeVisible();
      await expect(mobilePage.locator('textarea[placeholder*="Enter your prompt here"]')).toBeVisible();
    });
  });
});

