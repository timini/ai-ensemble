import { test, expect } from '@playwright/test';

test.describe('Manual Response Simple Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show Add Manual Response button when individual models complete', async ({ page }) => {
    // Configure providers first
    await page.click('button:has-text("Configure Providers")');
    await page.fill('input[placeholder="sk-..."]', 'test-openai-key');
    await page.fill('input[placeholder="Your Google AI API key"]', 'test-google-key');
    await page.click('button:has-text("Done")');

    // Wait for providers to be configured
    await expect(page.locator('button:has-text("Configure Providers (2/4)")')).toBeVisible();

    // Select models
    await page.click('button:has-text("Select Models")');
    await page.check('input[value="gpt-4"]');
    await page.check('input[value="gemini-2.5-pro"]');
    await page.click('button:has-text("Done")');

    // Wait for models to be selected
    await expect(page.locator('button:has-text("Select Models (2/8)")')).toBeVisible();

    // Enter a prompt
    await page.fill('textarea[placeholder="Enter your prompt here..."]', 'What is the capital of France?');

    // Submit the form
    await page.click('button:has-text("Compare 2 Models")');

    // Wait for individual responses to complete
    await expect(page.locator('text=OpenAI - GPT-4')).toBeVisible();
    await expect(page.locator('text=Google - Gemini-2.5-Pro')).toBeVisible();

    // Wait for the Add Manual Response button to appear
    await expect(page.locator('button:has-text("+ Add Manual Response")')).toBeVisible();

    // Click Add Manual Response button
    await page.click('button:has-text("+ Add Manual Response")');

    // Check that the modal opens
    await expect(page.locator('text=Add Manual Response')).toBeVisible();

    // Fill in the manual response form
    await page.selectOption('select#provider', 'anthropic');
    await page.fill('input#modelName', 'Claude-3-Sonnet');
    await page.fill('textarea#response', 'The capital of France is Paris.');

    // Submit the manual response
    await page.click('button:has-text("Add Response")');

    // Wait for the manual response to appear in Individual Responses
    await expect(page.locator('text=Anthropic - Claude-3-Sonnet (Manual)')).toBeVisible();

    // Check that consensus regenerates
    await expect(page.locator('text=Consensus Response')).toBeVisible();
  });
});
