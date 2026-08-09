import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import Background from '@/components/backgrounds/background';
import Container from '@/components/base/container';
import LoaderScreen from '@/components/base/loader-screen';
import ListItemShell from '@/components/list-item-shell';
import { ThemedText } from '@/components/base/themed-text';
import GoalProgressBar from '@/components/goals/goal-progress-bar';
import { useGoalsQuery } from '@/hooks/queries/use-goals';
import { formatGoalProgress, isGoalMet } from '@/lib/goals/goal-progress';
import { YYYYMMDD } from '@/utils/date';

export default function GoalsScreen() {
  const router = useRouter();
  const today = YYYYMMDD();
  const { data: goals = [], isPending, isError } = useGoalsQuery(today);

  if (isPending) {
    return <LoaderScreen text="Loading goals..." />;
  }

  if (isError) {
    return <LoaderScreen text="Unable to load goals." />;
  }

  return (
    <View style={styles.container}>
      <Background />

      <ScrollView>
        <Container style={styles.scrollContent}>
          <ThemedText style={styles.title} type="title" size="large">
            Goals
          </ThemedText>

          {goals.length === 0 ? (
            <ListItemShell style={styles.emptyShell}>
              <ThemedText size="small" style={styles.emptyText}>
                No goals yet. Set a weekly target when creating or editing an
                activity to start tracking your cadence.
              </ThemedText>
            </ListItemShell>
          ) : (
            <View style={styles.list}>
              {goals.map((goal) => {
                const met = isGoalMet(
                  goal.currentWeekCount,
                  goal.targetPerWeek,
                );
                return (
                  <ListItemShell key={goal.activityId}>
                    <Pressable
                      onPress={() => router.push(`/goals/${goal.activityId}`)}
                      style={styles.item}
                    >
                      <View style={styles.itemRow}>
                        <ThemedText
                          type="defaultBold"
                          style={styles.itemName}
                          numberOfLines={1}
                        >
                          {goal.activityName}
                        </ThemedText>
                        <View style={styles.itemRight}>
                          <ThemedText
                            size="small"
                            style={met ? styles.metText : undefined}
                          >
                            {formatGoalProgress(
                              goal.currentWeekCount,
                              goal.targetPerWeek,
                            )}
                          </ThemedText>
                          {met && (
                            <Ionicons
                              name="checkmark-circle"
                              size={18}
                              color="#52f2a8"
                            />
                          )}
                        </View>
                      </View>
                      <GoalProgressBar
                        count={goal.currentWeekCount}
                        target={goal.targetPerWeek}
                        height={10}
                        style={styles.progressBar}
                      />
                    </Pressable>
                  </ListItemShell>
                );
              })}
            </View>
          )}
        </Container>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 40,
  },
  title: {
    marginTop: 10,
    marginBottom: 2,
  },
  list: {
    gap: 8,
  },
  item: {
    paddingTop: 13,
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  itemName: {
    fontSize: 18,
    lineHeight: 28,
    flexShrink: 1,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metText: {
    color: '#52f2a8',
  },
  progressBar: {
    marginTop: 8,
  },
  emptyShell: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  emptyText: {
    opacity: 0.7,
    lineHeight: 20,
  },
});
