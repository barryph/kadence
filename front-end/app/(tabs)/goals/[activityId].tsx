import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import Background from '@/components/backgrounds/background';
import LoaderScreen from '@/components/base/loader-screen';
import ListItemShell from '@/components/list-item-shell';
import { ThemedText } from '@/components/base/themed-text';
import GoalProgressBar from '@/components/goals/goal-progress-bar';
import GoalAreaChart from '@/components/goals/goal-area-chart';
import GoalAdherenceRing from '@/components/goals/goal-adherence-ring';
import GoalHeatmap from '@/components/goals/goal-heatmap';
import { useGoalStatsQuery } from '@/hooks/queries/use-goals';
import { formatGoalProgress } from '@/lib/goals/goal-progress';
import { YYYYMMDD } from '@/utils/date';

function isString(val: unknown): val is string {
  return typeof val === 'string';
}

export default function GoalInsightsScreen() {
  const { activityId } = useLocalSearchParams();
  const router = useRouter();
  const today = YYYYMMDD();
  const {
    data: stats,
    isPending,
    isError,
  } = useGoalStatsQuery(isString(activityId) ? activityId : undefined, today);

  if (isPending) {
    return <LoaderScreen text="Loading goal insights..." />;
  }

  if (isError) {
    return <LoaderScreen text="Unable to load goal insights." />;
  }

  if (!stats) {
    return <LoaderScreen text="Goal not found." />;
  }

  return (
    <View style={styles.container}>
      <Background showRed={false} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={27} color="white" />
          </Pressable>
          <ThemedText type="title" size="large">
            Goal Insights
          </ThemedText>
        </View>

        <ThemedText type="defaultBold" size="large" style={styles.activityName}>
          {stats.activityName}
        </ThemedText>
        <ThemedText size="small" style={styles.targetText}>
          {stats.goal.targetPerWeek}x per week
        </ThemedText>

        <ListItemShell style={styles.section}>
          <ThemedText style={styles.sectionLabel} type="defaultSemiBold">
            This week
          </ThemedText>
          <ThemedText size="small" style={styles.progressText}>
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
          <ThemedText style={styles.sectionLabel} type="defaultSemiBold">
            Performance
          </ThemedText>
          <ThemedText size="small" style={styles.sectionHint}>
            Over the last 8 weeks
          </ThemedText>
          <GoalAreaChart
            data={stats.weeklyPerformance}
            targetPerWeek={stats.goal.targetPerWeek}
          />
        </ListItemShell>

        <ListItemShell style={[styles.section, styles.ringSection]}>
          <GoalAdherenceRing
            adherence={stats.adherence}
            periodLabel="last 8 weeks"
          />
        </ListItemShell>

        <ListItemShell style={styles.section}>
          <ThemedText style={styles.sectionLabel} type="defaultSemiBold">
            Cadence
          </ThemedText>
          <ThemedText size="small" style={styles.sectionHint}>
            Over the last 6 months
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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 12,
  },
  topRow: {
    marginTop: 20,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityName: {
    fontSize: 28,
    lineHeight: 34,
  },
  targetText: {
    opacity: 0.65,
    marginBottom: 6,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 4,
  },
  ringSection: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 13,
    opacity: 0.6,
  },
  sectionHint: {
    opacity: 0.65,
    marginBottom: 8,
  },
  progressText: {
    opacity: 0.9,
  },
  progressBar: {
    marginTop: 8,
  },
});
