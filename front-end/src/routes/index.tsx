import { createFileRoute } from '@tanstack/react-router'
import './index.css';
import { useState } from 'react';
import Modal from '../components/Modal';
import Button from '../components/Button';
import NewActivityOverlay from '../components/NewActivityOverlay';

export const Route = createFileRoute('/')({
  component: Index,
})

// TODO: Add grid with number of days

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

function Index() {
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showNewActivityOverlay, setShowNewActivityOverlay] = useState(false);

  function sortActivities(activities: IActivity[] = []) {
    console.log('updateact');
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

  const [activities, setActivities] = useState<IActivity[]>(() => {
    return sortActivities([
      {
        id: '1',
        name: 'Sprint',
        interval: 2,
        daysUntil: 0,
        category: 'Sprints',
        categoryColor: 'green',
        queued: false,
      },
      {
        id: '2',
        name: 'Max Jumps',
        interval: 4,
        daysUntil: 2,
        category: 'Jumping',
        categoryColor: 'red',
        queued: true,
      },
      {
        id: '3',
        name: 'Pogos',
        interval: 4,
        daysUntil: 3,
        category: 'Jumping',
        categoryColor: 'red',
        queued: false,
      },
      {
        id: '4',
        name: 'Power Cleans',
        interval: 4,
        daysUntil: 4,
        category: 'Lifting',
        categoryColor: 'blue',
        queued: false,
      },
      {
        id: '5',
        name: 'Power Cleans',
        interval: 4,
        daysUntil: 6,
        category: 'Lifting',
        categoryColor: 'blue',
        queued: false,
      },
    ])
  });

  function handleActivityClick(activity: IActivity) {
    if (activity.queued) {
      setActiveActivityId(activity.id);
      setShowConfirmModal(true);
    } else {
      activity.queued = true;
      console.log('handclick');
      setActivities([...sortActivities(activities)]);
    }
  }

  function handleFocusOut() {
    setActiveActivityId(null);
    setShowConfirmModal(false);
  }
  function removeFromQueue() {
    const activity = activities.find(activity => activity.id === activeActivityId);
    if (!activity) throw new Error('Could not find activity to remove from queue');
    activity.queued = false;
    setActivities([...sortActivities(activities)]);

    setActiveActivityId(null);
    setShowConfirmModal(false);
  }
  function completeActivity() {
    const activity = activities.find(activity => activity.id === activeActivityId);
    if (!activity) throw new Error('Could not find activity to complete');
    activity.daysUntil = activity.interval;
    activity.queued = false;
    setActivities([...sortActivities(activities)]);

    setActiveActivityId(null);
    setShowConfirmModal(false);
  }

  return (
    <div className="container">
      <div className="">
        {activities.map((activity) => (
          <div
            className={`
              activity
              ${activity.queued ? 'activity--selected' : ''}
            `}
            style={{ '--delay': activity.daysUntil }}
            onClick={() => handleActivityClick(activity)}
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
        <NewActivityOverlay onClose={() => setShowNewActivityOverlay(false)} />
      )}
    </div >
  )
}
