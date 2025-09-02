import { render, screen } from '@testing-library/react';
import { QueryForm } from './QueryForm';
import { vi } from 'vitest';

describe('QueryForm', () => {
  it('should render the query form', () => {
    render(
      <QueryForm
        prompt=""
        setPrompt={vi.fn()}
        keys={{ openai: '', google: '', anthropic: '' }}
        handleKeyChange={vi.fn()}
        models={{ openai: 'gpt-4', google: 'gemini-1.5-flash', anthropic: 'claude-2' }}
        handleModelChange={vi.fn()}
        keyStatus={{ openai: 'unchecked', google: 'unchecked', anthropic: 'unchecked' }}
        handleValidateKey={vi.fn()}
        summarizerSelection=""
        setSummarizerSelection={vi.fn()}
        handleSubmit={vi.fn()}
        ensembleQueryIsPending={false}
        validProviders={[]}
        modelLists={{ openai: [], google: [], anthropic: [] }}
        initialLoad={false}
        validationInProgress={new Set()}
        modelsLoading={new Set()}
        isKeyVisible={new Set()}
        toggleKeyVisibility={vi.fn()}
      />
    );

    expect(screen.getByText('API Configuration')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Openai API Key')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Google API Key')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Anthropic API Key')).toBeInTheDocument();
  });

  it('should disable the submit button when the query is pending', () => {
    render(
      <QueryForm
        prompt="a prompt"
        setPrompt={vi.fn()}
        keys={{ openai: '', google: '', anthropic: '' }}
        handleKeyChange={vi.fn()}
        models={{ openai: 'gpt-4', google: 'gemini-1.5-flash', anthropic: 'claude-2' }}
        handleModelChange={vi.fn()}
        keyStatus={{ openai: 'valid', google: 'valid', anthropic: 'valid' }}
        handleValidateKey={vi.fn()}
        summarizerSelection="openai:gpt-4"
        setSummarizerSelection={vi.fn()}
        handleSubmit={vi.fn()}
        handleStreamingSubmit={vi.fn()}
        ensembleQueryIsPending={true}
        validProviders={['openai', 'google', 'anthropic']}
        modelLists={{ openai: ['gpt-4'], google: ['gemini-1.5-flash'], anthropic: ['claude-2'] }}
        initialLoad={false}
        validationInProgress={new Set()}
        modelsLoading={new Set()}
        isKeyVisible={new Set()}
        toggleKeyVisibility={vi.fn()}
        isStreaming={true}
      />
    );

    const button = screen.getByRole('button', { name: /streaming.../i });
    expect(button).toBeDisabled();
  });
});
