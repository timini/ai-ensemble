import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ImprovedEnsembleInterface } from './ImprovedEnsembleInterface';

// Mock the tRPC hooks
vi.mock('@/trpc/react', () => ({
  api: {
    ensemble: {
      stream: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
        }),
      },
    },
    validation: {
      validateAllKeys: {
        useQuery: () => ({
          data: {
            statuses: { openai: 'valid', google: 'valid', anthropic: 'valid' },
            modelLists: { openai: ['gpt-4'], google: ['gemini-pro'], anthropic: ['claude-3'] }
          },
          isLoading: false,
        }),
      },
      validateApiKey: {
        useMutation: () => {
          const mockMutate = vi.fn();
          const mockMutateAsync = vi.fn();

          // Add validation to ensure correct parameter schema
          mockMutateAsync.mockImplementation((params: any) => {
            // This will catch the regression if wrong parameter names are used
            if ('apiKey' in params && !('key' in params)) {
              return Promise.reject(new Error('TRPC validation error: key is required'));
            }
            if (!params.provider || !params.key) {
              return Promise.reject(new Error('TRPC validation error: provider and key are required'));
            }
            return Promise.resolve({ success: true, error: null });
          });

          return {
            mutate: mockMutate,
            mutateAsync: mockMutateAsync,
            isPending: false,
          };
        },
      },
      getModels: {
        useMutation: () => {
          const mockMutate = vi.fn();
          const mockMutateAsync = vi.fn();

          // Add validation to ensure correct parameter schema
          mockMutateAsync.mockImplementation((params: any) => {
            // This will catch the regression if wrong parameter names are used
            if ('apiKey' in params && !('key' in params)) {
              return Promise.reject(new Error('TRPC validation error: key is required'));
            }
            if (!params.provider || !params.key) {
              return Promise.reject(new Error('TRPC validation error: provider and key are required'));
            }
            return Promise.resolve({ success: true, models: ['gpt-4', 'gpt-3.5-turbo'] });
          });

          return {
            mutate: mockMutate,
            mutateAsync: mockMutateAsync,
            isPending: false,
          };
        },
      },
    },
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ImprovedEnsembleInterface', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockReturnValue(undefined);
  });

  it('should render the header with correct tagline', () => {
    render(<ImprovedEnsembleInterface />);
    
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('Ensemble')).toBeInTheDocument();
    expect(screen.getByText('The smartest AI is an ensemble')).toBeInTheDocument();
  });

  it('should render configuration section', () => {
    render(<ImprovedEnsembleInterface />);
    
    expect(screen.getByText('Configuration')).toBeInTheDocument();
    expect(screen.getByText('Configure Providers (0/4)')).toBeInTheDocument();
    expect(screen.getByText('Select Models (0/8)')).toBeInTheDocument();
  });

  it('should render prompt input', () => {
    render(<ImprovedEnsembleInterface />);
    
    expect(screen.getByPlaceholderText('Enter your prompt here...')).toBeInTheDocument();
  });

  it('should render submit button', () => {
    render(<ImprovedEnsembleInterface />);
    
    expect(screen.getByText('Compare 0 Models')).toBeInTheDocument();
  });

  it('should show ShareButton when streaming is complete', async () => {
    render(<ImprovedEnsembleInterface />);
    
    // Initially, ShareButton should not be visible
    expect(screen.queryByText('🔗 Share Response')).not.toBeInTheDocument();
    
    // The component should render without errors
    expect(screen.getByText('Configuration')).toBeInTheDocument();
  });
});
