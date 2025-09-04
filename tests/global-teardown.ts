import type { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting Playwright global teardown...');
  
  // Clean up any test data or resources if needed
  // For now, we don't have any persistent test data to clean up
  
  console.log('✅ Global teardown completed');
}

export default globalTeardown;

