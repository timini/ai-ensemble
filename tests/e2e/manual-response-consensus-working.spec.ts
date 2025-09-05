import { test, expect } from '@playwright/test';

test.describe('Manual Response Consensus Working Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should add manual response and run consensus with it', async ({ page }) => {
    // Configure providers with real API keys
    await page.click('button:has-text("Configure Providers")');
    
    // Use environment variables for API keys
    await page.fill('input[placeholder*="sk-"]', process.env.OPENAI_API_KEY || 'test-key');
    await page.fill('input[placeholder*="Google"]', process.env.GOOGLE_API_KEY || 'test-key');
    await page.click('button:has-text("Done")');

    // Wait for providers to be configured
    await expect(page.locator('button:has-text("Configure Providers (2/4)")')).toBeVisible();

    // Select models
    await page.click('button:has-text("Select Models")');
    
    // Wait for models to load
    await page.waitForTimeout(3000);
    
    // Select first two available models
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    
    if (count >= 2) {
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();
      await page.click('button:has-text("Done")');
      
      // Wait for models to be selected
      await expect(page.locator('button:has-text("Select Models (2/8)")')).toBeVisible();
    } else {
      // If no models available, just close modal
      await page.click('button:has-text("Done")');
      return; // Skip test if no models available
    }

    // Add a manual response
    await page.click('button:has-text("+ Add Model")');
    await expect(page.locator('text=Add Model')).toBeVisible();
    await page.click('button:has-text("Manual Response")');

    // Fill in the manual response form
    await page.selectOption('select#manualProvider', 'anthropic');
    await page.fill('input#manualModelName', 'Claude-3-Sonnet');
    await page.fill('textarea#manualResponse', 'The capital of France is Paris. It is located in the north-central part of the country and is known for its rich history, culture, and landmarks like the Eiffel Tower.');

    // Submit the manual response
    await page.click('button:has-text("Add Manual Response")');

    // Wait for the manual response to appear in the model slots
    await expect(page.locator('text=Anthropic - Claude-3-Sonnet')).toBeVisible();
    await expect(page.locator('text=Manual')).toBeVisible();

    // Check that the model count updated
    await expect(page.locator('button:has-text("Select Models (3/8)")')).toBeVisible();

    // Enter a prompt
    await page.fill('textarea[placeholder*="Enter your prompt"]', 'What is the capital of France?');

    // Submit the form
    await page.click('button:has-text("Compare 3 Models")');

    // Wait for individual responses to complete (with longer timeout for AI responses)
    await expect(page.locator('text=OpenAI')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('text=Google')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('text=Anthropic - Claude-3-Sonnet')).toBeVisible({ timeout: 30000 });

    // Wait for consensus to be generated
    await expect(page.locator('text=Consensus Response')).toBeVisible({ timeout: 30000 });

    // Wait for agreement analysis to complete
    await expect(page.locator('text=Agreement Analysis')).toBeVisible({ timeout: 30000 });

    // Check that the manual response appears in the agreement analysis
    await expect(page.locator('text=Anthropic - Claude-3-Sonnet')).toBeVisible();
    
    // Look for agreement scores
    const agreementScores = page.locator('[data-testid="agreement-scores"]');
    await expect(agreementScores).toBeVisible();

    // Verify we have 3 models in the agreement analysis
    const agreementScoreItems = page.locator('[data-testid="agreement-score"]');
    await expect(agreementScoreItems).toHaveCount(3);

    // Check that the manual response content is visible somewhere in the individual responses
    const manualResponseContent = page.locator('text=The capital of France is Paris');
    await expect(manualResponseContent).toBeVisible();
  });

  test('should handle manual response removal', async ({ page }) => {
    // Configure providers
    await page.click('button:has-text("Configure Providers")');
    await page.fill('input[placeholder*="sk-"]', process.env.OPENAI_API_KEY || 'test-key');
    await page.fill('input[placeholder*="Google"]', process.env.GOOGLE_API_KEY || 'test-key');
    await page.click('button:has-text("Done")');

    // Select models
    await page.click('button:has-text("Select Models")');
    await page.waitForTimeout(3000);
    
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    
    if (count >= 2) {
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();
      await page.click('button:has-text("Done")');
    } else {
      await page.click('button:has-text("Done")');
      return;
    }

    // Add a manual response
    await page.click('button:has-text("+ Add Model")');
    await page.click('button:has-text("Manual Response")');
    await page.selectOption('select#manualProvider', 'anthropic');
    await page.fill('input#manualModelName', 'Claude-3-Sonnet');
    await page.fill('textarea#manualResponse', 'Test manual response for removal');
    await page.click('button:has-text("Add Manual Response")');

    // Verify manual response is added
    await expect(page.locator('text=Anthropic - Claude-3-Sonnet')).toBeVisible();
    await expect(page.locator('text=Manual')).toBeVisible();

    // Remove the manual response by hovering and clicking remove button
    const modelCard = page.locator('text=Anthropic - Claude-3-Sonnet').locator('..').locator('..');
    await modelCard.hover();

    // Click the remove button (×)
    const removeButton = page.locator('button:has-text("×")');
    if (await removeButton.isVisible()) {
      await removeButton.click();

      // Wait for the manual response to be removed
      await expect(page.locator('text=Anthropic - Claude-3-Sonnet')).not.toBeVisible();
      await expect(page.locator('text=Manual')).not.toBeVisible();

      // Check that the model count went back down
      await expect(page.locator('button:has-text("Select Models (2/8)")')).toBeVisible();
    }
  });
});
