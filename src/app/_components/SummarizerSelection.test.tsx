import { render, screen, fireEvent } from '@testing-library/react';
import { SummarizerSelection } from './SummarizerSelection';
import { vi } from 'vitest';

describe('SummarizerSelection', () => {
  it('should render the summarizer selection', () => {
    render(
      <SummarizerSelection
        summarizerSelection=""
        setSummarizerSelection={vi.fn()}
        validProviders={['openai', 'google']}
        modelLists={{
          openai: ['gpt-4', 'gpt-3.5-turbo'],
          google: ['gemini-pro', 'gemini-flash'],
          anthropic: [],
        }}
      />
    );

    expect(screen.getByText('Summarizer:')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should show a message when there are no valid providers', () => {
    render(
      <SummarizerSelection
        summarizerSelection=""
        setSummarizerSelection={vi.fn()}
        validProviders={[]}
        modelLists={{
          openai: [],
          google: [],
          anthropic: [],
        }}
      />
    );

    expect(screen.getByText('Enter a valid API key to select a summarizer')).toBeInTheDocument();
  });

  it('should call setSummarizerSelection on change', () => {
    const setSummarizerSelection = vi.fn();
    render(
      <SummarizerSelection
        summarizerSelection=""
        setSummarizerSelection={setSummarizerSelection}
        validProviders={['openai']}
        modelLists={{
          openai: ['gpt-4'],
          google: [],
          anthropic: [],
        }}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'openai:gpt-4' } });
    expect(setSummarizerSelection).toHaveBeenCalledWith('openai:gpt-4');
  });
});
