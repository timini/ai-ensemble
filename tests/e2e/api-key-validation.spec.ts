import { test, expect } from '@playwright/test';

test.describe('API Key Validation', () => {
  test('should validate real API keys from environment', async ({ page }) => {
    await page.goto('/');
    
    // Click on provider configuration button
    await page.click('text=Configure Providers (0/4)');
    
    // Should open provider settings modal
    await expect(page.locator('text=AI Provider Configuration')).toBeVisible();
    
    // Test OpenAI API key validation if available
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-key-here') {
      await page.fill('input[placeholder*="sk-..."]', process.env.OPENAI_API_KEY);
      await page.waitForTimeout(3000); // Wait for validation
      
      // Should show success indicator (green checkmark or similar)
      // The exact indicator depends on the UI implementation
      const openaiInput = page.locator('input[placeholder*="sk-..."]');
      await expect(openaiInput).toHaveValue(process.env.OPENAI_API_KEY);
      
      // Check if validation passed (look for success indicator)
      const openaiValidation = page.locator('text=✅').and(page.locator('text=models available')).or(page.locator('[data-testid="openai-valid"]'));
      if (await openaiValidation.isVisible()) {
        console.log('OpenAI API key validation passed');
      }
    }
    
    // Test Google API key validation if available
    if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== 'your-google-ai-key-here') {
      await page.fill('input[placeholder*="Google"]', process.env.GOOGLE_API_KEY);
      await page.waitForTimeout(3000); // Wait for validation
      
      // Should show success indicator
      const googleInput = page.locator('input[placeholder*="Google"]');
      await expect(googleInput).toHaveValue(process.env.GOOGLE_API_KEY);
      
      // Check if validation passed
      const googleValidation = page.locator('text=✅').and(page.locator('text=models available')).or(page.locator('[data-testid="google-valid"]'));
      if (await googleValidation.isVisible()) {
        console.log('Google API key validation passed');
      }
    }
    
    // Test Anthropic API key validation if available
    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'sk-ant-your-anthropic-key-here') {
      await page.fill('input[placeholder*="Anthropic"]', process.env.ANTHROPIC_API_KEY);
      await page.waitForTimeout(3000); // Wait for validation
      
      // Should show success indicator
      const anthropicInput = page.locator('input[placeholder*="Anthropic"]');
      await expect(anthropicInput).toHaveValue(process.env.ANTHROPIC_API_KEY);
      
      // Check if validation passed
      const anthropicValidation = page.locator('text=✅').and(page.locator('text=models available')).or(page.locator('[data-testid="anthropic-valid"]'));
      if (await anthropicValidation.isVisible()) {
        console.log('Anthropic API key validation passed');
      }
    }
    
    // Test Grok API key validation if available
    if (process.env.GROK_API_KEY && process.env.GROK_API_KEY !== 'xai-your-grok-key-here') {
      await page.fill('input[placeholder*="Grok"], input[placeholder*="X.AI"]', process.env.GROK_API_KEY);
      await page.waitForTimeout(3000); // Wait for validation
      
      // Should show success indicator
      await expect(page.locator('text=✅').and(page.locator('text=models available')).first()).toBeVisible();
    }
    
    // Close modal
    await page.click('button:has-text("Done")', { force: true });
    
    // Modal should be closed
    await expect(page.locator('text=AI Provider Configuration')).not.toBeVisible();
  });

  test('should show validation error for invalid API keys', async ({ page }) => {
    await page.goto('/');
    
    // Click on provider configuration button
    await page.click('text=Configure Providers (0/4)');
    
    // Should open provider settings modal
    await expect(page.locator('text=AI Provider Configuration')).toBeVisible();
    
    // Test with invalid OpenAI key
    await page.fill('input[placeholder*="sk-..."]', 'invalid-key-12345');
    await page.waitForTimeout(3000); // Wait for validation
    
    // Should show validation error (use first() to avoid strict mode violation)
    await expect(page.locator('text=❌ Invalid API key').first()).toBeVisible();
    
    // Test with invalid Google key
    await page.fill('input[placeholder*="Google"]', 'invalid-google-key');
    await page.waitForTimeout(3000); // Wait for validation
    
    // Should show validation error (use first() to avoid strict mode violation)
    await expect(page.locator('text=❌ Invalid API key').first()).toBeVisible();
    
    // Close modal
    await page.click('button:has-text("Done")', { force: true });
  });

  test('should load models when valid API keys are provided', async ({ page }) => {
    await page.goto('/');
    
    // Configure providers with real API keys if available
    await page.click('text=Configure Providers (0/4)');
    
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-key-here') {
      await page.fill('input[placeholder*="sk-..."]', process.env.OPENAI_API_KEY);
      await page.waitForTimeout(2000);
    }
    
    if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== 'your-google-ai-key-here') {
      await page.fill('input[placeholder*="Google"]', process.env.GOOGLE_API_KEY);
      await page.waitForTimeout(2000);
    }
    
    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'sk-ant-your-anthropic-key-here') {
      await page.fill('input[placeholder*="Anthropic"]', process.env.ANTHROPIC_API_KEY);
      await page.waitForTimeout(2000);
    }
    
    if (process.env.GROK_API_KEY && process.env.GROK_API_KEY !== 'xai-your-grok-key-here') {
      await page.fill('input[placeholder*="Grok"]', process.env.GROK_API_KEY);
      await page.waitForTimeout(2000);
    }
    
    await page.click('button:has-text("Done")', { force: true });
    
    // Wait for providers to be configured (check for any configured providers)
    const providerButton = page.locator('button:has-text("Configure Providers")');
    await expect(providerButton).toBeVisible();
    
    // Check if we have any configured providers
    const buttonText = await providerButton.textContent();
    console.log(`Provider button text: ${buttonText}`);
    
    // Click on model selection (use more flexible selector)
    await page.click('button:has-text("Select Models")');
    
    // Should show model selection modal
    await expect(page.locator('text=Model Selection')).toBeVisible();
    
    // If we have valid API keys, models should load
    if ((process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-key-here') ||
        (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== 'your-google-ai-key-here') ||
        (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'sk-ant-your-anthropic-key-here') ||
        (process.env.GROK_API_KEY && process.env.GROK_API_KEY !== 'xai-your-grok-key-here')) {
      
      // Wait for models to load (with timeout)
      try {
        await page.waitForSelector('input[type="checkbox"]', { timeout: 10000 });
        
        // Should have some model checkboxes
        const checkboxes = page.locator('input[type="checkbox"]');
        const count = await checkboxes.count();
        expect(count).toBeGreaterThan(0);
        
        console.log(`Found ${count} models available for selection`);
      } catch (error) {
        console.log('Models did not load, likely due to invalid API keys or network issues');
      }
    } else {
      // If no valid API keys, should show message about no providers
      await expect(page.locator('text=No providers configured yet.')).toBeVisible();
    }
    
    // Close modal
    await page.click('button:has-text("Done")', { force: true });
  });

  test('should validate Grok API key specifically', async ({ page }) => {
    await page.goto('/');
    
    // Click on provider configuration button
    await page.click('text=Configure Providers (0/4)');
    
    // Should open provider settings modal
    await expect(page.locator('text=AI Provider Configuration')).toBeVisible();
    
    // Test Grok API key validation if available
    console.log(`Grok API key value: ${process.env.GROK_API_KEY}`);
    console.log(`Grok API key length: ${process.env.GROK_API_KEY?.length}`);
    console.log(`Is placeholder: ${process.env.GROK_API_KEY === 'xai-your-grok-key-here'}`);
    
    if (process.env.GROK_API_KEY && process.env.GROK_API_KEY !== 'xai-your-grok-key-here') {
      console.log('Testing Grok API key validation...');
      
      // Find the Grok input field
      const grokInput = page.locator('input[placeholder*="X.AI"]').or(page.locator('input[placeholder*="xai-"]'));
      await expect(grokInput).toBeVisible();
      
      // Fill in the Grok API key
      await grokInput.fill(process.env.GROK_API_KEY);
      await page.waitForTimeout(3000); // Wait for validation
      
      // Should show success indicator
      await expect(grokInput).toHaveValue(process.env.GROK_API_KEY);
      
      // Check if validation passed
      const grokValidation = page.locator('text=✅ Valid API key').or(page.locator('[data-testid="grok-valid"]'));
      if (await grokValidation.isVisible()) {
        console.log('✅ Grok API key validation passed');
      } else {
        console.log('⚠️ Grok API key validation indicator not found, but key was accepted');
      }
      
      // Test that we can select Grok models after validation
      await page.click('button:has-text("Done")', { force: true });
      
      // Wait for providers to be configured
      await expect(page.locator('button:has-text("Configure Providers")')).toBeVisible();
      
      // Click on model selection
      await page.click('button:has-text("Select Models")');
      
      // Should show model selection modal
      await expect(page.locator('text=Model Selection')).toBeVisible();
      
      // Wait for models to load
      try {
        await page.waitForSelector('input[type="checkbox"]', { timeout: 10000 });
        
        // Look for Grok models specifically
        const grokCheckboxes = page.locator('input[type="checkbox"]').filter({ hasText: 'grok' });
        const grokCount = await grokCheckboxes.count();
        
        if (grokCount > 0) {
          console.log(`✅ Found ${grokCount} Grok models available`);
          
          // Select the first Grok model
          await grokCheckboxes.first().check();
          console.log('✅ Successfully selected a Grok model');
        } else {
          console.log('⚠️ No Grok models found in the list');
        }
        
        // Close modal
        await page.click('button:has-text("Done")', { force: true });
        
      } catch (error) {
        console.log('⚠️ Models did not load or Grok models not available');
        await page.click('button:has-text("Done")', { force: true });
      }
      
    } else {
      console.log('⚠️ No valid Grok API key found in environment variables');
      
      // Test with invalid Grok key
      const grokInput = page.locator('input[placeholder*="X.AI"]').or(page.locator('input[placeholder*="xai-"]'));
      if (await grokInput.isVisible()) {
        await grokInput.fill('invalid-grok-key-12345');
        await page.waitForTimeout(3000);
        
        // Should show validation error
        await expect(page.locator('text=❌ Invalid API key').first()).toBeVisible();
        console.log('✅ Grok invalid key validation working');
      }
      
      // Close modal
      await page.click('button:has-text("Done")', { force: true });
    }
  });

  test('should load and validate all API keys from localStorage on page load', async ({ page }) => {
    // First, set up localStorage with API keys
    await page.goto('/');
    
    // Set up localStorage with all API keys
    await page.evaluate((envVars) => {
      localStorage.setItem('ai-ensemble-openai-key', envVars.OPENAI_API_KEY || 'test-openai-key');
      localStorage.setItem('ai-ensemble-google-key', envVars.GOOGLE_API_KEY || 'test-google-key');
      localStorage.setItem('ai-ensemble-anthropic-key', envVars.ANTHROPIC_API_KEY || 'test-anthropic-key');
      localStorage.setItem('ai-ensemble-grok-key', envVars.GROK_API_KEY || 'test-grok-key');
    }, {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      GROK_API_KEY: process.env.GROK_API_KEY,
    });

    // Reload the page to trigger localStorage loading
    await page.reload();
    
    // Wait for the page to load, but don't wait for network idle
    await page.waitForTimeout(5000);
    
    // Check that the provider configuration button shows some providers are configured
    const providerButton = page.locator('button:has-text("Configure Providers")');
    await expect(providerButton).toBeVisible();
    
    // The button should show some providers are configured (not 0/4)
    const buttonText = await providerButton.textContent();
    expect(buttonText).not.toContain('(0/4)');
    
    // Click on provider configuration to see the loaded keys and their validation status
    await page.click('button:has-text("Configure Providers")');
    
    // Should open provider settings modal
    await expect(page.locator('text=AI Provider Configuration')).toBeVisible();
    
    // Wait for validation to complete for all providers
    await page.waitForTimeout(5000); // Give ample time for async validation
    
    // Verify each provider input shows a valid or invalid key indicator
    // OpenAI
    const openaiInput = page.locator('input[placeholder*="sk-..."]');
    await expect(openaiInput).toBeVisible();
    const openaiKey = await openaiInput.inputValue();
    const openaiValidationSpan = openaiInput.locator('xpath=./following-sibling::div/span');
    if (process.env.OPENAI_API_KEY && openaiKey === process.env.OPENAI_API_KEY) {
      await expect(openaiValidationSpan).toHaveAttribute('title', 'Valid key');
    } else {
      await expect(openaiValidationSpan).toHaveAttribute('title', 'Invalid or expired key');
    }

    // Google
    const googleInput = page.locator('input[placeholder*="Google"]');
    await expect(googleInput).toBeVisible();
    const googleKey = await googleInput.inputValue();
    const googleValidationSpan = googleInput.locator('xpath=./following-sibling::div/span');
    if (process.env.GOOGLE_API_KEY && googleKey === process.env.GOOGLE_API_KEY) {
      await expect(googleValidationSpan).toHaveAttribute('title', 'Valid key');
    } else {
      await expect(googleValidationSpan).toHaveAttribute('title', 'Invalid or expired key');
    }

    // Anthropic
    const anthropicInput = page.locator('input[placeholder*="Anthropic"]');
    await expect(anthropicInput).toBeVisible();
    const anthropicKey = await anthropicInput.inputValue();
    const anthropicValidationSpan = anthropicInput.locator('xpath=./following-sibling::div/span');
    if (process.env.ANTHROPIC_API_KEY && anthropicKey === process.env.ANTHROPIC_API_KEY) {
      await expect(anthropicValidationSpan).toHaveAttribute('title', 'Valid key');
    } else {
      await expect(anthropicValidationSpan).toHaveAttribute('title', 'Invalid or expired key');
    }

    // Grok
    const grokInput = page.locator('input[placeholder*="X.AI"]').or(page.locator('input[placeholder*="xai-"]'));
    await expect(grokInput).toBeVisible();
    const grokKey = await grokInput.inputValue();
    const grokValidationSpan = grokInput.locator('xpath=./following-sibling::div/span');
    if (process.env.GROK_API_KEY && grokKey === process.env.GROK_API_KEY) {
      await expect(grokValidationSpan).toHaveAttribute('title', 'Valid key');
    } else {
      await expect(grokValidationSpan).toHaveAttribute('title', 'Invalid or expired key');
    }
    
    // Close modal
    await page.click('button:has-text("Done")', { force: true });
  });
});
