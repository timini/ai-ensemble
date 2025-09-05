import { renderHook, act } from '@testing-library/react';
import { useEnsembleState } from './useEnsembleState';
import { vi } from 'vitest';
import 'vitest-localstorage-mock';
import { api } from '@/trpc/react';

vi.mock('@/trpc/react', () => ({
  api: {
    validation: {
      validateAllKeys: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
        })),
      },
      validateApiKey: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
        })),
      },
      getModels: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
        })),
      },
    },
    ensemble: {
      query: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
        })),
      },
    },
    useUtils: vi.fn(() => ({
        validation: {
            getModels: {
                fetch: vi.fn(),
            },
        },
    })),
  },
}));

describe('useEnsembleState', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

  it('should handle model changes', () => {
    const { result } = renderHook(() => useEnsembleState());

    act(() => {
      result.current.handleModelChange('openai', 'gpt-4');
    });

    expect(result.current.models.openai).toBe('gpt-4');
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'ai-ensemble-models',
      JSON.stringify({ ...result.current.models, openai: 'gpt-4' })
    );
  });

  it('should not enter an infinite loop when loading initial keys and models', () => {
    (api.validation.validateAllKeys.useMutation as vi.Mock).mockImplementation((options) => {
        return {
            mutate: (args: Record<string, unknown>) => {
                if(options.onSuccess) {
                    options.onSuccess({
                        statuses: { openai: 'valid', google: 'valid', anthropic: 'valid' },
                        modelLists: { openai: ['gpt-3.5-turbo'], google: ['gemini-1.5-flash'], anthropic: ['claude-2'] },
                    }, args, undefined);
                }
                if(options.onSettled) {
                    options.onSettled(undefined, null, args, undefined);
                }
            }
        }
    });

    renderHook(() => useEnsembleState());
  });

  it('should handle submit', () => {
    const { result } = renderHook(() => useEnsembleState());
    const mockMutate = vi.fn();
    (api.ensemble.query.useMutation as vi.Mock).mockReturnValue({
        mutate: mockMutate,
    });

    act(() => {
        result.current.setPrompt('test prompt');
        result.current.setSummarizerSelection('openai:gpt-4');
    });

    act(() => {
        result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(mockMutate).toHaveBeenCalledWith({
        prompt: 'test prompt',
        keys: result.current.keys,
        models: result.current.models,
        summarizer: { provider: 'openai', model: 'gpt-4' },
    });
  });

  it('should not submit if summarizer selection is invalid', () => {
    const { result } = renderHook(() => useEnsembleState());
    const mockMutate = vi.fn();
    (api.ensemble.query.useMutation as vi.Mock).mockReturnValue({
        mutate: mockMutate,
    });

    act(() => {
        result.current.setPrompt('test prompt');
        result.current.setSummarizerSelection('openai');
    });

    act(() => {
        result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(mockMutate).not.toHaveBeenCalled();
  });
});
