import { render, screen, fireEvent, act } from '@testing-library/react';
import { CopyButton } from './CopyButton';
import { vi } from 'vitest';

describe('CopyButton', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render a button that copies text to clipboard and shows "Copied!"', async () => {
    const textToCopy = 'Hello, world!';
    render(<CopyButton textToCopy={textToCopy} />);

    const button = screen.getByRole('button', { name: /copy/i });
    expect(button).toBeInTheDocument();

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(textToCopy);
    expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument();

    await act(async () => {
      vi.runAllTimers();
    });

    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });
});
