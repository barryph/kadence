import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

import { ThemedText } from '@/components/base/themed-text';
import SwipeRow from '@/components/swipe-row';
import type { IActivityClient } from '@/api/api.activity';
import ListItemShell from '@/components/list-item-shell';

const DAYS_IN_WEEK = 7;

interface IProps {
  activity: IActivityClient;
  index: number;
  onEdit: (activity: IActivityClient) => void;
  onComplete: (id: number) => void;
  onClick: (activity: IActivityClient) => void;
}

export default function ActivityListItem({
  activity,
  index,
  onEdit,
  onComplete,
  onClick,
}: IProps) {
  const remainingPercent = Math.min(
    Math.max((activity.daysUntil || 0) / DAYS_IN_WEEK, 0),
    1,
  );

  return (
    <ListItemShell
      style={[
        activity.category && {
          borderColor: `${activity.category?.color}66`,
        },
      ]}
    >
      <Pressable onPress={() => onClick(activity)}>
        <SwipeRow
          onSwipeLeft={() => onEdit(activity)}
          onSwipeRight={() => onComplete(activity.id)}
          swipeLeftChild={
            <ThemedText style={{ fontSize: 24, color: '#eee' }}>
              <FontAwesome6 name="gear" size={26} />
            </ThemedText>
          }
          swipeLeftColor="inherit"
          swipeRightChild={
            <ThemedText style={{ fontSize: 24, color: '#000' }}>
              <Ionicons name="checkmark-done" size={24} color="#fff" />
            </ThemedText>
          }
          swipeRightColor="#fff"
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
                        {activity.category.name}
                      </ThemedText>
                    </View>
                  )}
                </View>
                <View style={styles.activityDetails}>
                  <ThemedText
                    style={[
                      styles.activityDetailsText,
                      activity.queued && styles.activityDetailsTextSelected,
                    ]}
                  >
                    REMAIN:
                    <ThemedText
                      style={[
                        styles.activityDetailsSpan,
                        activity.queued && styles.activityDetailsSpanSelected,
                      ]}
                    >
                      {activity.daysUntil}
                    </ThemedText>
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.activityDetailsText,
                      activity.queued && styles.activityDetailsTextSelected,
                    ]}
                  >
                    INTRVL:
                    <ThemedText
                      style={[
                        styles.activityDetailsSpan,
                        activity.queued && styles.activityDetailsSpanSelected,
                      ]}
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
      </Pressable>
    </ListItemShell>
  );
}

const styles = StyleSheet.create({
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
    // color: '#8f98aa',
    color: '#7e91b6',
    // letterSpacing: '-.045em',
    letterSpacing: -0.45,
    fontWeight: 500,
  },
  activityDetailsSpan: {
    fontSize: 14,
    fontWeight: 700,
    color: '#fff',
    marginLeft: 3,
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
});
