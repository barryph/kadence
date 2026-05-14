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
  const { activityId } = Route.useParams();
  const [activity, setActivity] = useState<IActivity | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<null | string>(null);

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchActivity() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await activitiesAPI.getById(activityId, { signal: abortController.signal });
        if (response.error) {
          setErrorMessage(response.error.message);
        }
        if (response.data?.activity) {
          setActivity(response.data.activity);
        }
      } catch (err) {
        console.error('Error fetching activity', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchActivity();
  }, [activityId]);

  if (isLoading) {
    return (
      <>Loading...</>
    )
  }

  if (errorMessage) {
    return (
      <>Oops, something went wrong, please try refreshing the page</>
    )
  }

  if (!activity) {
    return (
      <>Could not find your activity</>
    )
  }

  return (
    <LayoutProtected>
      <ActivityEdit activity={activity} />
    </LayoutProtected>
  )
}
