import { render } from '@testing-library/react';
import Home from './page';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { api } from '~/trpc/react';

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Create test tRPC client
const createTestTRPCClient = (queryClient: QueryClient) => {
  return api.createClient({
    links: [
      httpBatchLink({
        url: 'http://localhost:3000/api/trpc',
        fetch: vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ result: { data: { isValid: true } } })
        } as Response),
      }),
    ],
  });
};

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  const trpcClient = createTestTRPCClient(queryClient);

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </api.Provider>
  );
}

// Mock localStorage for the test
const localStorageMock = {
  getItem: vi.fn((key: string) => {
    switch (key) {
      case 'ai-ensemble-selected-models':
        return JSON.stringify([
          { id: 'openai-gpt-4o-123', name: 'OpenAI GPT-4o', provider: 'openai', model: 'gpt-4o' },
          { id: 'google-gemini-2.5-pro-456', name: 'Google Gemini 2.5 Pro', provider: 'google', model: 'gemini-2.5-pro' },
          { id: 'anthropic-claude-3.5-sonnet-789', name: 'Anthropic Claude 3.5 Sonnet', provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' }
        ]);
      case 'ai-ensemble-prompt':
        return 'Explain the concept of artificial intelligence and its impact on society in detail.';
      case 'ai-ensemble-summarizer':
        return 'openai-gpt-4o-123';
      case 'ai-ensemble-provider-keys':
        return JSON.stringify({
          openai: 'sk-test-key-123',
          google: 'test-google-key-456',
          anthropic: 'test-anthropic-key-789',
          grok: ''
        });
      case 'ai-ensemble-provider-status':
        return JSON.stringify({
          openai: { isValid: true, isValidating: false },
          google: { isValid: true, isValidating: false },
          anthropic: { isValid: true, isValidating: false },
          grok: { isValid: false, isValidating: false }
        });
      case 'ai-ensemble-available-models':
        return JSON.stringify({
          openai: ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'],
          google: ['gemini-2.5-pro', 'gemini-2.0-flash-exp', 'gemini-1.5-pro'],
          anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
          grok: ['grok-beta']
        });
      default:
        return null;
    }
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Home Page Snapshot', () => {
  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });

    // Mock fetch for validation endpoints
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.includes('/api/trpc/validation.validateApiKey')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ result: { data: { isValid: true } } })
        } as Response);
      }
      if (url.includes('/api/trpc/validation.getModels')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            result: { 
              data: ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'] 
            } 
          })
        } as Response);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    // Suppress console warnings during tests
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should match snapshot of the complete home page with data', async () => {
    const { container } = render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );
    
    // Wait a bit for the component to initialize with localStorage data
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('should render the main page component', () => {
    const { container } = render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );
    expect(container.firstChild).toBeDefined();
  });

  it('should render without crashing with mocked localStorage data', () => {
    expect(() => render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    )).not.toThrow();
  });
});
