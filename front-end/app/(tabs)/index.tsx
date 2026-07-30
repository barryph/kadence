import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
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
import ListItemShell from '@/components/list-item-shell';
import Dot from '@/components/dot';
import Toast from 'react-native-toast-message';
import Container from '@/components/base/container';
import FilterList from '@/components/filter-list/filter-list';
import { YYYYMMDD } from '@/utils/date';
import {
  filterByCategoryId,
  toggleCategoryFilter,
} from '@/components/filter-list/filter-by-category';

// TODO: Add toast when task completed, with undo button

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
        const daysUntilSort = (a.daysUntil || 0) - (b.daysUntil || 0);
        if (daysUntilSort !== 0) return daysUntilSort;
        const nameSort = a.name.localeCompare(b.name);
        return nameSort;
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
    const today = YYYYMMDD();
    try {
      const updateRes = await activitiesAPI.complete(activityId, today);
      if (updateRes.data?.activity) {
        const updated = activities.map((a) =>
          a.id === activityId
            ? (updateRes.data.activity as IActivityClient)
            : a,
        );
        setActivities(sortActivities(updated));
        Toast.show({
          type: 'success',
          text1: 'Activity Completed',
        });
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

  function handleCreatedCategory(category: ICategory) {
    setCategories((prev) => [...prev, category]);
  }

  function handleNewActivityModalClose(activity?: IActivityClient) {
    if (activity) {
      setActivities(sortActivities([...activities, activity]));
    }
    setShowNewActivityModal(false);
  }

  function handleCategoryPress(categoryId: number) {
    setActiveCategoryId((current) => toggleCategoryFilter(current, categoryId));
  }

  const filteredActivities = filterByCategoryId(activities, activeCategoryId);

  if (isLoading) {
    return <LoaderScreen text="Loading activities..." />;
  }

  return (
    <View style={styles.container}>
      <Background />

      <ScrollView>
        <Container style={styles.scrollContent}>
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
          </View>
          <FilterList
            label="Categories"
            categories={categories}
            activeCategoryId={activeCategoryId}
            onCategoryPress={handleCategoryPress}
          />
          <View
            style={{
              marginTop: 6,
              display: 'flex',
              gap: 8,
            }}
          >
            {activities.length === 0 && (
              <ListItemShell style={styles.getStartedPill}>
                <View
                  style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}
                >
                  <Dot />
                  <ThemedText type="defaultBold">
                    Add your first activity
                  </ThemedText>
                </View>
                <ThemedText size="extraSmall">
                  Get started by adding your first activity!
                </ThemedText>
              </ListItemShell>
            )}
            {filteredActivities.map((activity, index) => (
              <ActivityListItem
                key={activity.id}
                activity={activity}
                onClick={handleActivityClick}
                onEdit={handleEdit}
                onComplete={handleComplete}
              />
            ))}
          </View>
        </Container>
      </ScrollView>

      <Pressable
        style={styles.floatingAddButton}
        onPress={() => setShowNewActivityModal(true)}
      >
        <ThemedText style={styles.floatingAddButtonText}>
          Add Activity
        </ThemedText>
      </Pressable>

      {showNewActivityModal && (
        <CreateActivityModal
          onClose={handleNewActivityModalClose}
          onCreatedCategory={handleCreatedCategory}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    display: 'flex',
    gap: 8,
    paddingBottom: 100,
  },
  headline: {
    // paddingHorizontal: 4,
    fontSize: 24,
    marginTop: 10,
    marginBottom: 5,
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
  getStartedPill: {
    paddingTop: 14,
    paddingHorizontal: 15,
    paddingBottom: 12,
    gap: 2,
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
