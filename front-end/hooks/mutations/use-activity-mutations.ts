import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  activitiesAPI,
  type IActivity,
  type IActivityClient,
} from '@/api/api.activity';
import { queryKeys } from '@/lib/query/keys';
import { patchTimelineSet } from '@/lib/query/timeline-utils';
import { unwrapApiResponse } from '@/lib/query/unwrap';

function updateActivitiesListCache(
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (activities: IActivity[]) => IActivity[],
) {
  queryClient.setQueryData<IActivity[]>(queryKeys.activities.all, (current) =>
    current ? updater(current) : current,
  );
}

function setActivityInCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  activity: IActivity,
) {
  queryClient.setQueryData(queryKeys.activities.detail(activity.id), activity);
  updateActivitiesListCache(queryClient, (activities) =>
    activities.map((item) => (item.id === activity.id ? activity : item)),
  );
}

function removeActivityFromCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  activityId: number | string,
) {
  queryClient.removeQueries({
    queryKey: queryKeys.activities.detail(activityId),
  });
  updateActivitiesListCache(queryClient, (activities) =>
    activities.filter((item) => String(item.id) !== String(activityId)),
  );
}

function invalidateTimeline(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.timeline.all });
}

export function useCreateActivityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      body: Parameters<typeof activitiesAPI.createActivity>[0],
    ) => {
      const resp = await activitiesAPI.createActivity(body);
      const data = unwrapApiResponse(resp);
      return data.activity;
    },
    onSuccess: (activity) => {
      updateActivitiesListCache(queryClient, (activities) => [
        ...activities,
        activity,
      ]);
      queryClient.setQueryData(
        queryKeys.activities.detail(activity.id),
        activity,
      );
      void invalidateTimeline(queryClient);
    },
  });
}

export function useEditActivityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      activityId,
      body,
    }: {
      activityId: number | string;
      body: Parameters<typeof activitiesAPI.editActivity>[1];
    }) => {
      const resp = await activitiesAPI.editActivity(activityId, body);
      const data = unwrapApiResponse(resp);
      return data.activity;
    },
    onSuccess: (activity) => {
      setActivityInCaches(queryClient, activity);
      void invalidateTimeline(queryClient);
    },
  });
}

export function useDeleteActivityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activityId: number | string) => {
      const resp = await activitiesAPI.deleteActivity(activityId);
      const data = unwrapApiResponse(resp);
      return data.id;
    },
    onSuccess: (activityId) => {
      removeActivityFromCaches(queryClient, activityId);
      void invalidateTimeline(queryClient);
    },
  });
}

export function useCompleteActivityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      activityId,
      date,
    }: {
      activityId: number | string;
      date: string;
    }) => {
      const resp = await activitiesAPI.complete(activityId, date);
      const data = unwrapApiResponse(resp);
      return { activity: data.activity, date };
    },
    onSuccess: ({ activity, date }) => {
      setActivityInCaches(queryClient, activity);
      queryClient.setQueriesData(
        { queryKey: queryKeys.timeline.all },
        (current: ReturnType<typeof patchTimelineSet> | undefined) =>
          current
            ? patchTimelineSet(current, activity.id, date, true)
            : current,
      );
    },
  });
}

export function useUndoActivityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      activityId,
      date,
    }: {
      activityId: number | string;
      date: string;
    }) => {
      const resp = await activitiesAPI.undo(activityId, date);
      const data = await unwrapApiResponse(resp);
      return { activity: data.activity, date };
    },
    onSuccess: ({ activity, date }) => {
      setActivityInCaches(queryClient, activity);
      queryClient.setQueriesData(
        { queryKey: queryKeys.timeline.all },
        (current: ReturnType<typeof patchTimelineSet> | undefined) =>
          current
            ? patchTimelineSet(current, activity.id, date, false)
            : current,
      );
    },
  });
}

export type { IActivityClient };
