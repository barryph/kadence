import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import CategoryModal from '@/components/categories/category-modal';
import type { ICategory } from '@/api/api.categories';
import type { ApiResponse } from '@/api/api.types';

async function renderModal(
  onSubmit: jest.Mock<Promise<ApiResponse<{ category: ICategory }>>, [unknown]>,
) {
  const onSave = jest.fn();
  const onClose = jest.fn();

  const view = await render(
    <CategoryModal
      initialValues={{ name: 'Legs', color: '#ff0000' }}
      onSubmit={onSubmit}
      onSave={onSave}
      onClose={onClose}
    />,
  );

  return { onSave, onClose, ...view };
}

describe('CategoryModal', () => {
  it('clears the loading state and reports a rejected submit', async () => {
    // The edit path can reject with a plain Error (no selected category), which
    // used to leave the modal loading forever with no message and a dead Cancel.
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const onSubmit = jest
      .fn()
      .mockRejectedValue(new Error('No selected category'));

    try {
      const { onSave } = await renderModal(onSubmit);

      await fireEvent.press(screen.getByText('Save'));

      await waitFor(() => {
        expect(
          screen.getByText('Something went wrong, please try again.'),
        ).toBeTruthy();
      });

      // The form is usable again and nothing was saved.
      expect(screen.getByText('Save')).toBeTruthy();
      expect(onSave).not.toHaveBeenCalled();
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
