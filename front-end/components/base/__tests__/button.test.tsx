import React from 'react';
import { render, screen } from '@testing-library/react-native';

import Button from '@/components/base/button';

describe('Button', () => {
  it('is exposed to assistive tech as a button', async () => {
    await render(<Button onPress={jest.fn()}>Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
  });

  it('reports itself as disabled while loading', async () => {
    await render(
      <Button onPress={jest.fn()} isLoading>
        Save
      </Button>,
    );

    expect(screen.getByRole('button')).toBeDisabled();
  });
});
