import { render, screen, fireEvent } from '@testing-library/react';
import { ProviderSettings } from './ProviderSettings';
import { vi } from 'vitest';

describe('ProviderSettings', () => {
  it('should render the provider settings', () => {
    render(
      <ProviderSettings
        provider="openai"
        title="OpenAI"
        models={['gpt-4', 'gpt-3.5-turbo']}
        onKeyChange={vi.fn()}
        onModelChange={vi.fn()}
        onValidate={vi.fn()}
        isValidationInProgress={false}
        isModelsLoading={false}
        keyStatus="valid"
        currentKey="sk-123"
        currentModel="gpt-4"
        isKeyVisible={false}
        toggleKeyVisibility={vi.fn()}
      />
    );

    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('OpenAI API Key')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should call onKeyChange on key input', () => {
    const onKeyChange = vi.fn();
    render(
      <ProviderSettings
        provider="openai"
        title="OpenAI"
        models={[]}
        onKeyChange={onKeyChange}
        onModelChange={vi.fn()}
        onValidate={vi.fn()}
        isValidationInProgress={false}
        isModelsLoading={false}
        keyStatus="unchecked"
        currentKey=""
        currentModel=""
        isKeyVisible={true}
        toggleKeyVisibility={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('OpenAI API Key');
    fireEvent.change(input, { target: { value: 'new key' } });
    expect(onKeyChange).toHaveBeenCalledWith('openai', 'new key');
  });

  it('should call onModelChange on model selection', () => {
    const onModelChange = vi.fn();
    render(
      <ProviderSettings
        provider="openai"
        title="OpenAI"
        models={['gpt-4', 'gpt-3.5-turbo']}
        onKeyChange={vi.fn()}
        onModelChange={onModelChange}
        onValidate={vi.fn()}
        isValidationInProgress={false}
        isModelsLoading={false}
        keyStatus="valid"
        currentKey="sk-123"
        currentModel="gpt-4"
        isKeyVisible={false}
        toggleKeyVisibility={vi.fn()}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'gpt-3.5-turbo' } });
    expect(onModelChange).toHaveBeenCalledWith('openai', 'gpt-3.5-turbo');
  });

  it('should call onValidate on blur', () => {
    const onValidate = vi.fn();
    render(
      <ProviderSettings
        provider="openai"
        title="OpenAI"
        models={[]}
        onKeyChange={vi.fn()}
        onModelChange={vi.fn()}
        onValidate={onValidate}
        isValidationInProgress={false}
        isModelsLoading={false}
        keyStatus="unchecked"
        currentKey=""
        currentModel=""
        isKeyVisible={true}
        toggleKeyVisibility={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('OpenAI API Key');
    fireEvent.blur(input);
    expect(onValidate).toHaveBeenCalledWith('openai');
  });

  it('should call toggleKeyVisibility on button click', () => {
    const toggleKeyVisibility = vi.fn();
    render(
      <ProviderSettings
        provider="openai"
        title="OpenAI"
        models={[]}
        onKeyChange={vi.fn()}
        onModelChange={vi.fn()}
        onValidate={vi.fn()}
        isValidationInProgress={false}
        isModelsLoading={false}
        keyStatus="unchecked"
        currentKey=""
        currentModel=""
        isKeyVisible={false}
        toggleKeyVisibility={toggleKeyVisibility}
      />
    );

    const button = screen.getByText('Show');
    fireEvent.click(button);
    expect(toggleKeyVisibility).toHaveBeenCalled();
  });

  it('should call onKeyChange with empty string on clear', () => {
    const onKeyChange = vi.fn();
    render(
      <ProviderSettings
        provider="openai"
        title="OpenAI"
        models={[]}
        onKeyChange={onKeyChange}
        onModelChange={vi.fn()}
        onValidate={vi.fn()}
        isValidationInProgress={false}
        isModelsLoading={false}
        keyStatus="unchecked"
        currentKey="some-key"
        currentModel=""
        isKeyVisible={true}
        toggleKeyVisibility={vi.fn()}
      />
    );

    const button = screen.getByText('Clear');
    fireEvent.click(button);
    expect(onKeyChange).toHaveBeenCalledWith('openai', '');
  });

  it('should show checkmark when keyStatus is valid', () => {
    render(
      <ProviderSettings
        provider="openai"
        title="OpenAI"
        models={[]}
        onKeyChange={vi.fn()}
        onModelChange={vi.fn()}
        onValidate={vi.fn()}
        isValidationInProgress={false}
        isModelsLoading={false}
        keyStatus="valid"
        currentKey="sk-123"
        currentModel=""
        isKeyVisible={true}
        toggleKeyVisibility={vi.fn()}
      />
    );

    expect(screen.getByTitle('Valid key')).toBeInTheDocument();
  });

  it('should show cross mark when keyStatus is invalid', () => {
    render(
      <ProviderSettings
        provider="openai"
        title="OpenAI"
        models={[]}
        onKeyChange={vi.fn()}
        onModelChange={vi.fn()}
        onValidate={vi.fn()}
        isValidationInProgress={false}
        isModelsLoading={false}
        keyStatus="invalid"
        currentKey="sk-123"
        currentModel=""
        isKeyVisible={true}
        toggleKeyVisibility={vi.fn()}
      />
    );

    expect(screen.getByTitle('Invalid or expired key')).toBeInTheDocument();
  });

  it('should show loading models when isModelsLoading is true', () => {
    render(
      <ProviderSettings
        provider="openai"
        title="OpenAI"
        models={[]}
        onKeyChange={vi.fn()}
        onModelChange={vi.fn()}
        onValidate={vi.fn()}
        isValidationInProgress={false}
        isModelsLoading={true}
        keyStatus="valid"
        currentKey="sk-123"
        currentModel=""
        isKeyVisible={true}
        toggleKeyVisibility={vi.fn()}
      />
    );

    expect(screen.getByText('Loading models...')).toBeInTheDocument();
  });
});
