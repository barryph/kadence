export function clampGoalProgress(count: number, target: number): number {
  if (target <= 0) {
    return 0;
  }
  return Math.min(Math.max(count / target, 0), 1);
}

export function isGoalMet(count: number, target: number): boolean {
  return count >= target;
}

export function formatGoalProgress(count: number, target: number): string {
  return `${count} / ${target} this week`;
}
