import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

import { ThemedText } from '@/components/base/themed-text';
import { Colors, Gradients } from '@/constants/theme';
import SwipeRow from '@/components/swipe-row';
import type { IActivityClient } from '@/api/api.activity';
import ListItemShell from '@/components/list-item-shell';
import GoalProgressBar from '@/components/goals/goal-progress-bar';
import ProgressBadge from '../progress-badge';

const DAYS_IN_WEEK = 7;

interface IProps {
  activity: IActivityClient;
  onEdit: (activity: IActivityClient) => void;
  onComplete: (id: number) => void;
  onClick: (activity: IActivityClient) => void;
}

export default function ActivityListItem({
  activity,
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
        borderWidth: 0,
        opacity: completedToday ? 0.72 : 1,
      }}
    >
      <Pressable
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
              <FontAwesome6 name="gear" size={26} />
            </ThemedText>
          }
          swipeLeftColor="inherit"
          swipeRightChild={
            <ThemedText variant="heading">
              <Ionicons
                name="checkmark-done"
                size={24}
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
                  <ThemedText variant="bodyStrong" lineHeight={28}>
                    {activity.name}
                  </ThemedText>
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
                      <ThemedText
                        variant="caption"
                        weight="600"
                        lineHeight={20}
                      >
                        {activity.category.name}
                      </ThemedText>
                    </View>
                  )}
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
                      REMAIN:
                      <ThemedText
                        variant="bodySmall"
                        weight="700"
                        style={styles.activityDetailsSpan}
                      >
                        {activity.daysUntil}
                      </ThemedText>
                    </ThemedText>
                  )}
                  <ThemedText
                    variant="caption"
                    weight="500"
                    letterSpacing={-0.45}
                    style={styles.activityDetailsText}
                  >
                    INTRVL:
                    <ThemedText
                      variant="bodySmall"
                      weight="700"
                      style={styles.activityDetailsSpan}
                    >
                      {activity.interval}
                    </ThemedText>
                  </ThemedText>
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
                  {completedToday || activity.queued ? (
                    <LinearGradient
                      colors={[...Gradients.goalMet]}
                      locations={[0, 0.62, 1]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={{ flex: barFlex }}
                    />
                  ) : activity.daysUntil === 0 ? (
                    <LinearGradient
                      colors={[...Gradients.overdue]}
                      locations={[0, 0.5, 1]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={{ flex: barFlex }}
                    />
                  ) : (
                    <LinearGradient
                      colors={[...Gradients.goalInProgress]}
                      locations={[0, 0.42, 1]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={{ flex: barFlex }}
                    />
                  )}
                </View>
              </View>

              {activity.goal && activity.goalProgress && (
                <GoalProgressBar
                  count={activity.goalProgress.currentWeekCount}
                  target={activity.goal.targetPerWeek}
                  height={6}
                  trackColor={Colors.track}
                  style={styles.goalProgress}
                />
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
    marginLeft: 12,
    paddingHorizontal: 6,
    paddingVertical: 0,
    borderRadius: 8,
    borderWidth: 1,
  },
  activityDetails: {
    flexDirection: 'row',
    gap: 8,
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
    height: 12,
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
    borderRightWidth: 2,
    borderRightColor: Colors.divider,
  },
  goalProgress: {
    marginTop: 6,
  },
  goalText: {
    textAlign: 'right',
    marginTop: 0,
  },
});
