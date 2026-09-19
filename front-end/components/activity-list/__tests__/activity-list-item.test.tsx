import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import ActivityListItem from '../activity-list-item';
import type { IActivityClient } from '@/api/api.activity';

const baseActivity: IActivityClient = {
  id: 1,
  userId: 'u1',
  name: 'Squats',
  interval: 3,
  daysUntil: 2,
};

async function renderItem(
  activity: IActivityClient,
  callbacks: {
    onEdit?: jest.Mock;
    onComplete?: jest.Mock;
    onClick?: jest.Mock;
  } = {},
) {
  const onEdit = callbacks.onEdit ?? jest.fn();
  const onComplete = callbacks.onComplete ?? jest.fn();
  const onClick = callbacks.onClick ?? jest.fn();

  const view = await render(
    <ActivityListItem
      activity={activity}
      onEdit={onEdit}
      onComplete={onComplete}
      onClick={onClick}
    />,
  );

  return { onEdit, onComplete, onClick, ...view };
}

type RenderedItem = Awaited<ReturnType<typeof renderItem>>;

function fireAction(view: RenderedItem, name: string) {
  fireEvent(view.getByRole('button'), 'accessibilityAction', {
    nativeEvent: { actionName: name },
  });
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

  it('does not offer complete for an activity already done today', async () => {
    const view = await renderItem({
      ...baseActivity,
      completedToday: true,
    });

    fireAction(view, 'complete');
    expect(view.onComplete).not.toHaveBeenCalled();
  });

  it('exposes edit and complete without a swipe gesture', async () => {
    // Swipe actions are unreachable for assistive tech, so the row offers the
    // same operations as accessibility actions.
    const view = await renderItem(baseActivity);

    fireAction(view, 'edit');
    expect(view.onEdit).toHaveBeenCalledWith(baseActivity);

    fireAction(view, 'complete');
    expect(view.onComplete).toHaveBeenCalledWith(baseActivity.id);
  });
});
