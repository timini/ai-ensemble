# Testing Guide

This project has three types of tests: unit tests, integration tests, and end-to-end tests.

## Test Environment Setup

### Environment Variables

Create a `.env.test` file based on `.env.test.example` and add your real API keys:

```bash
cp .env.test.example .env.test
# Edit .env.test with your actual API keys
```

### Required API Keys

For full test coverage, you'll need API keys for:
- **OpenAI**: `OPENAI_API_KEY=sk-...`
- **Google AI**: `GOOGLE_API_KEY=your-google-ai-key`
- **Anthropic**: `ANTHROPIC_API_KEY=sk-ant-...`
- **Grok**: `GROK_API_KEY=xai-...`

## Test Types

### 1. Unit Tests (Mocked)

**File pattern**: `*.test.ts`  
**Purpose**: Fast tests with mocked dependencies  
**Run with**: `npm run test:unit`

These tests use mocked API calls and don't require real API keys.

### 2. Integration Tests (Real APIs)

**File pattern**: `*.integration.test.ts`  
**Purpose**: Test actual API integration with real keys  
**Run with**: `npm run test:integration`

These tests:
- Use real API keys from `.env.test`
- Make actual HTTP requests to provider APIs
- Validate real API key authentication
- Test model fetching and filtering
- Skip tests automatically if API keys are missing

### 3. End-to-End Tests

**File pattern**: `tests/e2e/*.spec.ts`  
**Purpose**: Full browser testing of user workflows  
**Run with**: `npm run test:e2e`

## Test Commands

```bash
# Run all tests
npm test

# Run only unit tests (fast, mocked)
npm run test:unit

# Run only integration tests (real API calls)
npm run test:integration

# Run integration tests in watch mode
npm run test:integration:watch

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run coverage
```

## Integration Test Features

The integration tests (`validation.integration.test.ts`) provide:

### Smart Skipping
Tests automatically skip if API keys are not available:
```typescript
it.skipIf(!hasOpenAIKey)('should validate real OpenAI key', async () => {
  // Test only runs if OPENAI_API_KEY is set and valid
});
```

### Real API Validation
- **OpenAI**: Tests model listing and key validation
- **Google**: Tests token counting and model fetching  
- **Anthropic**: Tests message creation and model access
- **Grok**: Tests chat completions and model availability

### Error Handling
- Tests both valid and invalid API keys
- Verifies proper error messages and status codes
- Tests mixed scenarios (some valid, some invalid keys)

### Model Filtering
- Verifies that only text generation models are returned
- Filters out image, audio, embedding, and other non-text models
- Tests dynamic model fetching vs fallback lists

## Test Output

Integration tests provide detailed logging:
```
Running integration tests with real API keys...
OpenAI key available: true
Google key available: true  
Anthropic key available: true
Grok key available: true
```

Successful runs show:
- ✅ All 16 integration tests passing
- Real model lists fetched from each provider
- Validation status correctly determined
- Error handling working for invalid keys

## Environment Configuration

### Vitest Configuration
- **Unit tests**: Use Node environment with mocked dependencies
- **Integration tests**: Use Node environment with real API calls
- **Coverage**: Excludes E2E tests and reports detailed metrics

### Environment Loading
Both unit and integration tests automatically load `.env.test`:
```typescript
// vitest.config.ts
config({ path: '.env.test' });
```

## Best Practices

1. **Keep unit tests fast** - Use mocks for external dependencies
2. **Use integration tests for API validation** - Test real authentication flows  
3. **Reserve E2E tests for user workflows** - Test complete user journeys
4. **Don't commit API keys** - Keep `.env.test` in `.gitignore`
5. **Write descriptive test names** - Include what's being tested and expected outcome

## Troubleshooting

### "API key not valid" errors
- Verify your API keys in `.env.test` are correct and active
- Check if you have sufficient quota/credits
- Ensure keys have the right permissions

### Tests skipping unexpectedly
- Check that API keys are set and not placeholder values
- Verify the key format matches expected patterns

### Environment detection issues
- Make sure you're using Node environment for server-side tests
- Avoid `dangerouslyAllowBrowser: true` in server/test code







