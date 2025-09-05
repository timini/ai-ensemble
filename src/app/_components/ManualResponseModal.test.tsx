import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ManualResponseModal } from './ManualResponseModal';

describe('ManualResponseModal', () => {
  const mockOnClose = vi.fn();
  const mockOnAddResponse = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open', () => {
    render(
      <ManualResponseModal
        isOpen={true}
        onClose={mockOnClose}
        onAddResponse={mockOnAddResponse}
      />
    );

    expect(screen.getByText('Add Manual Response')).toBeInTheDocument();
    expect(screen.getByLabelText('Provider')).toBeInTheDocument();
    expect(screen.getByLabelText('Model Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Response')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <ManualResponseModal
        isOpen={false}
        onClose={mockOnClose}
        onAddResponse={mockOnAddResponse}
      />
    );

    expect(screen.queryByText('Add Manual Response')).not.toBeInTheDocument();
  });

  it('should have correct default values', () => {
    render(
      <ManualResponseModal
        isOpen={true}
        onClose={mockOnClose}
        onAddResponse={mockOnAddResponse}
      />
    );

    const providerSelect = screen.getByLabelText('Provider');
    const modelNameInput = screen.getByLabelText('Model Name');
    const responseTextarea = screen.getByLabelText('Response');

    expect(providerSelect).toHaveValue('openai');
    expect(modelNameInput).toHaveValue('');
    expect(responseTextarea).toHaveValue('');
  });

  it('should update form values when user types', () => {
    render(
      <ManualResponseModal
        isOpen={true}
        onClose={mockOnClose}
        onAddResponse={mockOnAddResponse}
      />
    );

    const modelNameInput = screen.getByLabelText('Model Name');
    const responseTextarea = screen.getByLabelText('Response');

    fireEvent.change(modelNameInput, { target: { value: 'GPT-4' } });
    fireEvent.change(responseTextarea, { target: { value: 'Test response' } });

    expect(modelNameInput).toHaveValue('GPT-4');
    expect(responseTextarea).toHaveValue('Test response');
  });

  it('should call onAddResponse with correct data when form is submitted', async () => {
    render(
      <ManualResponseModal
        isOpen={true}
        onClose={mockOnClose}
        onAddResponse={mockOnAddResponse}
      />
    );

    // Fill in the form
    const providerSelect = screen.getByLabelText('Provider');
    const modelNameInput = screen.getByLabelText('Model Name');
    const responseTextarea = screen.getByLabelText('Response');

    fireEvent.change(providerSelect, { target: { value: 'anthropic' } });
    fireEvent.change(modelNameInput, { target: { value: 'Claude-3-Sonnet' } });
    fireEvent.change(responseTextarea, { target: { value: 'This is a test response.' } });

    // Submit the form
    const submitButton = screen.getByText('Add Response');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnAddResponse).toHaveBeenCalledWith(
        'anthropic',
        'Claude-3-Sonnet',
        'This is a test response.'
      );
    });
  });

  it('should call onClose when cancel button is clicked', () => {
    render(
      <ManualResponseModal
        isOpen={true}
        onClose={mockOnClose}
        onAddResponse={mockOnAddResponse}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <ManualResponseModal
        isOpen={true}
        onClose={mockOnClose}
        onAddResponse={mockOnAddResponse}
      />
    );

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should reset form when modal is closed and reopened', () => {
    const { rerender } = render(
      <ManualResponseModal
        isOpen={true}
        onClose={mockOnClose}
        onAddResponse={mockOnAddResponse}
      />
    );

    // Fill in the form
    const modelNameInput = screen.getByLabelText('Model Name');
    const responseTextarea = screen.getByLabelText('Response');

    fireEvent.change(modelNameInput, { target: { value: 'GPT-4' } });
    fireEvent.change(responseTextarea, { target: { value: 'Test response' } });

    // Close the modal by clicking the close button
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    // Reopen the modal
    rerender(
      <ManualResponseModal
        isOpen={true}
        onClose={mockOnClose}
        onAddResponse={mockOnAddResponse}
      />
    );

    // Form should be reset
    const providerSelect = screen.getByLabelText('Provider');
    const modelNameInputReset = screen.getByLabelText('Model Name');
    const responseTextareaReset = screen.getByLabelText('Response');

    expect(providerSelect).toHaveValue('openai');
    expect(modelNameInputReset).toHaveValue('');
    expect(responseTextareaReset).toHaveValue('');
  });

  it('should have all provider options', () => {
    render(
      <ManualResponseModal
        isOpen={true}
        onClose={mockOnClose}
        onAddResponse={mockOnAddResponse}
      />
    );

    const providerSelect = screen.getByLabelText('Provider');
    const options = Array.from(providerSelect.querySelectorAll('option')).map(option => option.value);

    expect(options).toEqual(['openai', 'google', 'anthropic', 'grok']);
  });
});
