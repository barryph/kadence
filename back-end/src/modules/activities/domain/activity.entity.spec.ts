import Activity from './activity.entity';
import ActivityTicker from './activityTicker.vo';

describe('Activity', () => {
  it('creates a new activity without an id', () => {
    const activity = Activity.createNew({
      userId: 'user-1',
      name: 'Exercise',
      interval: 7,
    });

    expect(activity.isPersisted()).toBe(false);
    expect(activity.name).toBe('Exercise');
  });

  it('reconstitutes a persisted activity', () => {
    const activity = Activity.reconstitute({
      id: '1',
      userId: 'user-1',
      name: 'Exercise',
      interval: 7,
      ticker: ActivityTicker.create('SQUT'),
    });

    expect(activity.isPersisted()).toBe(true);
    expect(activity.id).toBe('1');
    expect(activity.ticker?.value).toBe('SQUT');
  });

  it('throws when accessing id before persistence', () => {
    const activity = Activity.createNew({
      userId: 'user-1',
      name: 'Exercise',
      interval: 7,
    });

    expect(() => activity.id).toThrow('Activity has not been persisted yet');
  });
});
