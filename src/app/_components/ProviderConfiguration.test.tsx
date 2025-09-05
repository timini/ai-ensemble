import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProviderConfiguration } from './ProviderConfiguration';
import type { Provider } from '@/types/api';

// Mock the TRPC hooks
vi.mock('@/trpc/react', () => ({
  api: {
    validation: {
      validateApiKey: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue({ success: true })
        })
      },
      getModels: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue({ success: true, models: ['model1', 'model2'] })
        })
      }
    }
  }
}));

describe('ProviderConfiguration', () => {
  const mockProps = {
    providerKeys: {
      openai: '',
      google: '',
      anthropic: '',
      grok: ''
    },
    onProviderKeysChange: vi.fn(),
    providerStatus: {
      openai: 'unchecked' as const,
      google: 'unchecked' as const,
      anthropic: 'unchecked' as const,
      grok: 'unchecked' as const
    },
    onProviderStatusChange: vi.fn(),
    availableModels: {
      openai: [],
      google: [],
      anthropic: [],
      grok: []
    },
    onAvailableModelsChange: vi.fn(),
    triggerInitialValidation: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  it('should render the configuration button', () => {
    render(<ProviderConfiguration {...mockProps} />);
    
    expect(screen.getByText(/Configure Providers/)).toBeInTheDocument();
  });

  it('should open the configuration panel when button is clicked', () => {
    render(<ProviderConfiguration {...mockProps} />);
    
    const configButton = screen.getByText(/Configure Providers/);
    fireEvent.click(configButton);
    
    expect(screen.getByText('AI Provider Configuration')).toBeInTheDocument();
  });

  describe('Key visibility toggle', () => {
    it('should show password input by default', () => {
      render(<ProviderConfiguration {...mockProps} />);
      
      // Open the configuration panel
      const configButton = screen.getByText(/Configure Providers/);
      fireEvent.click(configButton);
      
      // Check that API key inputs are password type by default
      const openaiInput = screen.getByPlaceholderText('sk-...');
      expect(openaiInput).toHaveAttribute('type', 'password');
    });

    it('should toggle API key visibility when show/hide button is clicked', async () => {
      render(<ProviderConfiguration {...mockProps} />);
      
      // Open the configuration panel
      const configButton = screen.getByText(/Configure Providers/);
      fireEvent.click(configButton);
      
      // Find the visibility toggle button for OpenAI (first one)
      const toggleButtons = screen.getAllByTitle(/Hide key|Show key/);
      const openaiToggleButton = toggleButtons[0];
      
      // Initially should show "Show key" tooltip and hide icon
      expect(openaiToggleButton).toHaveAttribute('title', 'Show key');
      expect(openaiToggleButton).toHaveTextContent('🙈');
      
      // Find the corresponding input
      const openaiInput = screen.getByPlaceholderText('sk-...');
      expect(openaiInput).toHaveAttribute('type', 'password');
      
      // Click to show key
      fireEvent.click(openaiToggleButton);
      
      // After click, should change to text input and update button
      await waitFor(() => {
        expect(openaiInput).toHaveAttribute('type', 'text');
        expect(openaiToggleButton).toHaveAttribute('title', 'Hide key');
        expect(openaiToggleButton).toHaveTextContent('👁️');
      });
      
      // Click again to hide key
      fireEvent.click(openaiToggleButton);
      
      // Should return to password input
      await waitFor(() => {
        expect(openaiInput).toHaveAttribute('type', 'password');
        expect(openaiToggleButton).toHaveAttribute('title', 'Show key');
        expect(openaiToggleButton).toHaveTextContent('🙈');
      });
    });

    it('should toggle visibility independently for each provider', async () => {
      render(<ProviderConfiguration {...mockProps} />);
      
      // Open the configuration panel
      const configButton = screen.getByText(/Configure Providers/);
      fireEvent.click(configButton);
      
      // Get toggle buttons for different providers
      const toggleButtons = screen.getAllByTitle(/Hide key|Show key/);
      const openaiToggleButton = toggleButtons[0]; // OpenAI
      const googleToggleButton = toggleButtons[1]; // Google
      
      // Get corresponding inputs
      const openaiInput = screen.getByPlaceholderText('sk-...');
      const googleInput = screen.getByPlaceholderText('Your Google AI API key');
      
      // Initially both should be password type
      expect(openaiInput).toHaveAttribute('type', 'password');
      expect(googleInput).toHaveAttribute('type', 'password');
      
      // Show OpenAI key only
      fireEvent.click(openaiToggleButton);
      
      await waitFor(() => {
        expect(openaiInput).toHaveAttribute('type', 'text');
        expect(googleInput).toHaveAttribute('type', 'password'); // Google should still be hidden
      });
      
      // Show Google key
      fireEvent.click(googleToggleButton);
      
      await waitFor(() => {
        expect(openaiInput).toHaveAttribute('type', 'text'); // OpenAI should still be visible
        expect(googleInput).toHaveAttribute('type', 'text'); // Google should now be visible
      });
      
      // Hide OpenAI key
      fireEvent.click(openaiToggleButton);
      
      await waitFor(() => {
        expect(openaiInput).toHaveAttribute('type', 'password'); // OpenAI should be hidden
        expect(googleInput).toHaveAttribute('type', 'text'); // Google should still be visible
      });
    });

    it('should maintain visibility state when component re-renders', async () => {
      const { rerender } = render(<ProviderConfiguration {...mockProps} />);
      
      // Open the configuration panel
      const configButton = screen.getByText(/Configure Providers/);
      fireEvent.click(configButton);
      
      // Show OpenAI key
      const toggleButton = screen.getAllByTitle(/Hide key|Show key/)[0];
      fireEvent.click(toggleButton);
      
      const openaiInput = screen.getByPlaceholderText('sk-...');
      await waitFor(() => {
        expect(openaiInput).toHaveAttribute('type', 'text');
      });
      
      // Re-render with updated props
      rerender(<ProviderConfiguration 
        {...mockProps} 
        providerKeys={{ ...mockProps.providerKeys, openai: 'sk-test123' }} 
      />);
      
      // Visibility state should be maintained
      expect(openaiInput).toHaveAttribute('type', 'text');
      expect(toggleButton).toHaveAttribute('title', 'Hide key');
    });
  });
});
