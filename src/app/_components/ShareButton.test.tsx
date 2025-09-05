import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ShareButton } from './ShareButton';
import type { ShareRequest } from '@/types/share';

// Mock fetch
global.fetch = vi.fn();

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

const mockShareData: ShareRequest = {
  prompt: 'Test prompt',
  individualResponses: {
    openai: 'OpenAI response',
    google: 'Google response',
    anthropic: 'Anthropic response',
    grok: 'Grok response',
  },
  consensusResponse: 'Consensus response',
  agreementScores: {
    og: 0.8,
    ga: 0.7,
    ao: 0.9,
  },
  models: {
    openai: 'GPT-4',
    google: 'Gemini Pro',
    anthropic: 'Claude 3',
    grok: 'Grok Beta',
  },
  summarizer: {
    provider: 'openai',
    model: 'GPT-4',
  },
};

describe('ShareButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the share button', () => {
    render(<ShareButton data={mockShareData} />);
    
    expect(screen.getByText('🔗 Share Response')).toBeInTheDocument();
  });

  it('should show sharing state when clicked', async () => {
    (fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true, shareUrl: 'https://example.com/shared/123' }),
    });

    render(<ShareButton data={mockShareData} />);
    
    const shareButton = screen.getByText('🔗 Share Response');
    fireEvent.click(shareButton);
    
    expect(screen.getByText('Sharing...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('✅ Response shared successfully!')).toBeInTheDocument();
    });
  });

  it('should copy share URL to clipboard on successful share', async () => {
    const mockShareUrl = 'https://example.com/shared/123';
    (fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true, shareUrl: mockShareUrl }),
    });

    render(<ShareButton data={mockShareData} />);
    
    const shareButton = screen.getByText('🔗 Share Response');
    fireEvent.click(shareButton);
    
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockShareUrl);
    });
  });

  it('should display share URL after successful sharing', async () => {
    const mockShareUrl = 'https://example.com/shared/123';
    (fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true, shareUrl: mockShareUrl }),
    });

    render(<ShareButton data={mockShareData} />);
    
    const shareButton = screen.getByText('🔗 Share Response');
    fireEvent.click(shareButton);
    
    await waitFor(() => {
      expect(screen.getByText(mockShareUrl)).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<ShareButton data={mockShareData} />);
    
    const shareButton = screen.getByText('🔗 Share Response');
    fireEvent.click(shareButton);
    
    await waitFor(() => {
      expect(screen.getByText('❌ Failed to share response')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should handle API response errors', async () => {
    (fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: false, error: 'Invalid data' }),
    });

    render(<ShareButton data={mockShareData} />);
    
    const shareButton = screen.getByText('🔗 Share Response');
    fireEvent.click(shareButton);
    
    await waitFor(() => {
      expect(screen.getByText('❌ Failed to share response')).toBeInTheDocument();
      expect(screen.getByText('Invalid data')).toBeInTheDocument();
    });
  });

  it('should be disabled while sharing', async () => {
    (fetch as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<ShareButton data={mockShareData} />);
    
    const shareButton = screen.getByText('🔗 Share Response');
    fireEvent.click(shareButton);
    
    expect(shareButton).toBeDisabled();
    expect(screen.getByText('Sharing...')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    render(<ShareButton data={mockShareData} className="custom-class" />);
    
    const shareButton = screen.getByText('🔗 Share Response');
    expect(shareButton).toHaveClass('custom-class');
  });

  it('should make correct API call with share data', async () => {
    (fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true, shareUrl: 'https://example.com/shared/123' }),
    });

    render(<ShareButton data={mockShareData} />);
    
    const shareButton = screen.getByText('🔗 Share Response');
    fireEvent.click(shareButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockShareData),
      });
    });
  });
});
