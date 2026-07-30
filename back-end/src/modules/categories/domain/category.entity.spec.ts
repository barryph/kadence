import Category from './category.entity';

describe('Category', () => {
  it('creates a new category', () => {
    const category = Category.createNew({
      userId: 'user-1',
      name: 'Health',
      color: '#ff0000',
    });

    expect(category.name).toBe('Health');
    expect(category.isPersisted()).toBe(false);
  });

  it('reconstitutes a persisted category', () => {
    const category = Category.reconstitute({
      id: '1',
      userId: 'user-1',
      name: 'Health',
      color: '#ff0000',
    });

    expect(category.isPersisted()).toBe(true);
    expect(category.id).toBe('1');
  });

  it('updates name and color', () => {
    const category = Category.reconstitute({
      id: '1',
      userId: 'user-1',
      name: 'Health',
      color: '#ff0000',
    });

    category.changeName('Fitness');
    category.changeColor('#00ff00');

    expect(category.name).toBe('Fitness');
    expect(category.color).toBe('#00ff00');
  });
});
