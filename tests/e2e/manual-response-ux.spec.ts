import { test, expect } from '@playwright/test';

test.describe('Manual Response UX Tests', () => {
  // Use a shared setup to seed localStorage
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
    // Wait for providers to be configured. The count should reflect the number of keys set.
    await expect(page.locator('button:has-text("Configure Providers (2/4)")')).toBeVisible();
  });

  test('should allow adding and removing manual responses via model slots', async ({ page }) => {
    // Select models
    await page.click('button:has-text("Select Models")');
    await page.check('input[value="gpt-4"]');
    await page.check('input[value="gemini-pro"]');
    await page.click('button:has-text("Done")');

    // Add a manual response via the main button
    await page.click('button:has-text("+ Add Manual Response")');
    await page.fill('input[name="modelName"]', 'My Test Model');
    await page.selectOption('select[name="provider"]', 'openai');
    await page.fill('textarea[name="response"]', 'This is a test response.');
    await page.click('button:has-text("Add Manual Response")');

    // Verify the manual response is in the selected models display
    await expect(page.locator('text=My Test Model (Manual)')).toBeVisible();

    // Remove the manual response
    await page.click('[aria-label="Remove My Test Model (Manual)"]');
    await expect(page.locator('text=My Test Model (Manual)')).not.toBeVisible();
  });

  test('should show manual response preview in model slots', async ({ page }) => {
    // Configure providers first
    await page.click('button:has-text("Configure Providers")');
    await page.fill('input[placeholder="sk-..."]', process.env.OPENAI_API_KEY || 'test-key');
    await page.fill('input[placeholder="Your Google AI API key"]', process.env.GOOGLE_API_KEY || 'test-key');
    await page.click('button:has-text("Done")');

    // Select models
    await page.click('button:has-text("Select Models")');
    await page.check('input[value="gpt-4"]');
    await page.check('input[value="gemini-2.5-pro"]');
    await page.click('button:has-text("Done")');

    // Add a manual response with a long response text
    await page.click('button:has-text("+ Add Model")');
    await page.click('button:has-text("Manual Response")');
    await page.selectOption('select#manualProvider', 'anthropic');
    await page.fill('input#manualModelName', 'Claude-3-Sonnet');
    await page.fill('textarea#manualResponse', 'This is a very long manual response that should be truncated in the model slot preview. It contains multiple sentences and should show only the first part with an ellipsis.');
    await page.click('button:has-text("Add Manual Response")');

    // Wait for the manual response to appear
    await expect(page.locator('text=Anthropic - Claude-3-Sonnet')).toBeVisible();
    await expect(page.locator('text=Manual')).toBeVisible();

    // Check that the response preview is truncated
    const responsePreview = page.locator('text=This is a very long manual response that should be truncated...');
    await expect(responsePreview).toBeVisible();

    // Check that the full response is available in the title attribute
    const modelCard = page.locator('text=Anthropic - Claude-3-Sonnet').locator('..').locator('..');
    const titleAttribute = await modelCard.getAttribute('title');
    expect(titleAttribute).toContain('This is a very long manual response that should be truncated');
  });

  test('should allow adding multiple manual responses', async ({ page }) => {
    // Configure providers first
    await page.click('button:has-text("Configure Providers")');
    await page.fill('input[placeholder="sk-..."]', process.env.OPENAI_API_KEY || 'test-key');
    await page.fill('input[placeholder="Your Google AI API key"]', process.env.GOOGLE_API_KEY || 'test-key');
    await page.click('button:has-text("Done")');

    // Select models
    await page.click('button:has-text("Select Models")');
    await page.check('input[value="gpt-4"]');
    await page.check('input[value="gemini-2.5-pro"]');
    await page.click('button:has-text("Done")');

    // Add first manual response
    await page.click('button:has-text("+ Add Model")');
    await page.click('button:has-text("Manual Response")');
    await page.selectOption('select#manualProvider', 'anthropic');
    await page.fill('input#manualModelName', 'Claude-3-Sonnet');
    await page.fill('textarea#manualResponse', 'First manual response');
    await page.click('button:has-text("Add Manual Response")');

    // Wait for first manual response
    await expect(page.locator('text=Anthropic - Claude-3-Sonnet')).toBeVisible();

    // Add second manual response
    await page.click('button:has-text("+ Add Model")');
    await page.click('button:has-text("Manual Response")');
    await page.selectOption('select#manualProvider', 'grok');
    await page.fill('input#manualModelName', 'Grok-2');
    await page.fill('textarea#manualResponse', 'Second manual response');
    await page.click('button:has-text("Add Manual Response")');

    // Wait for second manual response
    await expect(page.locator('text=Grok - Grok-2')).toBeVisible();

    // Check that both manual responses show the Manual badge
    const manualBadges = page.locator('text=Manual');
    await expect(manualBadges).toHaveCount(2);

    // Check that the model count is correct
    await expect(page.locator('button:has-text("Select Models (4/8)")')).toBeVisible();
  });

  test('should validate manual response form fields', async ({ page }) => {
    // Configure providers first
    await page.click('button:has-text("Configure Providers")');
    await page.fill('input[placeholder="sk-..."]', process.env.OPENAI_API_KEY || 'test-key');
    await page.fill('input[placeholder="Your Google AI API key"]', process.env.GOOGLE_API_KEY || 'test-key');
    await page.click('button:has-text("Done")');

    // Select models
    await page.click('button:has-text("Select Models")');
    await page.check('input[value="gpt-4"]');
    await page.check('input[value="gemini-2.5-pro"]');
    await page.click('button:has-text("Done")');

    // Open the AddModelModal
    await page.click('button:has-text("+ Add Model")');
    await page.click('button:has-text("Manual Response")');

    // Try to submit without filling required fields
    const submitButton = page.locator('button:has-text("Add Manual Response")');
    await expect(submitButton).toBeDisabled();

    // Fill only the model name
    await page.fill('input#manualModelName', 'Test Model');
    await expect(submitButton).toBeDisabled();

    // Fill only the response
    await page.fill('input#manualModelName', '');
    await page.fill('textarea#manualResponse', 'Test response');
    await expect(submitButton).toBeDisabled();

    // Fill both required fields
    await page.fill('input#manualModelName', 'Test Model');
    await page.fill('textarea#manualResponse', 'Test response');
    await expect(submitButton).toBeEnabled();
  });
});
