import './dashboard.css';
import { useEffect, useState } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import NewActivityOverlay from '../NewActivityOverlay';
import LayoutProtected from '../../Layouts/Protected'
import { activitiesAPI } from '../../api/api.activity';

// TODO: Add grid with number of days

// TODO: Resolve this conflicts with IActivity in api.activities.ts
interface IActivity {
  id: string;
  name: string;
  ticker?: string;
  interval: number;
  daysUntil: number;
  category: string;
  categoryColor: string;
  queued: boolean;
}

export default function Dashboard() {
  const DAYS_IN_WEEK = 7;
  const [activities, setActivities] = useState<IActivity[] | undefined>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showNewActivityOverlay, setShowNewActivityOverlay] = useState(false);

  function sortActivities(activities: IActivity[] = []) {
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

  // const [activities, setActivities] = useState<IActivity[]>(() => {
  //   return [];
  //   // return sortActivities([
  //   //   {
  //   //     id: '1',
  //   //     name: 'Sprint',
  //   //     interval: 2,
  //   //     daysUntil: 0,
  //   //     category: 'Sprints',
  //   //     categoryColor: 'green',
  //   //     queued: false,
  //   //   },
  //   //   {
  //   //     id: '2',
  //   //     name: 'Max Jumps',
  //   //     interval: 4,
  //   //     daysUntil: 2,
  //   //     category: 'Jumping',
  //   //     categoryColor: 'red',
  //   //     queued: true,
  //   //   },
  //   //   {
  //   //     id: '3',
  //   //     name: 'Pogos',
  //   //     interval: 4,
  //   //     daysUntil: 3,
  //   //     category: 'Jumping',
  //   //     categoryColor: 'red',
  //   //     queued: false,
  //   //   },
  //   //   {
  //   //     id: '4',
  //   //     name: 'Power Cleans',
  //   //     interval: 4,
  //   //     daysUntil: 4,
  //   //     category: 'Lifting',
  //   //     categoryColor: 'blue',
  //   //     queued: false,
  //   //   },
  //   //   {
  //   //     id: '5',
  //   //     name: 'Power Cleans',
  //   //     interval: 4,
  //   //     daysUntil: 6,
  //   //     category: 'Lifting',
  //   //     categoryColor: 'blue',
  //   //     queued: false,
  //   //   },
  //   // ])
  // });

  function handleActivityClick(event: Event, activity: IActivity) {
    if (activity.queued) {
      setActiveActivityId(activity.id);
      setShowConfirmModal(true);
    } else {
      const activitiesTemp = activities.map((a) => a.id === activity.id ? { ...a, queued: true } : a);
      setActivities([...sortActivities(activitiesTemp)]);
    }
  }

  function handleFocusOut() {
    if (!showConfirmModal) return;
    setActiveActivityId(null);
    setShowConfirmModal(false);
  }
  function removeFromQueue() {
    const activity = activities.find(activity => activity.id === activeActivityId);
    if (!activity) throw new Error('Could not find activity to remove from queue');
    const activitiesTemp = activities.map((a) => a.id === activity.id ? { ...a, queued: false } : a);
    setActivities([...sortActivities(activitiesTemp)]);

    setActiveActivityId(null);
    setShowConfirmModal(false);
  }
  async function completeActivity() {
    if (!activeActivityId) return;
    const updatedActivity = await activitiesAPI.complete(activeActivityId)
    const activity = activities.find(activity => activity.id === activeActivityId);
    if (!activity) throw new Error('Could not find activity to complete');
    activity.daysUntil = activity.interval;
    const activitiesTemp = activities.map((a) => a.id === activity.id ? { ...a, queued: false } : a);
    setActivities([...sortActivities(activitiesTemp)]);

    setActiveActivityId(null);
    setShowConfirmModal(false);
  }

  function handleNewActivityOverlayClose(activity?: IActivity) {
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
              className={`
                activity
                ${activity.queued ? 'activity--selected' : ''}
              `}
              style={{ '--delay': activity.daysUntil, '--interval': DAYS_IN_WEEK }}
              onClick={(event) => handleActivityClick(event, activity)}
              key={activity.id}
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
              {/* {activity.queued && ( */}
              {/*   <div className="activity__accept">+</div> */}
              {/* )} */}
            </div>
          ))
          }
        </div >
        <div className="floating_add_button" onClick={() => setShowNewActivityOverlay(true)}>&#43;</div>

        {showConfirmModal && (
          <Modal
            onFocusOut={handleFocusOut}
            title="How's it going?"
            style={{ 'text-align': 'center' }}
          >
            <div className="modal__buttons">
              <Button variant="outline" className="modal_button" onClick={removeFromQueue}>Deque</Button>
              <Button color="go" className="modal_button" onClick={completeActivity}>Complete</Button>
            </div>
          </Modal>
        )}
        {showNewActivityOverlay && (
          <NewActivityOverlay onClose={(activity) => handleNewActivityOverlayClose(activity)} />
        )}
      </div>
    </LayoutProtected>
  )
}
