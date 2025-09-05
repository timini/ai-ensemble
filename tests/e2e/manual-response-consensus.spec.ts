import { test, expect } from '@playwright/test';

test.describe('Manual Response Consensus Test', () => {
  // Use a shared setup to seed localStorage
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
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
    await expect(page.locator('button:has-text("Select Models (2/8)")')).toBeVisible();
  });

  test('should add manual response and include it in consensus and agreement analysis', async ({ page }) => {
    // Add a manual response
    await page.getByRole('button', { name: '+ Add Model' }).click();
    await page.getByRole('button', { name: 'Manual Response' }).click();
    await page.getByLabel('Model Name').fill('Manual Model');
    await page.getByLabel('Response').fill('The capital of France is Paris.');
    await page.getByRole('button', { name: 'Add Manual Response' }).click();

    // Verify the manual response is in the selected models display
    await expect(page.locator('text=Manual Model (Manual)')).toBeVisible();

    // Run the query
    await page.getByRole('button', { name: 'Compare 3 Models' }).click();

    // Wait for agreement analysis and consensus to complete
    await expect(page.getByRole('heading', { name: /Agreement Analysis/ })).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('heading', { name: /Consensus Response/ })).toBeVisible({ timeout: 30000 });

    // Verify manual response appears in the agreement analysis
    await expect(page.locator('h3:has-text("Manual Model")')).toBeVisible();
  });
});
