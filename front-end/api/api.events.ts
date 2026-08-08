import { apiClient, type OptionalOptions } from './api.client';

export interface IActivityEvent {
  activityId: string;
  categoryId: number | null;
  date: string;
}

interface GetActivityEventsResponse {
  events: IActivityEvent[];
}

export const activityEventsAPI = {
  getEvents(from: string, to: string, options?: OptionalOptions) {
    const params = new URLSearchParams({ from, to });
    return apiClient.get<GetActivityEventsResponse>(
      `/activities/events?${params.toString()}`,
      options,
    );
  },
};
