import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router'
import LayoutProtected from '../../Layouts/Protected'
import ActivityEdit from '../../components/ActivityEdit/ActivityEdit.tsx';
import { activitiesAPI } from '../../api/api.activity';
import type { IActivity } from '../../api/api.activity';

export const Route = createFileRoute('/activity/edit/$activityId')({
  component: RouteComponent,
})

function RouteComponent() {
  const [activity, setActivity] = useState<IActivity | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<null | string>(null);
  const { activityId } = Route.useParams();
  console.log('activityId:', activityId);

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchActivity() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await activitiesAPI.getById(activityId, { signal: abortController.signal });
        console.log('response', response);
        if (response.error) {
          setErrorMessage(response.error.message);
          setIsLoading(false);
          return;
        }
        if (response.data?.activity) {
          setActivity(response.data.activity);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching activity', err);
      }
    }
    fetchActivity();
  }, [activityId]);

  if (!activity) {
    return (
      <>Loading...</>
    )
  }

  // TODO: Show Error message
  return (
    <LayoutProtected>
      <ActivityEdit activity={activity} />
    </LayoutProtected>
  )
}
