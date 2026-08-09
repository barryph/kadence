import ActivityGoal from './activityGoal.entity';

describe('ActivityGoal', () => {
  it('creates a valid goal', () => {
    const goal = ActivityGoal.createNew({
      activityId: '1',
      targetPerWeek: 3,
    });
    expect(goal.activityId).toBe('1');
    expect(goal.targetPerWeek).toBe(3);
    expect(goal.isPersisted()).toBe(false);
  });

  it('reconstitutes a persisted goal', () => {
    const goal = ActivityGoal.reconstitute({
      id: 'g1',
      activityId: '1',
      targetPerWeek: 7,
    });
    expect(goal.id).toBe('g1');
    expect(goal.isPersisted()).toBe(true);
  });

  it('rejects targets below 1', () => {
    expect(() =>
      ActivityGoal.createNew({ activityId: '1', targetPerWeek: 0 }),
    ).toThrow('Goal Failed Validation');
  });

  it('rejects targets above 7', () => {
    expect(() =>
      ActivityGoal.createNew({ activityId: '1', targetPerWeek: 8 }),
    ).toThrow('Goal Failed Validation');
  });

  it('rejects non-integer targets', () => {
    expect(() =>
      ActivityGoal.createNew({ activityId: '1', targetPerWeek: 2.5 }),
    ).toThrow('Goal Failed Validation');
  });

  it('rejects a missing activity id', () => {
    expect(() =>
      ActivityGoal.createNew({
        activityId: undefined as unknown as string,
        targetPerWeek: 3,
      }),
    ).toThrow('Goal Failed Validation');
  });

  it('changes the target to any value in range', () => {
    const goal = ActivityGoal.createNew({
      activityId: '1',
      targetPerWeek: 3,
    });
    goal.changeTargetPerWeek(5);
    expect(goal.targetPerWeek).toBe(5);
  });

  it('rejects an out-of-range target change', () => {
    const goal = ActivityGoal.createNew({
      activityId: '1',
      targetPerWeek: 3,
    });
    expect(() => goal.changeTargetPerWeek(9)).toThrow('Goal Failed Validation');
  });
});
