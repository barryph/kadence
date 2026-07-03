import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { activitiesAPI, type IActivity } from '@/api/api.activity';
import SwipeRow from '@/components/SwipeRow';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import LoaderScreen from '@/components/LoaderScreen';
import NewActivityOverlay from '@/components/NewActivityOverlay';
import UnmountOnBlur from '@/components/router/UnmountOnBlur';

// Extend IActivity for client-side properties
interface IActivityClient extends IActivity {
  category?: string;
  categoryColor?: string;
  queued?: boolean;
}

function Dashboard() {
  const DAYS_IN_WEEK = 7;
  const [activities, setActivities] = useState<IActivityClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewActivityOverlay, setShowNewActivityOverlay] = useState(false);

  const sortActivities = (acts: IActivityClient[] = []) => {
    return [...acts].sort((a, b) => {
      if ((a.queued && b.queued) || (!a.queued && !b.queued)) {
        return (a.daysUntil || 0) - (b.daysUntil || 0);
      }
      if (a.queued) return -1;
      if (b.queued) return 1;
      return 0;
    });
  };

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchActivities() {
      try {
        const response = await activitiesAPI.getAllByUser({ signal: abortController.signal });
        if (response.data?.activities) {
          setActivities(sortActivities(response.data.activities as IActivityClient[]));
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching activities', err);
        setIsLoading(false);
      }
    }

    fetchActivities();
    return () => abortController.abort();
  }, []);

  const handleActivityClick = (activity: IActivityClient) => {
    const updated = activities.map((a) =>
      a.id === activity.id ? { ...a, queued: !a.queued } : a
    );
    setActivities(sortActivities(updated));
  };

  const handleComplete = async (activityId: string) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const updateRes = await activitiesAPI.complete(activityId, today);
      if (updateRes.data?.activity) {
        const updated = activities.map((a) =>
          a.id === activityId ? (updateRes.data.activity as IActivityClient) : a
        );
        setActivities(sortActivities(updated));
      }
    } catch (error) {
      console.error('Error completing activity', error);
    }
  };

  const handleEdit = (activity: IActivityClient) => {
    // In Expo router, we might route to an edit screen
    // For now we'll just log or route to a dummy path
    console.log('handling edit trigger');
    // router.push(`/activity/edit/${activity.id}`);
  };

  function handleNewActivityOverlayClose(activity?: IActivityClient) {
    if (activity) {
      setActivities(sortActivities([...activities, activity]));
    }
    setShowNewActivityOverlay(false);
  }

  if (isLoading) {
    return (
      <LoaderScreen text="Loading activities..." />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activities.map((activity, index) => {
          const delayPct = Math.min(Math.max((activity.daysUntil || 0) / DAYS_IN_WEEK, 0), 1);

          return (
            <View style={[styles.activityWrapper]} key={activity.id}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleActivityClick(activity)}
              >
                <SwipeRow
                  onSwipeLeft={() => handleEdit(activity)}
                  onSwipeRight={() => handleComplete(activity.id)}
                  swipeLeftChild={<Text style={{ fontSize: 24, color: '#000' }}>⚙️</Text>}
                  swipeLeftColor="inherit"
                  swipeLeftBackground="#e9ecf6"
                  swipeRightChild={<Text style={{ fontSize: 24, color: '#fff' }}>✓</Text>}
                  swipeRightColor="#fff"
                  swipeRightBackground="#0072ff"
                  queued={activity.queued}
                >
                  <View style={[styles.activityInner, activity.queued && styles.activityInnerSelected]}>
                    <View style={[styles.activityMain, index === 0 && styles.activityMainFirst]}>
                      <View style={styles.activityTitleRow}>
                        <View style={styles.activityNameGroup}>
                          <ThemedText style={[styles.activityName, activity.queued && styles.activityNameSelected]}>
                            {activity.name}
                          </ThemedText>
                          {activity.category && (
                            <View style={[styles.categoryBadge, { borderColor: activity.categoryColor, backgroundColor: `${activity.categoryColor}1A` }]}>
                              <ThemedText style={[styles.categoryText, { color: activity.categoryColor }]}>
                                {activity.category}
                              </ThemedText>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.activityDetails, activity.queued && styles.activityDetailsSelected]}>
                          ↩ {activity.daysUntil}  ↻ {activity.interval}
                        </Text>
                      </View>

                      <View style={styles.activityBarContainer}>
                        {/* Notches overlay */}
                        <View style={styles.activityBarNotches}>
                          {Array.from({ length: DAYS_IN_WEEK }, (_, day) => (
                            <View
                              key={`${activity.id}-notch-${day}`}
                              style={[
                                styles.activityBarNotch,
                                day < DAYS_IN_WEEK - 1 && styles.activityBarNotchBorder
                              ]}
                            />
                          ))}
                        </View>

                        {/* Progress gradient */}
                        <View style={{ width: '100%', height: '100%', flexDirection: 'row' }}>
                          <View style={{ flex: delayPct, backgroundColor: 'transparent' }} />
                          <LinearGradient
                            colors={activity.queued ? ['#ffffff', '#ffffff'] : ['#0072ff', '#00c6ff']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ flex: 1 - delayPct }}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                </SwipeRow>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={styles.floatingAddButton}
        onPress={() => setShowNewActivityOverlay(true)}
      >
        <ThemedText style={styles.floatingAddButtonText}>Add Activity</ThemedText>
      </TouchableOpacity>

      {showNewActivityOverlay && (
        <NewActivityOverlay onClose={handleNewActivityOverlayClose} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  activityWrapper: {
    width: '100%',
  },
  activityInner: {
    backgroundColor: '#fff',
  },
  activityInnerSelected: {
    backgroundColor: '#0072ff', // Simplification of gradient
  },
  activityMainFirst: {
    marginTop: 3,
  },
  activityMain: {
    width: '100%',
    paddingTop: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(211, 216, 255, 0.4)',
  },
  activityTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '400',
  },
  activityNameSelected: {
    color: '#fff',
  },
  categoryBadge: {
    marginLeft: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activityDetails: {
    fontSize: 14,
    opacity: 0.7,
    color: '#333',
  },
  activityDetailsSelected: {
    color: '#fff',
  },
  activityBarContainer: {
    height: 12,
    backgroundColor: '#d6daea',
    position: 'relative',
    overflow: 'hidden',
    transform: [{ skewX: '-24deg' }],
  },
  activityBarNotches: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 2,
  },
  activityBarNotch: {
    flex: 1,
    height: '100%',
  },
  activityBarNotchBorder: {
    borderRightWidth: 2,
    borderRightColor: '#fff',
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    height: 48,
    paddingHorizontal: 20,
    backgroundColor: '#0072ff',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  floatingAddButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function wrapper() {
  return (
    <UnmountOnBlur>
      <Dashboard />
    </UnmountOnBlur>
  )
}
