import {
  clampGoalProgress,
  formatGoalProgress,
  isGoalMet,
} from '../goal-progress';

describe('goal-progress', () => {
  describe('clampGoalProgress', () => {
    it('returns 0 when nothing completed', () => {
      expect(clampGoalProgress(0, 3)).toBe(0);
    });

    it('returns the fraction below the target', () => {
      expect(clampGoalProgress(2, 3)).toBeCloseTo(2 / 3);
    });

    it('clamps at exactly the target to 1', () => {
      expect(clampGoalProgress(3, 3)).toBe(1);
    });

    it('clamps above the target to 1 (never exceeds the bar)', () => {
      expect(clampGoalProgress(5, 3)).toBe(1);
    });

    it('guards against a zero target', () => {
      expect(clampGoalProgress(2, 0)).toBe(0);
    });
  });

  describe('isGoalMet', () => {
    it('is false below the target', () => {
      expect(isGoalMet(2, 3)).toBe(false);
    });

    it('is true at the target', () => {
      expect(isGoalMet(3, 3)).toBe(true);
    });

    it('is true above the target', () => {
      expect(isGoalMet(5, 3)).toBe(true);
    });
  });

  describe('formatGoalProgress', () => {
    it('formats actual count vs target', () => {
      expect(formatGoalProgress(2, 3)).toBe('2 / 3 this week');
      expect(formatGoalProgress(5, 3)).toBe('5 / 3 this week');
    });
  });
});
