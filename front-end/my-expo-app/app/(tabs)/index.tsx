import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { activitiesAPI, type IActivity } from '@/api/api.activity';
import SwipeRow from '@/components/swipe-row';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import LoaderScreen from '@/components/loader-screen';
import NewActivityOverlay from '@/components/new-activity-overlay';
import UnmountOnBlur from '@/components/router/unmount-on-blur';
import Background from '@/components/backgrounds/background';
import ActivityBackground from '@/components/backgrounds/activity-background';

// TODO: Fix being able to drag complete on unqueued items, or actually, allow completin unqueued items
// TODO: Add edit activity page
// TODO: Add color categories

// Extend IActivity for client-side properties
interface IActivityClient extends IActivity {
  queued?: boolean;
}

function Dashboard() {
  const router = useRouter();
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
        const response = await activitiesAPI.getAllByUser({
          signal: abortController.signal,
        });
        if (response.data?.activities) {
          setActivities(
            sortActivities(response.data.activities as IActivityClient[]),
          );
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
      a.id === activity.id ? { ...a, queued: !a.queued } : a,
    );
    setActivities(sortActivities(updated));
  };

  const handleComplete = async (activityId: string) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const updateRes = await activitiesAPI.complete(activityId, today);
      if (updateRes.data?.activity) {
        const updated = activities.map((a) =>
          a.id === activityId
            ? (updateRes.data.activity as IActivityClient)
            : a,
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
    router.push(`/activities/edit/${activity.id}`);
  };

  function handleNewActivityOverlayClose(activity?: IActivityClient) {
    if (activity) {
      setActivities(sortActivities([...activities, activity]));
    }
    setShowNewActivityOverlay(false);
  }

  if (isLoading) {
    return <LoaderScreen text="Loading activities..." />;
  }

  return (
    <View style={styles.container}>
      <Background />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="defaultBold" style={styles.headline}>
          Activities In Motion
        </ThemedText>
        {activities.map((activity, index) => {
          const remainingPercent = Math.min(
            Math.max((activity.daysUntil || 0) / DAYS_IN_WEEK, 0),
            1,
          );

          return (
            <View style={[styles.activityWrapper]} key={activity.id}>
              <ActivityBackground />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleActivityClick(activity)}
              >
                <SwipeRow
                  onSwipeLeft={() => handleEdit(activity)}
                  onSwipeRight={() => handleComplete(activity.id)}
                  swipeLeftChild={
                    <Text style={{ fontSize: 24, color: '#000' }}>⚙️</Text>
                  }
                  swipeLeftColor="inherit"
                  swipeLeftBackground="#e9ecf6"
                  swipeRightChild={
                    <Text style={{ fontSize: 24, color: '#fff' }}>✓</Text>
                  }
                  swipeRightColor="#fff"
                  swipeRightBackground="#0072ff"
                  queued={activity.queued}
                >
                  <View
                    style={[
                      styles.activityInner,
                      activity.queued && styles.activityInnerSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.activityMain,
                        index === 0 && styles.activityMainFirst,
                      ]}
                    >
                      <View style={styles.activityTitleRow}>
                        <View style={styles.activityNameGroup}>
                          <ThemedText
                            type="defaultBold"
                            style={[
                              styles.activityName,
                              activity.queued && styles.activityNameSelected,
                            ]}
                          >
                            {activity.name}
                          </ThemedText>
                          {activity.category && (
                            <View
                              style={[
                                styles.categoryBadge,
                                {
                                  borderColor: activity.category.color,
                                  backgroundColor: `${activity.category.color}1A`,
                                },
                              ]}
                            >
                              <ThemedText
                                style={[
                                  styles.categoryText,
                                  { color: activity.category.color },
                                ]}
                              >
                                {activity.category.color}
                              </ThemedText>
                            </View>
                          )}
                        </View>
                        <View style={styles.activityDetails}>
                          <Text
                            style={[
                              styles.activityDetailsText,
                              activity.queued &&
                              styles.activityDetailsTextSelected,
                            ]}
                          >
                            REMAIN:{' '}
                            <Text
                              style={[
                                styles.activityDetailsSpan,
                                activity.queued &&
                                styles.activityDetailsSpanSelected,
                              ]}
                            >
                              {activity.daysUntil}
                            </Text>
                          </Text>
                          <Text
                            style={[
                              styles.activityDetailsText,
                              activity.queued &&
                              styles.activityDetailsTextSelected,
                            ]}
                          >
                            INTRVL:{' '}
                            <Text
                              style={[
                                styles.activityDetailsSpan,
                                activity.queued &&
                                styles.activityDetailsSpanSelected,
                              ]}
                            >
                              {activity.interval}
                            </Text>
                          </Text>
                        </View>
                      </View>

                      <View style={styles.activityBarContainer}>
                        {/* Notches overlay */}
                        <View style={styles.activityBarNotches}>
                          {Array.from({ length: DAYS_IN_WEEK }, (_, day) => (
                            <View
                              key={`${activity.id}-notch-${day}`}
                              style={[
                                styles.activityBarNotch,
                                day < DAYS_IN_WEEK - 1 &&
                                styles.activityBarNotchBorder,
                              ]}
                            />
                          ))}
                        </View>

                        {/* Progress gradient */}
                        <View
                          style={{
                            width: '100%',
                            height: '100%',
                            flexDirection: 'row',
                          }}
                        >
                          {/** This reverses the bars direction **/}
                          {/* <View style={{ flex: remainingPercent, backgroundColor: 'transparent' }} /> */}
                          {/** Setting flex to a decimal defines the length of the gradient bar **/}
                          {activity.queued ? (
                            <LinearGradient
                              colors={['#087cff', '#08d8ff', '#52f2a8']}
                              locations={[0, 0.62, 1]}
                              start={{ x: 0, y: 0.5 }}
                              end={{ x: 1, y: 0.5 }}
                              style={{ flex: 1 - remainingPercent }}
                            />
                          ) : activity.daysUntil === 0 ? (
                            <LinearGradient
                              colors={['#087cff', '#08d8ff', '#ff3d54']}
                              locations={[0, 0.5, 1]}
                              start={{ x: 0, y: 0.5 }}
                              end={{ x: 1, y: 0.5 }}
                              style={{ flex: 1 - remainingPercent }}
                            />
                          ) : (
                            <LinearGradient
                              colors={['#087cff', '#0096ff', '#08d8ff']}
                              locations={[0, 0.42, 1]}
                              start={{ x: 0, y: 0.5 }}
                              end={{ x: 1, y: 0.5 }}
                              style={{ flex: 1 - remainingPercent }}
                            />
                          )}
                          {/* <LinearGradient */}
                          {/*   colors={activity.queued ? ['#ffffff', '#ffffff'] : ['#0072ff', '#00c6ff']} */}
                          {/*   start={{ x: 0, y: 0 }} */}
                          {/*   end={{ x: 1, y: 0 }} */}
                          {/*   style={{ flex: 1 - remainingPercent }} */}
                          {/* /> */}
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
        <ThemedText style={styles.floatingAddButtonText}>
          Add Activity
        </ThemedText>
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
    //     backgroundColor: `
    //         radial-gradient(circle at 20% -10%, rgba(8,124,255,.28), transparent 34rem),
    //         radial-gradient(circle at 95% 12%, rgba(8,216,255,.16), transparent 26rem),
    //         radial-gradient(circle at 70% 100%, rgba(255,61,84,.12), transparent 28rem),
    //         linear-gradient(180deg,#050711 0%,#0b1020 46%,#050711 100%);
    // `,
    //     backgroundAttachment: 'fixed',
  },
  headline: {
    paddingHorizontal: 4,
    fontSize: 24,
    paddingTop: 10,
    paddingBottom: 5,
    color: '#fff',
    // textTransform: 'uppercase',
    // letterSpacing: '.08em',
    letterSpacing: -0.01,
    fontFamily: 'system-ui',
    fontWeight: 700,
  },
  scrollContent: {
    paddingBottom: 100,
    display: 'flex',
    gap: 8,
    paddingTop: 14,
    paddingRight: 12,
    paddingLeft: 12,
    // paddingBottom: 18,
  },
  activityWrapper: {
    width: '100%',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255,255,255,.1)',
    borderRadius: 22,
    overflow: 'hidden',
  },
  activityInner: {
    // backgroundColor: '#fff',
  },
  activityInnerSelected: {
    // backgroundColor: '#0072ff', // Simplification of gradient
  },
  activityMainFirst: {
    marginTop: 3,
  },
  activityMain: {
    width: '100%',
    paddingTop: 12,
    paddingHorizontal: 13,
    paddingBottom: 4,
    // borderBottomWidth: 3,
    // borderBottomColor: 'rgba(211, 216, 255, 0.4)',
    boxShadow: '0 14px 35px rgba(0,0,0,.22)',
    // TODO: Fix boxShadow doesn't work
  },
  activityTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // marginBottom: 4,
  },
  activityNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityName: {
    fontSize: 16,
    color: '#fff',
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
    flexDirection: 'row',
    gap: 8,
  },
  activityDetailsText: {
    fontSize: 12,
    // fontSize: '.78rem',
    color: '#8f98aa',
    // letterSpacing: '-.045em',
    letterSpacing: -0.45,
    fontWeight: 500,
  },
  activityDetailsSpan: {
    // fontSize: 14,
    fontWeight: 700,
    color: '#fff',
  },
  activityDetailsTextSelected: {
    color: '#eee',
  },
  activityDetailsSpanSelected: {
    color: '#fff',
  },
  activityBarContainer: {
    marginHorizontal: 3,
    height: 18,
    // backgroundColor: '#d6daea',
    backgroundColor: '#4b4b5c',
    position: 'relative',
    overflow: 'hidden',
    transform: [{ skewX: '-24deg' }],
    marginTop: 6,
    marginBottom: 13,
    borderRadius: 4,
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
    borderRightColor: '#00000088',
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
    boxShadow: '0 18px 38px rgba(0,90,255,.42), 0 8px 18px rgba(0,0,0,.36)',
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
  );
}
