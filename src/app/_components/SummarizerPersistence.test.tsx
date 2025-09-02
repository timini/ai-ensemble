import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImprovedEnsembleInterface } from './ImprovedEnsembleInterface';
import { vi } from 'vitest';

// Mock all child components to isolate the summarizer persistence logic
vi.mock('./Header', () => ({ Header: () => <div data-testid="header">Header</div> }));
vi.mock('./ProviderConfiguration', () => ({ 
  ProviderConfiguration: ({ onProviderKeysChange, onProviderStatusChange, onAvailableModelsChange }: any) => {
    // Simulate provider configuration being ready
    setTimeout(() => {
      onProviderKeysChange({ openai: 'test-key', google: 'test-key', anthropic: 'test-key', grok: 'test-key' });
      onProviderStatusChange({ openai: 'valid', google: 'valid', anthropic: 'valid', grok: 'valid' });
      onAvailableModelsChange({ 
        openai: ['gpt-4o'], 
        google: ['gemini-2.5-flash'], 
        anthropic: ['claude-3-opus'], 
        grok: ['llama3-8b'] 
      });
    }, 10);
    return <div data-testid="provider-config">Provider Config</div>;
  }
}));
vi.mock('./ModelSelection', () => ({ 
  ModelSelection: ({ onSelectedModelsChange }: any) => {
    // Simulate models being selected
    setTimeout(() => {
      onSelectedModelsChange([
        { id: 'openai-gpt-4o-123', name: 'OpenAI gpt-4o', provider: 'openai', model: 'gpt-4o' },
        { id: 'google-gemini-456', name: 'Google gemini-2.5-flash', provider: 'google', model: 'gemini-2.5-flash' },
        { id: 'anthropic-claude-789', name: 'Anthropic claude-3-opus', provider: 'anthropic', model: 'claude-3-opus' }
      ]);
    }, 20);
    return <div data-testid="model-selection">Model Selection</div>;
  }
}));
vi.mock('./SelectedModelsDisplay', () => ({ SelectedModelsDisplay: () => <div data-testid="selected-models">Selected Models</div> }));
vi.mock('./PromptInput', () => ({ PromptInput: ({ value, onChange }: any) => 
  <textarea data-testid="prompt-input" value={value} onChange={e => onChange(e.target.value)} /> 
}));
vi.mock('./ConsensusDiagram', () => ({ ConsensusDiagram: () => <div data-testid="consensus-diagram">Consensus Diagram</div> }));
vi.mock('./CopyButton', () => ({ CopyButton: () => <button data-testid="copy-button">Copy</button> }));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    })
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock ReactMarkdown to avoid import issues
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>
}));
vi.mock('remark-gfm', () => ({ default: () => {} }));

describe('Summarizer Persistence', () => {
  let timeoutIds: NodeJS.Timeout[] = [];

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    timeoutIds = [];
    
    // Suppress console logs during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Track timeouts to clean them up
    const originalSetTimeout = global.setTimeout;
    vi.spyOn(global, 'setTimeout').mockImplementation((fn, delay) => {
      const id = originalSetTimeout(fn, delay);
      timeoutIds.push(id);
      return id;
    });
  });

  afterEach(() => {
    // Clean up any pending timeouts
    timeoutIds.forEach(id => clearTimeout(id));
    vi.restoreAllMocks();
  });

  it('should save summarizer selection to localStorage', async () => {
    render(<ImprovedEnsembleInterface />);

    // Wait for models to be loaded and summarizer dropdown to appear
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    }, { timeout: 2000 });

    const summarizerSelect = screen.getByRole('combobox');
    
    // Change the summarizer selection
    fireEvent.change(summarizerSelect, { target: { value: 'google-gemini-456' } });

    // Wait for the localStorage save to happen
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'ensemble-summarizer', 
        'google-gemini-456'
      );
    }, { timeout: 1000 });
  });

  it('should load summarizer selection from localStorage on mount', async () => {
    // Pre-populate localStorage with saved models and summarizer
    const savedModels = [
      { id: 'openai-gpt-4o-123', name: 'OpenAI gpt-4o', provider: 'openai', model: 'gpt-4o' },
      { id: 'google-gemini-456', name: 'Google gemini-2.5-flash', provider: 'google', model: 'gemini-2.5-flash' },
      { id: 'anthropic-claude-789', name: 'Anthropic claude-3-opus', provider: 'anthropic', model: 'claude-3-opus' }
    ];
    
    localStorageMock.setItem('ensemble-selected-models', JSON.stringify(savedModels));
    localStorageMock.setItem('ensemble-summarizer', 'google-gemini-456');

    render(<ImprovedEnsembleInterface />);

    // Wait for the component to load and process localStorage
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    }, { timeout: 2000 });

    const summarizerSelect = screen.getByRole('combobox') as HTMLSelectElement;
    
    // Verify the summarizer was loaded from localStorage
    await waitFor(() => {
      expect(summarizerSelect.value).toBe('google-gemini-456');
    }, { timeout: 1000 });
  });

  it('should persist summarizer across page reloads', async () => {
    // First render - select a summarizer
    const { unmount } = render(<ImprovedEnsembleInterface />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    }, { timeout: 2000 });

    const summarizerSelect = screen.getByRole('combobox');
    fireEvent.change(summarizerSelect, { target: { value: 'anthropic-claude-789' } });

    // Wait for save
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'ensemble-summarizer', 
        'anthropic-claude-789'
      );
    }, { timeout: 1000 });

    // Unmount to simulate page close
    unmount();

    // Second render - simulate page reload
    render(<ImprovedEnsembleInterface />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    }, { timeout: 2000 });

    const newSummarizerSelect = screen.getByRole('combobox') as HTMLSelectElement;
    
    // Verify the selection persisted
    await waitFor(() => {
      expect(newSummarizerSelect.value).toBe('anthropic-claude-789');
    }, { timeout: 1000 });
  });

  it('should default to first model if saved summarizer is invalid', async () => {
    // Set up localStorage with models but an invalid summarizer ID
    const savedModels = [
      { id: 'openai-gpt-4o-123', name: 'OpenAI gpt-4o', provider: 'openai', model: 'gpt-4o' },
      { id: 'google-gemini-456', name: 'Google gemini-2.5-flash', provider: 'google', model: 'gemini-2.5-flash' }
    ];
    
    localStorageMock.setItem('ensemble-selected-models', JSON.stringify(savedModels));
    localStorageMock.setItem('ensemble-summarizer', 'invalid-model-id');

    render(<ImprovedEnsembleInterface />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    }, { timeout: 2000 });

    const summarizerSelect = screen.getByRole('combobox') as HTMLSelectElement;
    
    // Should default to the first model
    await waitFor(() => {
      expect(summarizerSelect.value).toBe('openai-gpt-4o-123');
    }, { timeout: 1000 });
  });
});
