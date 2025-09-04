import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should load the application without errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that the page loads without JavaScript errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Basic UI elements should be present
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Configuration')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="Enter your prompt here"]')).toBeVisible();
    
    // Should not have critical JavaScript errors
    expect(errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('Failed to load resource')
    )).toHaveLength(0);
  });

  test('should have working navigation and basic interactions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test that buttons are clickable
    await expect(page.locator('text=Configure Providers (0/4)')).toBeEnabled();
    await expect(page.locator('text=Select Models (0/8)')).toBeEnabled();
    await expect(page.locator('button:has-text("Compare 0 Models")')).toBeVisible();
    
    // Test that textarea is editable
    const textarea = page.locator('textarea[placeholder*="Enter your prompt here"]');
    await textarea.fill('Test prompt');
    await expect(textarea).toHaveValue('Test prompt');
  });

  test('should handle provider configuration modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Click provider configuration
    await page.click('text=Configure Providers (0/4)');
    
    // Modal should open
    await expect(page.locator('text=AI Provider Configuration')).toBeVisible();
    
    // Should have input fields for API keys
    await expect(page.locator('input[placeholder*="sk-..."]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Your Google AI API key"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Your Anthropic API key"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Your X.AI API key"]')).toBeVisible();
    
    // Should have done button
    await expect(page.locator('button:has-text("Done")')).toBeVisible();
    
    // Close modal - use force click for mobile compatibility
    await page.click('button:has-text("Done")', { force: true });
    await expect(page.locator('text=AI Provider Configuration')).not.toBeVisible();
  });

  test('should handle model selection modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Click model selection
    await page.click('text=Select Models (0/8)');
    
    // Modal should open
    await expect(page.locator('text=Model Selection')).toBeVisible();
    
    // Should show message about no providers configured
    await expect(page.locator('text=No providers configured yet.')).toBeVisible();
    
    // Should have done button
    await expect(page.locator('button:has-text("Done")')).toBeVisible();
    
    // Close modal - use force click for mobile compatibility
    await page.click('button:has-text("Done")', { force: true });
    await expect(page.locator('text=Model Selection')).not.toBeVisible();
  });
});

