import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ActivityListItem from '../activity-list-item';
import type { IActivityClient } from '@/api/api.activity';

const baseActivity: IActivityClient = {
  id: 1,
  userId: 'u1',
  name: 'Squats',
  interval: 3,
  daysUntil: 2,
};

async function renderItem(activity: IActivityClient) {
  await render(
    <ActivityListItem
      activity={activity}
      onEdit={jest.fn()}
      onComplete={jest.fn()}
      onClick={jest.fn()}
    />,
  );
}

describe('ActivityListItem', () => {
  it('shows no goal progress when the activity has no goal', async () => {
    await renderItem(baseActivity);
    expect(screen.queryByLabelText(/Goal progress/)).toBeNull();
  });

  it('shows current-week goal progress when the activity has a goal', async () => {
    await renderItem({
      ...baseActivity,
      goal: { id: 'g1', activityId: '1', targetPerWeek: 3 },
      goalProgress: { currentWeekCount: 2 },
    });
    expect(screen.getByLabelText('Goal progress 2 of 3')).toBeTruthy();
  });
});
