import { render, screen, fireEvent } from '@testing-library/react';
import { PromptInput } from './PromptInput';
import { vi } from 'vitest';

describe('PromptInput', () => {
  it('should render the prompt input', () => {
    render(
      <PromptInput
        prompt=""
        setPrompt={vi.fn()}
        placeholder="Enter your prompt here..."
      />
    );

    expect(screen.getByPlaceholderText('Enter your prompt here...')).toBeInTheDocument();
  });

  it('should call setPrompt on change', () => {
    const setPrompt = vi.fn();
    render(
      <PromptInput
        prompt=""
        setPrompt={setPrompt}
        placeholder="Enter your prompt here..."
      />
    );

    const textarea = screen.getByPlaceholderText('Enter your prompt here...');
    fireEvent.change(textarea, { target: { value: 'new prompt' } });
    expect(setPrompt).toHaveBeenCalledWith('new prompt');
  });
});
