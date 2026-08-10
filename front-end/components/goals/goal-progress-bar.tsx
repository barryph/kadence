import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { clampGoalProgress } from '@/lib/goals/goal-progress';

const MET_GRADIENT = ['#087cff', '#08d8ff', '#52f2a8'] as const;
const IN_PROGRESS_GRADIENT = ['#087cff', '#0096ff', '#08d8ff'] as const;

interface GoalProgressBarProps {
  count: number;
  target: number;
  height?: number;
  trackColor?: string;
  style?: ViewStyle;
}

export default function GoalProgressBar({
  count,
  target,
  height = 8,
  trackColor = 'rgba(255,255,255,0.12)',
  style,
}: GoalProgressBarProps) {
  const progress = clampGoalProgress(count, target);
  const met = count >= target;

  return (
    <View
      accessibilityLabel={`Goal progress ${count} of ${target}`}
      style={[styles.track, { height, backgroundColor: trackColor }, style]}
    >
      {progress > 0 && (
        <LinearGradient
          colors={met ? [...MET_GRADIENT] : [...IN_PROGRESS_GRADIENT]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.fill, { width: `${progress * 100}%` }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
