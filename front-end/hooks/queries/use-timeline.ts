import { useQuery } from '@tanstack/react-query';
import { timelineAPI } from '@/api/api.timeline';
import { queryKeys } from '@/lib/query/keys';
import { timelineToSet } from '@/lib/query/timeline-utils';
import { unwrapApiResponse } from '@/lib/query/unwrap';

async function fetchTimelineMonth(month: string) {
  const resp = await timelineAPI.getTimeline(month);
  const data = unwrapApiResponse(resp);
  return timelineToSet(data.timeline);
}

export function useTimelineQuery(month: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.timeline.month(month),
    queryFn: () => fetchTimelineMonth(month),
    enabled: enabled && month.length > 0,
  });
}
