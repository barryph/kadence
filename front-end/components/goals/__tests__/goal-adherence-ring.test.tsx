import React from 'react';
import { render, screen } from '@testing-library/react-native';
import GoalAdherenceRing from '../goal-adherence-ring';

jest.mock('react-native-chart-kit', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    ProgressChart: () => React.createElement(View),
  };
});

describe('GoalAdherenceRing', () => {
  it('renders the adherence percentage', async () => {
    await render(
      <GoalAdherenceRing
        adherence={{ applicable: 4, met: 2, percentage: 0.5 }}
        periodLabel="last 8 weeks"
      />,
    );
    expect(screen.getByText('50%')).toBeTruthy();
    expect(screen.getByText(/Adherence · last 8 weeks/)).toBeTruthy();
  });

  it('shows a placeholder when there are no applicable weeks', async () => {
    await render(
      <GoalAdherenceRing
        adherence={{ applicable: 0, met: 0, percentage: null }}
        periodLabel="last 8 weeks"
      />,
    );
    expect(screen.getByText('—')).toBeTruthy();
  });
});
