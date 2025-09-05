# E2E Testing with Playwright

This directory contains end-to-end tests for the AI Ensemble application using Playwright.

## Setup

### 1. Install Dependencies

```bash
npm install
npx playwright install
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your API keys:

```bash
cp playwright.env.example .env.playwright
```

Edit `.env.playwright` and add your actual API keys:

```env
OPENAI_API_KEY=sk-your-actual-openai-key
GOOGLE_API_KEY=your-actual-google-key
ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-key
GROK_API_KEY=xai-your-actual-grok-key
```

### 3. Run Tests

#### Quick Commands
```bash
# Run all E2E tests (no HTML report server)
npx playwright test

# Run smoke tests only
npx playwright test tests/e2e/smoke.spec.ts

# Run specific test file
npx playwright test tests/e2e/manual-response-consensus.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests with debug mode
npx playwright test --debug

# Run tests for specific browser only
npx playwright test --project=chromium

# Run tests and generate HTML report (without auto-opening)
npx playwright test --reporter=html
```

#### Local Development (against dev server)
```bash
# Run all E2E tests
npm run test:e2e

# Run smoke tests only
npm run test:e2e:smoke

# Run tests with UI
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed
```

#### Against Deployed Application
```bash
# Set the base URL to your deployed app
PLAYWRIGHT_BASE_URL=https://your-app.web.app npx playwright test
```

#### Running Tests in Cursor IDE

**Best Practices for Cursor:**

1. **Quick Test Run**: Use the integrated terminal with `npx playwright test tests/e2e/smoke.spec.ts`
2. **Debug Mode**: Use `npx playwright test --debug` to step through tests
3. **Specific Browser**: Use `npx playwright test --project=chromium` for faster feedback
4. **Headed Mode**: Use `npx playwright test --headed` to see what's happening visually
5. **Single Test**: Use `npx playwright test --grep "test name"` to run specific tests

**Recommended Workflow:**
```bash
# 1. Start with smoke tests to verify basic functionality
npx playwright test tests/e2e/smoke.spec.ts

# 2. Run specific feature tests
npx playwright test tests/e2e/manual-response-consensus.spec.ts

# 3. Debug failing tests with headed mode
npx playwright test tests/e2e/manual-response-consensus.spec.ts --headed --project=chromium

# 4. Run all tests when ready
npx playwright test
```

**Cursor-Specific Tips:**
- Use `Ctrl+`` to open integrated terminal
- Use `Cmd+Shift+P` → "Terminal: Run Active File" to run tests from test files
- Use the Playwright extension for better test debugging
- Set breakpoints in test files for debugging

## Test Structure

### Test Files

- `tests/e2e/ai-ensemble.spec.ts` - Comprehensive E2E tests covering all major functionality
- `tests/e2e/smoke.spec.ts` - Quick smoke tests for basic functionality
- `tests/fixtures/test-data.ts` - Test data and configurations

### Test Categories

1. **Page Load and Basic UI** - Verifies the application loads correctly
2. **Provider Configuration** - Tests API key configuration and validation
3. **Model Selection** - Tests model selection functionality
4. **AI Ensemble Query** - Tests the core AI query functionality
5. **Sharing Functionality** - Tests the sharing feature
6. **Error Handling** - Tests error scenarios
7. **Responsive Design** - Tests mobile compatibility

## CI/CD Integration

### GitHub Actions

The tests run automatically in CI/CD:

- **Smoke Tests**: Run after deployment to verify basic functionality
- **Full E2E Tests**: Run on PRs and main branch pushes
- **Multi-browser Testing**: Tests run against Chromium, Firefox, and WebKit

### Required Secrets

The following secrets must be configured in GitHub:

- `OPENAI_API_KEY`
- `GOOGLE_API_KEY`
- `ANTHROPIC_API_KEY`
- `GROK_API_KEY`
- `NEXT_PUBLIC_FIREBASE_*` (for sharing functionality)

## Test Configuration

### Playwright Config (`playwright.config.ts`)

- **Base URL**: Configurable via `PLAYWRIGHT_BASE_URL` environment variable
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Retries**: 2 retries on CI, 0 locally
- **Parallel Execution**: Enabled for faster test runs
- **Screenshots/Videos**: Captured on failure
- **Traces**: Collected on retry

### Global Setup

- Loads environment variables from `.env.playwright`
- Validates required API keys are present
- Tests application accessibility before running tests

### Policy: Do not stub or mock network in E2E tests

- E2E tests must exercise the real app and backend behavior. Do not intercept `fetch`, stub SSE streams, override tRPC validations, or short-circuit network requests in Playwright.
- Provide real/sandbox API keys via `.env.playwright` (see `playwright.env.example`). Tests should configure providers through the UI using these keys.
- If setup is repetitive, prefer reusable helper flows or fixtures that drive the UI, not network stubs.
- If an element intercepts clicks (e.g., hidden overlay), fix the UI (z-index/focus/aria/selector) rather than adding brittle waits or mocks.

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    // Your test steps here
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### Best Practices

1. **Use descriptive test names** that explain what is being tested
2. **Group related tests** using `test.describe()`
3. **Use page object pattern** for complex interactions
4. **Wait for elements** using `expect().toBeVisible()` instead of `page.waitForSelector()`
5. **Use data-testid attributes** for reliable element selection
6. **Clean up after tests** if needed

### Test Data

Use the test data from `tests/fixtures/test-data.ts`:

```typescript
import { testPrompts, testConfigurations } from '../fixtures/test-data';

// Use predefined test prompts
await page.fill('textarea', testPrompts.simple);

// Use test configurations
const config = testConfigurations.minimal;
```

## Debugging

### Local Debugging

```bash
# Run tests in headed mode to see the browser
npm run test:e2e:headed

# Run specific test file
npx playwright test tests/e2e/smoke.spec.ts

# Run with debug mode
npx playwright test --debug
```

### CI Debugging

- Test artifacts (screenshots, videos, traces) are uploaded to GitHub Actions
- Check the "Artifacts" section in the workflow run
- Use `--reporter=line` for more detailed output in CI

## Troubleshooting

### Common Issues

1. **API Key Validation Failures**
   - Ensure API keys are valid and have sufficient credits
   - Check that keys are properly set in environment variables

2. **Timeout Issues**
   - AI responses can take time, increase timeout for AI-related tests
   - Use `{ timeout: 60000 }` for AI response tests

3. **Element Not Found**
   - Use `page.waitForLoadState('networkidle')` after navigation
   - Check if elements are conditionally rendered
   - Use more specific selectors

4. **Flaky Tests**
   - Add proper waits for dynamic content
   - Use `expect().toBeVisible()` instead of `page.waitForSelector()`
   - Consider retry logic for network-dependent tests

