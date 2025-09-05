import { test, expect } from '@playwright/test';

test.describe('Manual Response Debug', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show manual response in agreement analysis when added', async ({ page }) => {
    // This test will help us debug the manual response issue
    // We'll check the browser console for any errors
    
    // Set up console logging
    page.on('console', msg => {
      console.log('Browser console:', msg.text());
    });

    // Configure providers with fake keys
    await page.click('button:has-text("Configure Providers")');
    await page.fill('input[placeholder="sk-..."]', 'test-openai-key');
    await page.fill('input[placeholder="Your Google AI API key"]', 'test-google-key');
    
    // Use force click to avoid interception issues
    await page.click('button:has-text("Done")', { force: true });

    // Wait a bit for the modal to close
    await page.waitForTimeout(1000);

    // Check if we can see the configured providers
    const providerButton = page.locator('button:has-text("Configure Providers")');
    await expect(providerButton).toBeVisible();

    // Try to select models (this might fail due to fake keys, but that's ok)
    await page.click('button:has-text("Select Models")');
    
    // Wait for the modal to open
    await page.waitForTimeout(1000);

    // Check if we can see any model checkboxes
    const modelCheckboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await modelCheckboxes.count();
    console.log(`Found ${checkboxCount} checkboxes`);

    // If we have checkboxes, try to select them
    if (checkboxCount > 0) {
      await modelCheckboxes.first().check();
      if (checkboxCount > 1) {
        await modelCheckboxes.nth(1).check();
      }
    }

    // Close the modal
    await page.click('button:has-text("Done")', { force: true });

    // Enter a prompt
    await page.fill('textarea[placeholder="Enter your prompt here..."]', 'Test prompt');

    // Try to submit (this might fail due to fake keys)
    await page.click('button:has-text("Compare")');

    // Wait a bit to see what happens
    await page.waitForTimeout(3000);

    // Check if we can see the Add Manual Response button
    const addManualButton = page.locator('button:has-text("+ Add Manual Response")');
    const isVisible = await addManualButton.isVisible();
    console.log(`Add Manual Response button visible: ${isVisible}`);

    if (isVisible) {
      // Click the button
      await addManualButton.click();

      // Fill in the manual response
      await page.selectOption('select#provider', 'anthropic');
      await page.fill('input#modelName', 'Claude-3-Sonnet');
      await page.fill('textarea#response', 'This is a test manual response.');

      // Submit the manual response
      await page.click('button:has-text("Add Response")');

      // Wait for the response to appear
      await page.waitForTimeout(2000);

      // Check if the manual response appears in the individual responses
      const manualResponse = page.locator('text=Anthropic - Claude-3-Sonnet (Manual)');
      const manualVisible = await manualResponse.isVisible();
      console.log(`Manual response visible: ${manualVisible}`);

      // Check if agreement analysis shows the manual response
      const agreementSection = page.locator('text=Agreement Analysis');
      const agreementVisible = await agreementSection.isVisible();
      console.log(`Agreement Analysis visible: ${agreementVisible}`);

      if (agreementVisible) {
        // Look for the manual response in the agreement scores
        const agreementScores = page.locator('[data-testid="agreement-scores"]');
        const scoresVisible = await agreementScores.isVisible();
        console.log(`Agreement scores visible: ${scoresVisible}`);

        if (scoresVisible) {
          const scoreText = await agreementScores.textContent();
          console.log(`Agreement scores content: ${scoreText}`);
          
          // Check if the manual response model name appears in the scores
          const hasManualModel = scoreText?.includes('Claude-3-Sonnet') || scoreText?.includes('Anthropic');
          console.log(`Manual model in agreement scores: ${hasManualModel}`);
        }
      }
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: 'manual-response-debug.png' });
  });
});
