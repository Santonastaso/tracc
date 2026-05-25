import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GenericForm from '../ui/generic-form';

const formConfig = {
  addButtonText: 'Create',
  editButtonText: 'Save',
  addLoadingText: 'Creating...',
  editLoadingText: 'Saving...',
  sections: [
    {
      title: 'Details',
      fields: [
        {
          name: 'name',
          label: 'Name',
          type: 'text',
          required: true,
          validation: { required: 'Name is required' },
        },
      ],
    },
  ],
};

describe('GenericForm', () => {
  it('submits current values, calls success, and resets to initial data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onSuccess = vi.fn();

    render(
      <GenericForm
        config={formConfig}
        initialData={{ name: 'Original' }}
        onSubmit={onSubmit}
        onSuccess={onSuccess}
        showCancel={false}
        isEditMode
      />
    );

    const input = screen.getByLabelText(/Name/);
    await user.clear(input);
    await user.type(input, 'Changed');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: 'Changed' }));
    expect(onSuccess).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(input).toHaveValue('Original'));
  });

  it('runs cancel without submitting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(<GenericForm config={formConfig} onSubmit={onSubmit} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not call success or reset after a submit error', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error('failed'));
    const onSuccess = vi.fn();

    render(
      <GenericForm
        config={formConfig}
        initialData={{ name: 'Original' }}
        onSubmit={onSubmit}
        onSuccess={onSuccess}
        showCancel={false}
      />
    );

    const input = screen.getByLabelText(/Name/);
    await user.clear(input);
    await user.type(input, 'Changed');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: 'Changed' }));
    expect(onSuccess).not.toHaveBeenCalled();
    expect(input).toHaveValue('Changed');
  });
});
