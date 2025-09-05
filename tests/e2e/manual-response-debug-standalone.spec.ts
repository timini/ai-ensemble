const { test, expect } = require('@playwright/test');

test('Manual Response Debug Test', async ({ page }) => {
  console.log('🚀 Starting manual response debug test...');
  
  // Navigate to the app
  await page.goto('http://localhost:3000');
  console.log('✅ Navigated to localhost:3000');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  console.log('✅ Page loaded');
  
  // Take initial screenshot
  await page.screenshot({ path: 'debug-initial.png', fullPage: true });
  console.log('📸 Initial screenshot saved');
  
  // Check page title
  const title = await page.title();
  console.log('📄 Page title:', title);
  
  // Log all buttons on the page
  const buttons = await page.$$eval('button', buttons => 
    buttons.map(btn => ({ 
      text: btn.textContent?.trim(), 
      visible: btn.offsetParent !== null,
      classes: btn.className
    }))
  );
  console.log('🔘 All buttons on page:', buttons);
  
  // Log all h2 headings to see what sections are visible
  const headings = await page.$$eval('h2', headings => 
    headings.map(h => ({ 
      text: h.textContent?.trim(), 
      visible: h.offsetParent !== null 
    }))
  );
  console.log('📋 All h2 headings:', headings);
  
  // Check if Individual Responses section exists
  const individualResponsesHeading = page.locator('h2:has-text("Individual Responses")');
  const isIndividualResponsesVisible = await individualResponsesHeading.isVisible().catch(() => false);
  console.log('👁️  Individual Responses section visible:', isIndividualResponsesVisible);
  
  if (!isIndividualResponsesVisible) {
    console.log('❌ Individual Responses section is NOT visible');
    console.log('🔍 This confirms the issue - the section is hidden by the condition');
    
    // Let's check what the streaming state looks like
    const streamingElements = await page.$$eval('[class*="streaming"], [class*="complete"], [class*="pending"]', 
      elements => elements.map(el => ({ 
        tag: el.tagName, 
        text: el.textContent?.substring(0, 50), 
        classes: el.className 
      }))
    );
    console.log('📡 Streaming-related elements:', streamingElements);
    
  } else {
    console.log('✅ Individual Responses section IS visible');
    
    // Check for Add Manual Response button
    const addButton = page.locator('button:has-text("Add Manual Response")');
    const isAddButtonVisible = await addButton.isVisible().catch(() => false);
    console.log('➕ Add Manual Response button visible:', isAddButtonVisible);
    
    if (isAddButtonVisible) {
      console.log('✅ Testing manual response flow...');
      
      // Click the Add Manual Response button
      await addButton.click();
      console.log('✅ Clicked Add Manual Response button');
      
      // Wait for modal
      await page.waitForSelector('input[name="modelName"]', { timeout: 5000 });
      console.log('✅ Modal opened');
      
      // Fill form
      await page.fill('input[name="modelName"]', 'Test Manual Model');
      await page.selectOption('select[name="provider"]', 'openai');
      await page.fill('textarea[name="response"]', 'This is a test manual response content that should be visible in the individual responses section.');
      console.log('✅ Form filled');
      
      // Submit
      await page.click('button[type="submit"]');
      console.log('✅ Form submitted');
      
      // Wait and take screenshot
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'debug-after-manual.png', fullPage: true });
      console.log('📸 After manual response screenshot saved');
      
      // Check if manual response appears
      const manualResponseTitle = page.locator('text=Test Manual Model');
      const isTitleVisible = await manualResponseTitle.isVisible().catch(() => false);
      console.log('🏷️  Manual response title visible:', isTitleVisible);
      
      const manualResponseContent = page.locator('text=This is a test manual response content');
      const isContentVisible = await manualResponseContent.isVisible().catch(() => false);
      console.log('📝 Manual response content visible:', isContentVisible);
      
      // Check for blue border (manual response styling)
      const blueBorderElements = await page.$$eval('[class*="border-blue"]', 
        elements => elements.map(el => ({ 
          text: el.textContent?.substring(0, 100),
          classes: el.className
        }))
      );
      console.log('🔵 Blue border elements (manual responses):', blueBorderElements);
      
      if (!isTitleVisible && !isContentVisible) {
        console.log('❌ Manual response not showing - let\'s debug further');
        
        // Check localStorage for manual responses
        const localStorageData = await page.evaluate(() => {
          return {
            manualResponses: localStorage.getItem('manualResponses'),
            keys: localStorage.getItem('ai-ensemble-keys')
          };
        });
        console.log('💾 LocalStorage data:', localStorageData);
        
        // Check for any error messages in console
        const consoleLogs = [];
        page.on('console', msg => consoleLogs.push(msg.text()));
        console.log('🖥️  Browser console logs:', consoleLogs);
      }
    }
  }
  
  console.log('🏁 Debug test completed');
});







