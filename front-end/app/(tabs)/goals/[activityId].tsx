import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import Background from '@/components/backgrounds/background';
import LoaderScreen from '@/components/base/loader-screen';
import ErrorScreen from '@/components/base/error-screen';
import ListItemShell from '@/components/list-item-shell';
import { ThemedText } from '@/components/base/themed-text';
import GoalProgressBar from '@/components/goals/goal-progress-bar';
import GoalAreaChart from '@/components/goals/goal-area-chart';
import GoalAdherenceRing from '@/components/goals/goal-adherence-ring';
import GoalHeatmap from '@/components/goals/goal-heatmap';
import { Colors, Spacing } from '@/constants/theme';
import { useGoalStatsQuery } from '@/hooks/queries/use-goals';
import { useStaleRefetchOnFocus } from '@/hooks/queries/use-stale-refetch-on-focus';
import { queryKeys } from '@/lib/query/keys';
import { formatGoalProgress } from '@/lib/goals/goal-progress';
import { useToday } from '@/hooks/use-today';
import { goBackOrHome } from '@/lib/navigation/back';

function isString(val: unknown): val is string {
  return typeof val === 'string';
}

export default function GoalInsightsScreen() {
  const { activityId } = useLocalSearchParams();
  const router = useRouter();
  const today = useToday();
  const {
    data: stats,
    isPending,
    isError,
    refetch: refetchStats,
  } = useGoalStatsQuery(isString(activityId) ? activityId : undefined, today);

  // Refresh silently when returning to this screen with stale stats, e.g.
  // after an activity was completed on another screen. Fresh data is kept.
  useStaleRefetchOnFocus(
    queryKeys.goals.detail(isString(activityId) ? activityId : '', today),
  );

  if (isPending) {
    return <LoaderScreen text="Loading goal insights..." />;
  }

  if (isError) {
    return (
      <ErrorScreen
        message="Unable to load goal insights."
        onRetry={() => void refetchStats()}
      />
    );
  }

  if (!stats) {
    return <LoaderScreen text="Goal not found." />;
  }

  const NUMBER_OF_WEEKS_REPORTED = stats.weeklyPerformance?.length || 0;

  return (
    <View style={styles.container}>
      <Background showRed={false} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topRow}>
          <Pressable onPress={() => goBackOrHome(router)} hitSlop={8}>
            <Ionicons name="arrow-back" size={27} color={Colors.textPrimary} />
          </Pressable>
          <ThemedText variant="bodyBold">Goal Insights</ThemedText>
        </View>

        <ThemedText variant="display" weight="600" style={styles.activityName}>
          {stats.activityName}
        </ThemedText>

        <ListItemShell style={styles.section}>
          <ThemedText style={styles.sectionLabel} variant="eyebrow">
            This week
          </ThemedText>
          <ThemedText variant="bodySmall" style={styles.progressText}>
            {formatGoalProgress(
              stats.currentWeekCount,
              stats.goal.targetPerWeek,
            )}
          </ThemedText>
          <GoalProgressBar
            count={stats.currentWeekCount}
            target={stats.goal.targetPerWeek}
            height={10}
            style={styles.progressBar}
          />
        </ListItemShell>

        <ListItemShell style={styles.section}>
          <ThemedText style={styles.sectionLabel} variant="eyebrow">
            Performance
          </ThemedText>
          <ThemedText variant="bodySmall" style={styles.sectionHint}>
            Over the last{' '}
            {NUMBER_OF_WEEKS_REPORTED !== 1
              ? NUMBER_OF_WEEKS_REPORTED + ' weeks'
              : 'week'}
          </ThemedText>
          <GoalAreaChart
            data={stats.weeklyPerformance}
            targetPerWeek={stats.goal.targetPerWeek}
          />
        </ListItemShell>

        <ListItemShell style={[styles.section, styles.ringSection]}>
          <GoalAdherenceRing
            adherence={stats.adherence}
            periodLabel={`last ${NUMBER_OF_WEEKS_REPORTED !== 1 ? NUMBER_OF_WEEKS_REPORTED + ' weeks' : 'week'}`}
          />
        </ListItemShell>

        <ListItemShell style={styles.section}>
          <ThemedText style={styles.sectionLabel} variant="eyebrow">
            Cadence
          </ThemedText>
          <ThemedText variant="bodySmall" style={styles.sectionHint}>
            Over the last{' '}
            {stats.heatmap.length !== 1
              ? `${stats.heatmap.length} weeks`
              : 'week'}
          </ThemedText>
          <GoalHeatmap
            data={stats.heatmap}
            targetPerWeek={stats.goal.targetPerWeek}
          />
        </ListItemShell>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: 14,
    paddingBottom: Spacing['6xl'],
    gap: Spacing.xl,
  },
  topRow: {
    marginTop: Spacing.lg,
    marginBottom: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  activityName: {
    marginBottom: Spacing.md,
  },
  targetText: {
    opacity: 0.65,
    marginBottom: Spacing.sm,
  },
  section: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: 14,
    paddingBottom: Spacing['2xl'],
    gap: Spacing.xs,
  },
  ringSection: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  sectionLabel: {
    opacity: 0.6,
  },
  sectionHint: {
    opacity: 0.65,
    marginBottom: Spacing.md,
  },
  progressText: {
    opacity: 0.9,
  },
  progressBar: {
    marginTop: Spacing.md,
  },
});
