import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { activitiesAPI, IActivityClient } from '@/api/api.activity';

import { ThemedText } from '@/components/base/themed-text';
import LoaderScreen from '@/components/base/loader-screen';
import CreateActivityModal from '@/components/activities/create-activity-modal';
import UnmountOnBlur from '@/components/router/unmount-on-blur';
import Background from '@/components/backgrounds/background';
import { categoriesAPI, ICategory } from '@/api/api.categories';
import ActivityListItem from '@/components/activity-list/activity-list-item';
import { Colors } from '@/constants/theme';

// TODO: Add toast when task completed, with undo button
// TODO: Fix being able to drag complete on unqueued items, or actually, allow completin unqueued items

function Dashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<IActivityClient[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [showNewActivityModal, setShowNewActivityModal] = useState(false);

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

    async function fetchData() {
      try {
        const [activitiesResponse, categoriesResponse] = await Promise.all([
          activitiesAPI.getAllByUser({
            signal: abortController.signal,
          }),
          categoriesAPI.getAllByUser({
            signal: abortController.signal,
          }),
        ]);

        if (activitiesResponse.data?.activities) {
          const activities = activitiesResponse.data.activities;
          setActivities(sortActivities(activities as IActivityClient[]));
        }

        if (categoriesResponse.data?.categories) {
          setCategories(categoriesResponse.data.categories as ICategory[]);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          console.error('Error fetching data', err);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
    return () => abortController.abort();
  }, []);

  async function handleActivityClick(activity: IActivityClient) {
    const updated = activities.map((a) =>
      a.id === activity.id ? { ...a, queued: !a.queued } : a,
    );
    setActivities(sortActivities(updated));
  }

  async function handleComplete(activityId: number) {
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
  }

  function handleEdit(activity: IActivityClient) {
    // In Expo router, we might route to an edit screen
    // For now we'll just log or route to a dummy path
    router.push(`/activities/edit/${activity.id}`);
  }

  function handleNewActivityModalClose(activity?: IActivityClient) {
    if (activity) {
      setActivities(sortActivities([...activities, activity]));
    }
    setShowNewActivityModal(false);
  }

  function handleCategoryPress(categoryId: number) {
    setActiveCategoryId((current) =>
      current === categoryId ? null : categoryId,
    );
  }

  const filteredActivities =
    activeCategoryId === null
      ? activities
      : activities.filter(
        (activity) => activity.categoryId === activeCategoryId,
      );

  if (isLoading) {
    return <LoaderScreen text="Loading activities..." />;
  }

  return (
    <View style={styles.container}>
      <Background />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <ThemedText
            type="defaultBold"
            style={[
              styles.headline,
              !(categories.length > 0) && styles.headlineNoCategories,
            ]}
          >
            Activities In Motion
          </ThemedText>
          {/* <Pressable> */}
          {/*   <FontAwesome6 name="gear" size={24} color="white" /> */}
          {/* </Pressable> */}
        </View>
        {categories.length > 0 && (
          <View style={styles.categoriesContainer}>
            <ThemedText
              style={[
                styles.categoriesTitle,
                !(categories.length > 0) && styles.headlineNoCategories,
              ]}
              type="defaultSemiBold"
            >
              Category
            </ThemedText>
            <View style={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
              {categories.map((category) => {
                const isActive = activeCategoryId === category.id;
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => handleCategoryPress(category.id!)}
                  >
                    <ThemedText
                      size="small"
                      type="defaultSemiBold"
                      style={[
                        styles.categoryPill,
                        isActive && {
                          borderWidth: 1.5,
                          borderColor: `${category.color}88`,
                          backgroundColor: `${category.color}1A`,
                          color: category.color,
                        },
                      ]}
                    >
                      {category.name}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
        {/* <ThemedView style={styles.statsBar}> */}
        {/*   <ThemedView></ThemedView> */}
        {/*   <ThemedView> */}
        {/**/}
        {/*   </ThemedView> */}
        {/* </ThemedView> */}
        {filteredActivities.map((activity, index) => (
          <ActivityListItem
            key={activity.id}
            index={index}
            activity={activity}
            onClick={handleActivityClick}
            onEdit={handleEdit}
            onComplete={handleComplete}
          />
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.floatingAddButton}
        onPress={() => setShowNewActivityModal(true)}
      >
        <ThemedText style={styles.floatingAddButtonText}>
          Add Activity
        </ThemedText>
      </TouchableOpacity>

      {showNewActivityModal && (
        <CreateActivityModal onClose={handleNewActivityModalClose} />
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
    // paddingHorizontal: 4,
    fontSize: 24,
    paddingTop: 10,
    paddingBottom: 5,
    color: '#fff',
    // textTransform: 'uppercase',
    // letterSpacing: '.08em',
    letterSpacing: -0.01,
    fontFamily: '"system-ui"',
    fontWeight: 700,
  },
  headlineNoCategories: {
    marginBottom: 3,
  },
  categoriesContainer: {
    marginBottom: 3,
  },
  categoriesTitle: {
    opacity: 0.6,
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 13,
  },
  categoryPill: {
    backgroundColor: 'rgba(255,255,255,.055)',
    color: '#f5f7fbcc',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.1)',
    paddingHorizontal: 14,
    paddingVertical: 3,
    borderRadius: 16,
    fontSize: 13,
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
  floatingAddButton: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    height: 48,
    paddingHorizontal: 20,
    backgroundColor: Colors.blue.new,
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
