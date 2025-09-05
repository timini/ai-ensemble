import { test, expect } from '@playwright/test';

test.describe('Manual Response Agreement Analysis', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should include manual response in agreement analysis', async ({ page }) => {
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

    // Fill in the manual response form
    await page.selectOption('select#provider', 'anthropic');
    await page.fill('input#modelName', 'Claude-3-Sonnet');
    await page.fill('textarea#response', 'The capital of France is Paris. It is located in the north-central part of the country and is known for its rich history, culture, and landmarks like the Eiffel Tower.');

    // Submit the manual response
    await page.click('button:has-text("Add Response")');

    // Wait for the manual response to appear in Individual Responses
    await expect(page.locator('text=Anthropic - Claude-3-Sonnet (Manual)')).toBeVisible();

    // Wait for consensus to regenerate
    await expect(page.locator('text=Consensus Response')).toBeVisible();

    // Check that the manual response appears in Agreement Analysis
    await expect(page.locator('text=Agreement Analysis')).toBeVisible();
    
    // Look for the manual response in the agreement scores
    // The agreement analysis should show scores for all models including the manual one
    await expect(page.locator('text=Anthropic - Claude-3-Sonnet')).toBeVisible();
    
    // Check that there are agreement scores displayed
    await expect(page.locator('[data-testid="agreement-scores"]')).toBeVisible();
  });

  test('should show agreement scores for all responses including manual ones', async ({ page }) => {
    // Configure providers
    await page.click('button:has-text("Configure Providers")');
    await page.fill('input[placeholder="sk-..."]', 'test-openai-key');
    await page.fill('input[placeholder="Your Google AI API key"]', 'test-google-key');
    await page.click('button:has-text("Done")');

    // Select models
    await page.click('button:has-text("Select Models")');
    await page.check('input[value="gpt-4"]');
    await page.check('input[value="gemini-2.5-pro"]');
    await page.click('button:has-text("Done")');

    // Enter a prompt
    await page.fill('textarea[placeholder="Enter your prompt here..."]', 'Explain quantum computing in simple terms.');

    // Submit the form
    await page.click('button:has-text("Compare 2 Models")');

    // Wait for individual responses to complete
    await expect(page.locator('text=OpenAI - GPT-4')).toBeVisible();
    await expect(page.locator('text=Google - Gemini-2.5-Pro')).toBeVisible();

    // Add a manual response
    await page.click('button:has-text("+ Add Manual Response")');
    await page.selectOption('select#provider', 'anthropic');
    await page.fill('input#modelName', 'Claude-3-Opus');
    await page.fill('textarea#response', 'Quantum computing is like having a computer that can be in multiple states at once, allowing it to solve certain problems much faster than regular computers.');
    await page.click('button:has-text("Add Response")');

    // Wait for the manual response to appear
    await expect(page.locator('text=Anthropic - Claude-3-Opus (Manual)')).toBeVisible();

    // Wait for agreement analysis to complete
    await expect(page.locator('text=Agreement Analysis')).toBeVisible();

    // Check that we have agreement scores for all 3 models (2 original + 1 manual)
    const agreementScores = page.locator('[data-testid="agreement-score"]');
    await expect(agreementScores).toHaveCount(3);

    // Verify that the manual response is included in the agreement analysis
    await expect(page.locator('text=Anthropic - Claude-3-Opus')).toBeVisible();
  });

  test('should regenerate agreement analysis when adding multiple manual responses', async ({ page }) => {
    // Configure providers
    await page.click('button:has-text("Configure Providers")');
    await page.fill('input[placeholder="sk-..."]', 'test-openai-key');
    await page.fill('input[placeholder="Your Google AI API key"]', 'test-google-key');
    await page.click('button:has-text("Done")');

    // Select models
    await page.click('button:has-text("Select Models")');
    await page.check('input[value="gpt-4"]');
    await page.check('input[value="gemini-2.5-pro"]');
    await page.click('button:has-text("Done")');

    // Enter a prompt
    await page.fill('textarea[placeholder="Enter your prompt here..."]', 'What are the benefits of renewable energy?');

    // Submit the form
    await page.click('button:has-text("Compare 2 Models")');

    // Wait for individual responses to complete
    await expect(page.locator('text=OpenAI - GPT-4')).toBeVisible();
    await expect(page.locator('text=Google - Gemini-2.5-Pro')).toBeVisible();

    // Add first manual response
    await page.click('button:has-text("+ Add Manual Response")');
    await page.selectOption('select#provider', 'anthropic');
    await page.fill('input#modelName', 'Claude-3-Sonnet');
    await page.fill('textarea#response', 'Renewable energy reduces greenhouse gas emissions and provides sustainable power sources.');
    await page.click('button:has-text("Add Response")');

    // Wait for first manual response
    await expect(page.locator('text=Anthropic - Claude-3-Sonnet (Manual)')).toBeVisible();

    // Add second manual response
    await page.click('button:has-text("+ Add Manual Response")');
    await page.selectOption('select#provider', 'grok');
    await page.fill('input#modelName', 'Grok-2');
    await page.fill('textarea#response', 'Renewable energy creates jobs, reduces energy costs, and helps combat climate change.');
    await page.click('button:has-text("Add Response")');

    // Wait for second manual response
    await expect(page.locator('text=Grok - Grok-2 (Manual)')).toBeVisible();

    // Wait for agreement analysis to complete
    await expect(page.locator('text=Agreement Analysis')).toBeVisible();

    // Check that we have agreement scores for all 4 models (2 original + 2 manual)
    const agreementScores = page.locator('[data-testid="agreement-score"]');
    await expect(agreementScores).toHaveCount(4);

    // Verify both manual responses are included
    await expect(page.locator('text=Anthropic - Claude-3-Sonnet')).toBeVisible();
    await expect(page.locator('text=Grok - Grok-2')).toBeVisible();
  });
});
