import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { FormProvider, useForm } from 'react-hook-form';
import type { ActivityFormValues } from '@/components/activities/activity-schema';
import ActivityCategoryField from '../activity-category-field';
import { TestQueryProvider } from '@/test/setup/test-query-client';
import { useCreateCategoryMutation } from '@/hooks/mutations/use-category-mutations';
import { testCategories, testCategory } from '@/test/setup/fixtures/categories';
import type { ICategory } from '@/api/api.categories';

jest.mock('@/hooks/mutations/use-category-mutations', () => ({
  useCreateCategoryMutation: jest.fn(),
  useEditCategoryMutation: jest.fn(() => ({ mutateAsync: jest.fn() })),
  useDeleteCategoryMutation: jest.fn(() => ({ mutateAsync: jest.fn() })),
}));

const mockUseCreateCategoryMutation = useCreateCategoryMutation as jest.Mock;

function Harness({
  categories = testCategories,
  initialCategoryId = null,
}: {
  categories?: ICategory[];
  initialCategoryId?: ActivityFormValues['categoryId'];
}) {
  const form = useForm<ActivityFormValues>({
    defaultValues: {
      name: '',
      ticker: '',
      interval: 1,
      categoryId: initialCategoryId,
      lastDone: null,
      goalTargetPerWeek: null,
    },
  });
  const categoryId = form.watch('categoryId');

  return (
    <TestQueryProvider>
      <FormProvider {...form}>
        <ActivityCategoryField categories={categories} />
        <Text testID="categoryId-value">{String(categoryId)}</Text>
      </FormProvider>
    </TestQueryProvider>
  );
}

describe('ActivityCategoryField', () => {
  beforeEach(() => {
    mockUseCreateCategoryMutation.mockReturnValue({
      mutateAsync: jest.fn(),
    });
  });

  it('renders the label and placeholder when no category is selected', async () => {
    await render(<Harness />);
    expect(screen.getByText('Category')).toBeTruthy();
    expect(screen.getByText('Choose a Category')).toBeTruthy();
  });

  it('loads an existing category', async () => {
    await render(<Harness initialCategoryId={testCategory.id} />);
    expect(screen.getByText('Fitness')).toBeTruthy();
    expect(screen.getByText('Clear category')).toBeTruthy();
  });

  it('shows the create category action and categories when opened', async () => {
    await render(<Harness />);
    await fireEvent.press(screen.getByText('Choose a Category'));
    expect(screen.getByText('+ Create Category')).toBeTruthy();
    expect(screen.getByText('Fitness')).toBeTruthy();
    expect(screen.getByText('Work')).toBeTruthy();
  });

  it('marks the currently selected category as selected when opened', async () => {
    await render(<Harness initialCategoryId={2} />);
    await fireEvent.press(screen.getByText('Work'));
    const selected = screen.getByRole('button', {
      name: 'Work',
      selected: true,
    });
    expect(selected).toBeTruthy();
  });

  it('selects a category and closes the sheet', async () => {
    await render(<Harness />);
    await fireEvent.press(screen.getByText('Choose a Category'));
    await fireEvent.press(screen.getByText('Work'));
    expect(screen.getByTestId('categoryId-value')).toHaveTextContent('2');
    expect(screen.getByText('Work')).toBeTruthy();
    expect(screen.queryByText('Fitness')).toBeNull();
  });

  it('shows an empty state but still offers create category when there are no categories', async () => {
    await render(<Harness categories={[]} />);
    await fireEvent.press(screen.getByText('Choose a Category'));
    expect(screen.getByText('+ Create Category')).toBeTruthy();
    expect(screen.getByText(/No categories yet/)).toBeTruthy();
    expect(screen.queryByText('Fitness')).toBeNull();
  });

  it('clears the selected category', async () => {
    await render(<Harness initialCategoryId={testCategory.id} />);
    await fireEvent.press(screen.getByText('Clear category'));
    expect(screen.getByTestId('categoryId-value')).toHaveTextContent('null');
    expect(screen.getByText('Choose a Category')).toBeTruthy();
  });

  it('creates a category and selects it', async () => {
    const newCategory: ICategory = { id: 99, name: 'Music', color: '#00ff34' };
    mockUseCreateCategoryMutation.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue(newCategory),
    });

    await render(<Harness categories={[]} />);
    await fireEvent.press(screen.getByText('Choose a Category'));
    await fireEvent.press(screen.getByText('+ Create Category'));
    expect(screen.getByText('Create A Category')).toBeTruthy();

    await fireEvent.changeText(screen.getByPlaceholderText('Legs'), 'Music');
    await fireEvent.press(screen.getByText('Save'));

    expect(mockUseCreateCategoryMutation).toHaveBeenCalled();
    expect(screen.getByTestId('categoryId-value')).toHaveTextContent('99');
  });
});
