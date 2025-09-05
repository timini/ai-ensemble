import { test, expect } from '@playwright/test';

test.describe('Manual Response E-2-E Tests', () => {
  test.slow(); 
  test.setTimeout(120000); // 2 minutes timeout for all tests in this suite

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Seed localStorage with pre-configured providers and models to bypass UI setup
    await page.evaluate((envVars) => {
      localStorage.setItem('ensemble-provider-keys', JSON.stringify({
        openai: envVars.OPENAI_API_KEY || 'test-key',
        google: envVars.GOOGLE_API_KEY || 'test-key',
        anthropic: envVars.ANTHROPIC_API_KEY || 'test-key',
        grok: envVars.GROK_API_KEY || '',
      }));
      localStorage.setItem('ensemble-selected-models', JSON.stringify([
        { id: 'openai-gpt-4', name: 'OpenAI gpt-4', provider: 'openai', model: 'gpt-4' },
        { id: 'google-gemini-pro', name: 'Google gemini-pro', provider: 'google', model: 'gemini-pro' },
      ]));
      localStorage.setItem('ensemble-prompt', 'What is the capital of France?');
      localStorage.setItem('ensemble-summarizer', 'openai-gpt-4');
    }, {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      GROK_API_KEY: process.env.GROK_API_KEY,
    });

    await page.reload();
    
    // Wait for the page to load with seeded data
    await expect(page.locator('button:has-text("Select Models (2/8)")')).toBeVisible();
  });

  test('Manual responses appear in agreement analysis and consensus', async ({ page }) => {
    // Add a manual response
    await page.getByRole('button', { name: '+ Add Model' }).click();
    await page.getByRole('button', { name: 'Manual Response' }).click();
    await page.getByLabel('Model Name').fill('Manual Model with spaces');
    await page.getByLabel('Response').fill('Paris, the city of lights, is the capital of France.');
    await page.getByRole('button', { name: 'Add Manual Response' }).click();

    await expect(page.locator('.group').filter({ hasText: 'Manual Model with spaces' })).toBeVisible();

    // Run the query
    await page.getByRole('button', { name: 'Compare 3 Models' }).click();

    // Wait for individual responses to complete (with longer timeout for AI responses)
    await expect(page.locator('h3:has-text("OpenAI gpt-4")')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('h3:has-text("Google gemini-pro")')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('h3:has-text("Manual Model with spaces")')).toBeVisible({ timeout: 30000 });

    // Wait for agreement analysis to complete
    await expect(page.getByRole('heading', { name: /Agreement Analysis/ })).toBeVisible({ timeout: 30000 });
    
    // Verify manual response appears in the agreement analysis
    await expect(page.locator('h3:has-text("Manual Model with spaces")')).toBeVisible();
    
    // Wait for consensus to be generated
    await expect(page.getByRole('heading', { name: /Consensus Response/ })).toBeVisible({ timeout: 30000 });
    
    // Verify consensus references manual content (scope within the Consensus Response section only)
    const consensusHeading = page.getByRole('heading', { name: /Consensus Response/ });
    const consensusSection = consensusHeading.locator('..').locator('..');
    const consensusText = consensusSection.locator('.prose');
    await expect(consensusText).toContainText('manual response');
  });
  
  test('No provider error for manual model with invalid name', async ({ page }) => {
    // Add a manual response
    await page.getByRole('button', { name: '+ Add Model' }).click();
    await page.getByRole('button', { name: 'Manual Response' }).click();
    await page.getByLabel('Model Name').fill('invalid api model name');
    await page.getByLabel('Response').fill('Some content.');
    await page.getByRole('button', { name: 'Add Manual Response' }).click();
    
    await expect(page.locator('.group').filter({ hasText: 'invalid api model name' })).toBeVisible();

    // Run query and expect it not to crash
    await page.getByRole('button', { name: 'Compare 3 Models' }).click();
    
    // Wait for individual responses to complete
    await expect(page.locator('h3:has-text("OpenAI gpt-4")')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('h3:has-text("Google gemini-pro")')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('h3:has-text("invalid api model name")')).toBeVisible({ timeout: 30000 });

    // Wait for consensus to be generated
    const consensusHeading = page.getByRole('heading', { name: /Consensus Response/ });
    await expect(consensusHeading).toBeVisible({ timeout: 30000 });
    expect(page.url()).not.toContain('error');
  });
});
