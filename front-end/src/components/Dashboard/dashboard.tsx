import './dashboard.css';
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import ActivityEdit from '../ActivityEdit/ActivityEdit';
import NewActivityOverlay from '../NewActivityOverlay';
import LayoutProtected from '../../Layouts/Protected'
import { activitiesAPI } from '../../api/api.activity';
import SwipeRow from '../SwipeRow';

// TODO: Add grid with number of days
// TODO: Persist queued

// TODO: Resolve this conflicts with IActivity in api.activities.ts
interface IActivityClient {
  id: string;
  userId: string;
  name: string;
  ticker?: string;
  interval: number;
  daysUntil: number;
  categoryId?: string;

  // Client side only
  category?: string;
  categoryColor?: string;
  queued?: boolean;
}
export default function Dashboard() {
  const navigate = useNavigate()
  const DAYS_IN_WEEK = 7;
  const [activities, setActivities] = useState<IActivityClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeActivity, setActiveActivity] = useState<IActivityClient | null>(null);
  const [showEditPage, setShowEditPage] = useState(false);
  const [showNewActivityOverlay, setShowNewActivityOverlay] = useState(false);


  function sortActivities(activities: IActivityClient[] = []) {
    const sortedActivities = activities.sort((a, b) => {
      if (a.queued && b.queued || (!a.queued && !b.queued)) {
        return a.daysUntil - b.daysUntil;
      }
      if (a.queued) {
        return -1;
      } if (b.queued) {
        return 1;
      }
      return 0;
    })
    return sortedActivities;
  }

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchActivities() {
      console.log('fetch activities')
      try {
        const response = await activitiesAPI.getAllByUser({ signal: abortController.signal });
        console.log('response', response);
        if (response.data?.activities) {
          setActivities(sortActivities(response.data.activities));
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching activities', err);
      }
    }

    fetchActivities();
    return () => abortController.abort();
  }, []);

  function handleActivityClick(activity: IActivityClient) {
    // Toggle queued property
    const activitiesTemp = activities.map((a) => a.id === activity.id ? { ...a, queued: !activity.queued } : a);
    setActivities([...sortActivities(activitiesTemp)]);
  }

  async function handleComplete(activityId: string) {
    const today = new Date().toISOString().split('T')[0]; // String formatted as: YYYY-MM-DD
    const updateRes = await activitiesAPI.complete(activityId, today)

    if (!updateRes?.data?.activity) throw new Error('Error, no updated activity');
    const activitiesTemp = activities!.map((a) => a.id === activityId ? updateRes.data.activity : a);
    setActivities([...sortActivities(activitiesTemp)]);
  }

  function handleEdit(activity: IActivityClient) {
    console.log('handling edit trigger');
    navigate({ to: `/activity/edit/${activity.id}` })
  }

  function handleNewActivityOverlayClose(activity?: IActivityClient) {
    if (activity) {
      setActivities(sortActivities([...activities, activity]));
    }
    setShowNewActivityOverlay(false)
  }

  if (isLoading) {
    return (
      <div>Loading activities</div>
    );
  }

  return (
    <LayoutProtected>
      <div className="index__container">
        <div className="">
          {activities.map((activity) => (
            <div
              className="activity"
              style={{ '--delay': activity.daysUntil, '--interval': DAYS_IN_WEEK }}
              onClick={() => handleActivityClick(activity)}
              key={activity.id}
            >
              <SwipeRow
                onSwipeLeft={() => handleEdit(activity)}
                onSwipeRight={() => handleComplete(activity.id)}
                swipeLeftChild={<>&#9881;</>}
                swipeLeftColor="inherit"
                swipeLeftBackground="#e9ecf6"
                swipeRightChild={<>&#10003;</>}
                swipeRightColor="#fff"
                swipeRightBackground="#0072ff"
                queued={activity.queued}
              >
                <div className="activity__main">
                  <div className="activity__title" >
                    <div>
                      <span>{activity.name}</span>
                      <span className="activity__category" style={{ '--bg-color': activity.categoryColor }}>{activity.category}</span>
                    </div>
                    <div className="activity__details">&#8624; {activity.daysUntil} &#10227; {activity.interval}</div>
                    {/* {activity.overdue && ( */}
                    {/*   <span className="late_notice">{activity.daysLate} Days late</span> */}
                    {/* )} */}
                  </div>
                  <div className="activity__bar">
                    <div className="activity__bar_notches">
                      {Array.from({ length: DAYS_IN_WEEK }, (_, day) => (
                        <span className="activity__bar_notch" key={`${activity.id}-notch-${day}`} />
                      ))}
                    </div>
                    <div className="activity__bar_background" />
                  </div>
                </div>
              </SwipeRow>
              {/* {activity.queued && ( */}
              {/*   <div className="activity__accept">+</div> */}
              {/* )} */}
            </div>
          ))
          }
        </div >
        <div className="floating_add_button" onClick={() => setShowNewActivityOverlay(true)}>&#43;</div>

        {showNewActivityOverlay && (
          <NewActivityOverlay onClose={(activity) => handleNewActivityOverlayClose(activity)} />
        )}
      </div>
    </LayoutProtected>
  )
}
