import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { TestSafeAreaProvider } from '@/test/setup/test-safe-area';
import HomeScreen from '@/app/(tabs)/index';
import TimelineScreen from '@/app/(tabs)/timeline';
import CategoriesScreen from '@/app/(tabs)/categories/index';
import ProfileScreen from '@/app/(tabs)/profile';
import { activitiesAPI } from '@/api/api.activity';
import { categoriesAPI } from '@/api/api.categories';
import { timelineAPI } from '@/api/api.timeline';
import { testActivities } from '@/test/setup/fixtures/activities';
import { testCategories } from '@/test/setup/fixtures/categories';
import { testTimeline } from '@/test/setup/fixtures/timeline';
import { setMockAuth } from '@/test/setup/mock-auth';

jest.mock('@/api/api.activity');
jest.mock('@/api/api.categories');
jest.mock('@/api/api.timeline');

jest.mock('@/context/auth-context', () =>
  require('@/test/setup/mock-auth').createAuthContextMock(),
);

const mockGetActivities = activitiesAPI.getAllByUser as jest.Mock;
const mockGetCategories = categoriesAPI.getAllByUser as jest.Mock;
const mockGetTimeline = timelineAPI.getTimeline as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  setMockAuth({ isAuthenticated: true });
  mockGetActivities.mockResolvedValue({
    data: { activities: testActivities },
  });
  mockGetCategories.mockResolvedValue({
    data: { categories: testCategories },
  });
  mockGetTimeline.mockResolvedValue({
    data: { timeline: testTimeline },
  });
});

describe('Tab screen smoke tests', () => {
  it('Home tab mounts', async () => {
    await render(
      <TestSafeAreaProvider>
        <HomeScreen />
      </TestSafeAreaProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Activities In Motion')).toBeTruthy();
    });
  });

  it('Timeline tab mounts', async () => {
    await render(
      <TestSafeAreaProvider>
        <TimelineScreen />
      </TestSafeAreaProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('RUN')).toBeTruthy();
    });
  });

  it('Categories tab mounts', async () => {
    await render(
      <TestSafeAreaProvider>
        <CategoriesScreen />
      </TestSafeAreaProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Categories')).toBeTruthy();
    });
  });

  it('Profile tab mounts', async () => {
    await render(
      <TestSafeAreaProvider>
        <ProfileScreen />
      </TestSafeAreaProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Profile')).toBeTruthy();
    });
  });
});
