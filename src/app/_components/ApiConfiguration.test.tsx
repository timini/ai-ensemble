import { render, screen } from '@testing-library/react';
import { ApiConfiguration } from './ApiConfiguration';
import { vi } from 'vitest';

describe('ApiConfiguration', () => {
  it('should render the API configuration section', () => {
    render(
      <ApiConfiguration
        keys={{ openai: '', google: '', anthropic: '' }}
        handleKeyChange={vi.fn()}
        models={{ openai: 'gpt-4', google: 'gemini-1.5-flash', anthropic: 'claude-2' }}
        handleModelChange={vi.fn()}
        keyStatus={{ openai: 'unchecked', google: 'unchecked', anthropic: 'unchecked' }}
        handleValidateKey={vi.fn()}
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

  it('should show validation in progress when initialLoad is true', () => {
    render(
      <ApiConfiguration
        keys={{ openai: '', google: '', anthropic: '' }}
        handleKeyChange={vi.fn()}
        models={{ openai: 'gpt-4', google: 'gemini-1.5-flash', anthropic: 'claude-2' }}
        handleModelChange={vi.fn()}
        keyStatus={{ openai: 'unchecked', google: 'unchecked', anthropic: 'unchecked' }}
        handleValidateKey={vi.fn()}
        modelLists={{ openai: [], google: [], anthropic: [] }}
        initialLoad={true}
        validationInProgress={new Set()}
        modelsLoading={new Set()}
        isKeyVisible={new Set()}
        toggleKeyVisibility={vi.fn()}
      />
    );

    expect(screen.getAllByText('⏳')).toHaveLength(3);
  });

  it('should show validation in progress when validationInProgress is true', () => {
    render(
      <ApiConfiguration
        keys={{ openai: '', google: '', anthropic: '' }}
        handleKeyChange={vi.fn()}
        models={{ openai: 'gpt-4', google: 'gemini-1.5-flash', anthropic: 'claude-2' }}
        handleModelChange={vi.fn()}
        keyStatus={{ openai: 'unchecked', google: 'unchecked', anthropic: 'unchecked' }}
        handleValidateKey={vi.fn()}
        modelLists={{ openai: [], google: [], anthropic: [] }}
        initialLoad={false}
        validationInProgress={new Set(['openai'])}
        modelsLoading={new Set()}
        isKeyVisible={new Set()}
        toggleKeyVisibility={vi.fn()}
      />
    );

    expect(screen.getAllByText('⏳')).toHaveLength(1);
  });
});
