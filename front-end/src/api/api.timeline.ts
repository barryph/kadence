import { apiClient, type OptionalOptions } from "./api.client";

export interface GetTimelineResponse {
  timeline: ITimeline;
}

export type ITimelineItem = string[]; // an array of YYYY-MM-DD dates that the event occured on
export interface ITimeline {
  [key: string]: ITimelineItem // keyed by activity id
}
export type ITimelineSetItem = Set<string> // a set of YYYY-MM-DD dates that the event occured on
export interface ITimelineSet {
  [key: string]: ITimelineSetItem // keyed by activity id
}

export const timelineAPI = {
  getTimeline(month: string, options?: OptionalOptions) {
    return apiClient.get<GetTimelineResponse>(
      `/activities/timeline?month=${month}`,
      options,
    )
  },
};
