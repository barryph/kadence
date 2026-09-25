import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';

import { ThemedText } from '@/components/base/themed-text';
import { Colors, Gradients, Spacing } from '@/constants/theme';
import SwipeRow from '@/components/swipe-row';
import type { IActivityClient } from '@/api/api.activity';
import ListItemShell from '@/components/list-item-shell';
import GoalProgressBar from '@/components/goals/goal-progress-bar';
import ProgressBadge from '../progress-badge';

const DAYS_IN_WEEK = 7;

interface IProps {
  activity: IActivityClient;
  testID?: string;
  onEdit: (activity: IActivityClient) => void;
  onComplete: (id: number) => void;
  onClick: (activity: IActivityClient) => void;
}

export default function ActivityListItem({
  activity,
  testID,
  onEdit,
  onComplete,
  onClick,
}: IProps) {
  const completedToday = !!activity.completedToday;
  const remainingPercent = Math.min(
    Math.max((activity.daysUntil || 0) / DAYS_IN_WEEK, 0),
    1,
  );
  const barFlex = completedToday ? 1 : 1 - remainingPercent;

  return (
    <ListItemShell
      style={{
        opacity: completedToday ? 0.72 : 1,
      }}
    >
      <Pressable
        testID={testID}
        accessibilityRole="button"
        // Edit and Complete are swipe-only gestures, which assistive tech
        // cannot perform. Expose them as accessibility actions on the row, so
        // screen-reader users have a non-gesture route to the same operations.
        accessibilityActions={[
          { name: 'edit', label: 'Edit activity' },
          ...(completedToday
            ? []
            : [{ name: 'complete', label: 'Complete activity' }]),
        ]}
        onAccessibilityAction={(event) => {
          switch (event.nativeEvent.actionName) {
            case 'edit':
              onEdit(activity);
              break;
            case 'complete':
              if (!completedToday) onComplete(activity.id);
              break;
          }
        }}
        onPress={() => {
          if (!completedToday) onClick(activity);
        }}
      >
        <SwipeRow
          onSwipeLeft={() => onEdit(activity)}
          onSwipeRight={() => onComplete(activity.id)}
          disableSwipeRight={completedToday}
          swipeLeftChild={
            <ThemedText variant="heading" style={{ color: Colors.textPrimary }}>
              <Feather name="edit-2" size={26} color={Colors.textPrimary} />
            </ThemedText>
          }
          swipeLeftColor="inherit"
          swipeRightChild={
            <ThemedText variant="heading">
              <Ionicons
                name="checkmark-done"
                size={29}
                color={Colors.textPrimary}
              />
            </ThemedText>
          }
          swipeRightColor={Colors.textPrimary}
          queued={activity.queued}
        >
          <View>
            <View style={[styles.activityMain]}>
              <View style={styles.activityTitleRow}>
                <View style={styles.activityNameGroup}>
                  <ThemedText variant="bodyStrong" lineHeight={32} size="xl">
                    {activity.name}
                  </ThemedText>
                </View>
                <View style={styles.activityDetails}>
                  {completedToday ? (
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
                    <ThemedText
                      variant="caption"
                      weight="500"
                      letterSpacing={-0.45}
                      style={styles.activityDetailsText}
                    >
                      In {activity.daysUntil} Days
                    </ThemedText>
                  )}
                </View>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  marginBottom: Spacing.sm,
                  alignItems: 'center',
                }}
              >
                {activity.category && (
                  <View
                    style={[
                      styles.categoryBadge,
                      {
                        borderColor: activity.category.color,
                        backgroundColor: `${activity.category.color}45`,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.categoryDot,
                        { backgroundColor: activity.category.color },
                      ]}
                    ></View>
                    <ThemedText
                      variant="caption"
                      weight="500"
                      lineHeight={22}
                      style={{ marginTop: -1 }}
                    >
                      {activity.category.name}
                    </ThemedText>
                  </View>
                )}

                <ThemedText
                  variant="caption"
                  weight="500"
                  letterSpacing={-0.45}
                  style={[styles.activityDetailsText, { marginTop: -1 }]}
                >
                  Every {activity.interval} Days
                </ThemedText>
              </View>

              <View style={styles.activityBarContainer}>
                {/* Notches overlay */}
                <View style={styles.activityBarNotches}>
                  {Array.from({ length: DAYS_IN_WEEK }, (_, day) => (
                    <View
                      key={`${activity.id}-notch-${day}`}
                      style={[
                        styles.activityBarNotch,
                        day < DAYS_IN_WEEK - 1 && styles.activityBarNotchBorder,
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
                  {completedToday ? (
                    <LinearGradient
                      colors={[...Gradients.goalMet]}
                      locations={[0, 0.4, 1]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={{ flex: barFlex }}
                    />
                  ) : activity.daysUntil === 0 ? (
                    <LinearGradient
                      colors={[...Gradients.overdue]}
                      locations={[0, 0.4, 0.9]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={{ flex: barFlex }}
                    />
                  ) : (
                    <LinearGradient
                      colors={[...Gradients.goalInProgress]}
                      locations={[0, 0.4, 1]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={{ flex: barFlex }}
                    />
                  )}
                </View>
              </View>

              {activity.goal && activity.goalProgress && (
                <View style={{ paddingTop: Spacing.sm }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}
                  >
                    <ThemedText variant="eyebrow">Weekly Goal</ThemedText>
                    <ThemedText variant="eyebrow">
                      {activity.goalProgress.currentWeekCount} of{' '}
                      {activity.goal.targetPerWeek}
                    </ThemedText>
                  </View>
                  <GoalProgressBar
                    count={activity.goalProgress.currentWeekCount}
                    target={activity.goal.targetPerWeek}
                    height={6}
                    trackColor={Colors.track}
                    colorsWhenMet={completedToday ? 'BLUEGREEN' : 'BLUE'}
                    style={styles.goalProgress}
                  />
                </View>
              )}
            </View>
          </View>
        </SwipeRow>
      </Pressable>
    </ListItemShell>
  );
}

const styles = StyleSheet.create({
  activityMain: {
    width: '100%',
    paddingTop: 11,
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  activityTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  activityNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    marginRight: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 0,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryDot: {
    height: 8,
    width: 8,
    borderRadius: 2,
  },
  activityDetails: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  activityDetailsText: {
    color: Colors.textSubtle,
  },
  activityDetailsSpan: {
    marginLeft: 3,
  },
  activityBarContainer: {
    // Horizontal margin is for angled dividers. Which doesn't work on android
    // marginHorizontal: 3,
    height: 8,
    backgroundColor: Colors.track,
    position: 'relative',
    overflow: 'hidden',
    transform: [{ skewX: '-24deg' }],
    marginTop: 3,
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
    borderRightWidth: 3,
    borderRightColor: Colors.divider,
  },
  goalProgress: {
    marginTop: Spacing.sm,
  },
  goalText: {
    textAlign: 'right',
    marginTop: 0,
  },
});
