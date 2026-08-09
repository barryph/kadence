import React from 'react';
import { render, screen } from '@testing-library/react-native';
import GoalProgressBar from '../goal-progress-bar';

describe('GoalProgressBar', () => {
  it('labels the progress with the actual count and target', async () => {
    await render(<GoalProgressBar count={2} target={3} />);
    expect(screen.getByLabelText('Goal progress 2 of 3')).toBeTruthy();
  });

  it('renders zero progress without crashing', async () => {
    await render(<GoalProgressBar count={0} target={3} />);
    expect(screen.getByLabelText('Goal progress 0 of 3')).toBeTruthy();
  });

  it('keeps the actual count in the label when above the target', async () => {
    await render(<GoalProgressBar count={5} target={3} />);
    expect(screen.getByLabelText('Goal progress 5 of 3')).toBeTruthy();
  });
});
