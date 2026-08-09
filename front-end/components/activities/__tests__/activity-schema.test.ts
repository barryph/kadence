import { activitySchema } from '../activity-schema';

describe('activitySchema', () => {
  const validActivity = {
    name: 'Morning Run',
    ticker: 'RUN',
    interval: 7,
    categoryId: 1,
    lastDone: null,
  };

  it('accepts valid activity data', () => {
    expect(activitySchema.safeParse(validActivity).success).toBe(true);
  });

  it('rejects an empty name', () => {
    const result = activitySchema.safeParse({ ...validActivity, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a name longer than 30 characters', () => {
    const result = activitySchema.safeParse({
      ...validActivity,
      name: 'a'.repeat(31),
    });
    expect(result.success).toBe(false);
  });

  it('rejects a ticker longer than 5 characters', () => {
    const result = activitySchema.safeParse({
      ...validActivity,
      ticker: 'TOOLONG',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an interval of zero', () => {
    const result = activitySchema.safeParse({ ...validActivity, interval: 0 });
    expect(result.success).toBe(false);
  });

  it('coerces string interval to number', () => {
    const result = activitySchema.safeParse({
      ...validActivity,
      interval: '14',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.interval).toBe(14);
    }
  });

  it('accepts null categoryId', () => {
    const result = activitySchema.safeParse({
      ...validActivity,
      categoryId: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts a valid goal target', () => {
    const result = activitySchema.safeParse({
      ...validActivity,
      goalTargetPerWeek: 3,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.goalTargetPerWeek).toBe(3);
    }
  });

  it('accepts no goal (null)', () => {
    const result = activitySchema.safeParse({
      ...validActivity,
      goalTargetPerWeek: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.goalTargetPerWeek).toBeNull();
    }
  });

  it('rejects a goal target above 7', () => {
    const result = activitySchema.safeParse({
      ...validActivity,
      goalTargetPerWeek: 8,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a goal target below 1', () => {
    const result = activitySchema.safeParse({
      ...validActivity,
      goalTargetPerWeek: 0,
    });
    expect(result.success).toBe(false);
  });
});
