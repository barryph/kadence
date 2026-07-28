import ActivityEvent from './activityEvent.entity';

describe('ActivityEvent', () => {
  it('creates an event with a valid YYYY-MM-DD date', () => {
    const event = ActivityEvent.createNew({
      activityId: '1',
      date: '2026-01-15',
    });

    expect(event.date).toBe('2026-01-15');
    expect(event.activityId).toBe('1');
  });

  it('rejects blank dates', () => {
    expect(() =>
      ActivityEvent.createNew({ activityId: '1', date: '' }),
    ).toThrow('Date cant be blank');
  });

  it('rejects invalid date formats', () => {
    expect(() =>
      ActivityEvent.createNew({ activityId: '1', date: '01-15-2026' }),
    ).toThrow('Date must be in YYYY-MM-DD format');
  });
});
