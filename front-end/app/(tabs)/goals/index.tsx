import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import Background from '@/components/backgrounds/background';
import Container from '@/components/base/container';
import LoaderScreen from '@/components/base/loader-screen';
import ErrorScreen from '@/components/base/error-screen';
import ListItemShell from '@/components/list-item-shell';
import { ThemedText } from '@/components/base/themed-text';
import GoalProgressBar from '@/components/goals/goal-progress-bar';
import { Colors, Spacing } from '@/constants/theme';
import { useGoalsQuery } from '@/hooks/queries/use-goals';
import { useStaleRefetchOnFocus } from '@/hooks/queries/use-stale-refetch-on-focus';
import { queryKeys } from '@/lib/query/keys';
import { formatGoalProgress, isGoalMet } from '@/lib/goals/goal-progress';
import { useToday } from '@/hooks/use-today';
import ProgressBadge from '@/components/progress-badge';

/**
 * Stable fallback for a query with no data yet, so the array identity does
 * not change on every render and invalidate downstream memoisation.
 */
const EMPTY_LIST: never[] = [];

export default function GoalsScreen() {
  const router = useRouter();
  const today = useToday();
  const {
    data: goalsData,
    isPending,
    isError,
    refetch: refetchGoals,
  } = useGoalsQuery(today);
  const goals = goalsData ?? EMPTY_LIST;

  // Refresh silently when returning to the tab with stale data, e.g. after an
  // activity was completed on another screen. Fresh data is not refetched.
  useStaleRefetchOnFocus(queryKeys.goals.all(today));

  if (isPending) {
    return <LoaderScreen text="Loading goals..." />;
  }

  // Keep the goals already on screen when a silent focus refetch fails; only a
  // failure with nothing cached is terminal.
  if (isError && !goalsData) {
    return (
      <ErrorScreen
        message="Unable to load goals."
        onRetry={() => void refetchGoals()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Background />

      <ScrollView>
        <Container style={styles.scrollContent}>
          <View>
            <ThemedText style={styles.title} variant="heading" font="system">
              Monitor Your Frequency
            </ThemedText>
          </View>

          {goals.length === 0 ? (
            <ListItemShell style={styles.emptyShell}>
              <ThemedText variant="bodySmall" style={styles.emptyText}>
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
                          variant="bodyBold"
                          size="xl"
                          lineHeight={28}
                          style={styles.itemName}
                          numberOfLines={1}
                        >
                          {goal.activityName}
                        </ThemedText>

                        <View style={styles.itemRight}>
                          {goal.currentWeekCount >= goal.targetPerWeek ? (
                            <ProgressBadge
                              color={Colors.success}
                              icon={
                                <Ionicons
                                  name="checkmark-circle"
                                  size={14}
                                  color={Colors.success}
                                />
                              }
                            >
                              DONE
                            </ProgressBadge>
                          ) : (
                            <ProgressBadge
                              color={Colors.warning}
                              icon={
                                <MaterialCommunityIcons
                                  name="progress-clock"
                                  size={14}
                                  color={Colors.warning}
                                />
                              }
                            >
                              IN PROGRESS
                            </ProgressBadge>
                          )}
                        </View>
                      </View>
                      <View style={styles.bottomRow}>
                        <ThemedText variant="caption">
                          See Stats &rarr;
                        </ThemedText>
                        <ThemedText
                          variant="bodySmall"
                          style={
                            met ? styles.metText : { color: Colors.warning }
                          }
                        >
                          {formatGoalProgress(
                            goal.currentWeekCount,
                            goal.targetPerWeek,
                          )}
                        </ThemedText>
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
    gap: Spacing['4xl'],
    paddingBottom: Spacing['6xl'],
  },
  title: {
    marginTop: Spacing['2xl'],
  },
  subTitle: {
    marginTop: Spacing.md,
  },
  list: {
    gap: Spacing.xl,
  },
  item: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['2xl'],
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  itemName: {
    flexShrink: 1,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['2xl'],
  },
  metText: {
    color: Colors.success,
  },
  progressBar: {
    marginTop: Spacing.sm,
  },
  emptyShell: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: 18,
  },
  emptyText: {
    opacity: 0.7,
  },
  bottomRow: {
    marginTop: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
