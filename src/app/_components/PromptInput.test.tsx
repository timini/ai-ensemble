import { render, screen, fireEvent } from '@testing-library/react';
import { PromptInput } from './PromptInput';
import { vi } from 'vitest';

describe('PromptInput', () => {
  it('should render the prompt input', () => {
    render(
      <PromptInput
        value=""
        onChange={vi.fn()}
        placeholder="Enter your prompt here..."
      />
    );

    expect(screen.getByPlaceholderText('Enter your prompt here...')).toBeInTheDocument();
  });

  it('should call onChange on change', () => {
    const onChange = vi.fn();
    render(
      <PromptInput
        value=""
        onChange={onChange}
        placeholder="Enter your prompt here..."
      />
    );

    const textarea = screen.getByPlaceholderText('Enter your prompt here...');
    fireEvent.change(textarea, { target: { value: 'new prompt' } });
    expect(onChange).toHaveBeenCalledWith('new prompt');
  });
});
