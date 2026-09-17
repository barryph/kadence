import React from 'react';
import { render, screen } from '@testing-library/react-native';

import FilterList from '@/components/filter-list/filter-list';

const items = [
  { id: 1, name: 'Fitness', color: '#038df0' },
  { id: 2, name: 'Work', color: '#ff3d54' },
];

describe('FilterList', () => {
  it('exposes each pill as a selected/unselected button', async () => {
    await render(
      <FilterList
        label="Categories"
        items={items}
        selectedIds={2}
        onItemPress={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Fitness' })).not.toBeSelected();
    expect(screen.getByRole('button', { name: 'Work' })).toBeSelected();
  });
});
