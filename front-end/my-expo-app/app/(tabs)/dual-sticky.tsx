import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import Animated, { useAnimatedRef, useAnimatedScrollHandler, scrollTo, useSharedValue, useAnimatedReaction, useAnimatedStyle } from "react-native-reanimated";

const dateColumns = [
  {
    "full": "2026-05-01",
  },
  {
    "full": "2026-05-02",
  },
  {
    "full": "2026-05-03",
  },
  {
    "full": "2026-05-04",
  },
  {
    "full": "2026-05-05",
  },
  {
    "full": "2026-05-06",
  },
  {
    "full": "2026-05-07",
  },
  {
    "full": "2026-05-08",
  },
  {
    "full": "2026-05-09",
  },
  {
    "full": "2026-05-10",
  },
  {
    "full": "2026-05-11",
  },
  {
    "full": "2026-05-12",
  },
  {
    "full": "2026-05-13",
  },
  {
    "full": "2026-05-14",
  },
  {
    "full": "2026-05-15",
  },
  {
    "full": "2026-05-16",
  },
  {
    "full": "2026-05-17",
  },
  {
    "full": "2026-05-18",
  },
  {
    "full": "2026-05-19",
  },
  {
    "full": "2026-05-20",
  },
  {
    "full": "2026-05-21",
  }
]

const activities = [
  {
    "id": 1,
    "name": "Jump",
  },
  {
    "id": 2,
    "name": "Sprint",
  },
  {
    "id": 3,
    "name": "Hop",
  },
  {
    "id": 4,
    "name": "PTL",
  },
  {
    "id": 5,
    "name": "Leap",
  },
  {
    "id": 6,
    "name": "Bound",
  },
  {
    "id": 7,
    "name": "Squat",
  },
  {
    "id": 8,
    "name": "Reverse",
  },
  {
    "id": 9,
    "name": "Curl",
  },
  {
    "id": 10,
    "name": "CMJ",
  },
  {
    "id": 11,
    "name": "CMJ",
  },
  {
    "id": 12,
    "name": "CMJ",
  },
  {
    "id": 13,
    "name": "CMJ",
  },
  {
    "id": 14,
    "name": "CMJ",
  },
  {
    "id": 15,
    "name": "CMJ",
  },
  {
    "id": 16,
    "name": "CMJ",
  },
];

const timeline = {
  "1": new Set([
    "2026-05-01",
    "2026-05-02",
    "2026-05-03",
    "2026-05-04",
    "2026-05-05",
    "2026-05-06",
    "2026-05-07",
    "2026-05-08",
    "2026-05-09",
    "2026-05-10",
    "2026-05-11",
    "2026-05-12",
    "2026-05-13",
    "2026-05-14",
    "2026-05-15",
    "2026-05-16",
    "2026-05-17",
    "2026-05-18",
    "2026-05-19"
  ]),
  "2": new Set([
    "2026-05-01",
    "2026-05-02",
    "2026-05-03",
    "2026-05-04",
    "2026-05-05",
    "2026-05-11",
    "2026-05-17",
    "2026-05-18",
    "2026-05-19"
  ]),
  "3": new Set([
    "2026-05-01",
    "2026-05-02",
    "2026-05-03",
    "2026-05-04",
    "2026-05-07",
    "2026-05-08",
    "2026-05-09",
    "2026-05-11",
    "2026-05-13",
    "2026-05-14",
    "2026-05-15",
    "2026-05-18"
  ]),
  "4": new Set([
    "2026-05-01",
    "2026-05-02",
    "2026-05-03",
    "2026-05-06",
    "2026-05-10",
    "2026-05-12",
    "2026-05-16",
    "2026-05-19"
  ]),
  "5": new Set([
    "2026-05-01",
    "2026-05-02",
    "2026-05-03",
    "2026-05-05",
    "2026-05-11",
    "2026-05-17",
    "2026-05-19"
  ]),
  "6": new Set([
    "2026-05-01",
    "2026-05-02",
    "2026-05-03",
    "2026-05-05",
    "2026-05-17",
    "2026-05-19"
  ]),
  "7": new Set([
    "2026-05-01",
    "2026-05-02",
    "2026-05-03",
    "2026-05-06",
    "2026-05-10",
    "2026-05-12",
    "2026-05-16",
    "2026-05-19"
  ]),
  "8": new Set([
    "2026-05-01",
    "2026-05-02",
    "2026-05-04",
    "2026-05-07",
    "2026-05-10",
    "2026-05-11",
    "2026-05-12",
    "2026-05-15",
    "2026-05-18"
  ]),
  "9": new Set([
    "2026-05-01",
    "2026-05-02",
    "2026-05-05",
    "2026-05-08",
    "2026-05-11",
    "2026-05-14",
    "2026-05-17"
  ]),
  "10": new Set([
    "2026-05-01",
    "2026-05-02",
    "2026-05-06",
    "2026-05-09",
    "2026-05-13",
    "2026-05-16",
    "2026-05-19"
  ]),
  // "11": new Set([
  //   "2026-05-01",
  //   "2026-05-07",
  //   "2026-05-10",
  //   "2026-05-12",
  //   "2026-05-15"
  // ]),
  // "44": new Set([
  //   "2026-05-01",
  //   "2026-05-04",
  //   "2026-05-05",
  //   "2026-05-06",
  //   "2026-05-08",
  //   "2026-05-11",
  //   "2026-05-14",
  //   "2026-05-16",
  //   "2026-05-17",
  //   "2026-05-18"
  // ]),
  // "45": new Set([
  //   "2026-05-01",
  //   "2026-05-03",
  //   "2026-05-06",
  //   "2026-05-09",
  //   "2026-05-13",
  //   "2026-05-17",
  //   "2026-05-19"
  // ]),
  // "46": new Set([
  //   "2026-05-01",
  //   "2026-05-03",
  //   "2026-05-04",
  //   "2026-05-05",
  //   "2026-05-06",
  //   "2026-05-10",
  //   "2026-05-11",
  //   "2026-05-12",
  //   "2026-05-17"
  // ]),
  // "47": new Set([
  //   "2026-05-01"
  // ]),
  // "48": new Set([
  //   "2026-05-01",
  //   "2026-05-03",
  //   "2026-05-06",
  //   "2026-05-17"
  // ]),
  // "49": new Set([
  //   "2026-05-01",
  //   "2026-05-04",
  //   "2026-05-05",
  //   "2026-05-06",
  //   "2026-05-16",
  //   "2026-05-17",
  //   "2026-05-18"
  // ]),
};

export default function DualStickyScreen() {
  const scrollX = useSharedValue(0);
  const scrollY = useSharedValue(0);

  // Runs on the UI thread
  const scrollHandlerX = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });
  const scrollHandlerY = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Sync the "scroll" position of the date header with the body
  const colHeaderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -scrollX.value }],
  }));
  // Sync the "scroll" position of the sports header with the body
  const rowHeaderStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -scrollY.value }],
  }));

  return (
    <>
      <View style={styles.container}>
        {/* <Animated.ScrollView */}
        {/*   onScroll={headerScrollHandler} */}
        {/*   style={styles.header} */}
        {/*   overScrollMode="never" */}
        {/*   bounces={false} */}
        {/* > */}
        {/*   <View style={styles.leftColumn}> */}
        {/*     {activities.map((activity) => ( */}
        {/*       <View key={activity.id} style={styles.activityLabelCell}> */}
        {/*         <Text style={styles.activityLabelText}> */}
        {/*           {activity.name} */}
        {/*         </Text> */}
        {/*       </View> */}
        {/*     ))} */}
        {/*   </View> */}
        {/* </Animated.ScrollView> */}

        <View style={styles.topRow}>
          {/* Blank corner cell - top left */}
          <View style={styles.cornerCell}></View>

          {/* Dates header — clipped so overflow is hidden, translated by scrollX */}
          <View style={styles.colHeaderClip}>
            <Animated.View style={[styles.headerRow, colHeaderStyle]}>

              {dateColumns.map((date) => (
                <View key={date.full} style={styles.dateCell}>
                  <Text>{date.full.substring(8, 10)}</Text>
                </View>
              ))}
            </Animated.View>
          </View>
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.rowHeaderClip}>
            <Animated.View style={rowHeaderStyle}>
              {/* {SPORTS.map((sport) => ( */}
              {/*   <View key={sport} style={styles.rowHeaderCell}> */}
              {/*     <Text style={styles.headerText}>{sport}</Text> */}
              {/*   </View> */}
              {/* ))} */}
              {dateColumns.map((date) => (
                <View key={date.full} style={styles.dateCell}>
                  <Text>{date.full.substring(8, 10)}</Text>
                </View>
              ))}
            </Animated.View>
          </View>
        </View>


        <Animated.ScrollView horizontal style={{ flex: 1 }} overScrollMode="never" bounces={false}>
          {/* Key #1: stickyHeaderIndices */}
          <Animated.ScrollView
            stickyHeaderIndices={[0]}
            removeClippedSubviews={false}
            showsVerticalScrollIndicator={true}
            bounces={false}
            overScrollMode="never"
          // onScroll={bodyScrollHandler}
          >
            <View style={styles.headerRow}>
              <View style={styles.headerDatesContainer}>
                <View style={styles.leftColumnHeader}></View>
                {dateColumns.map((date) => (
                  <View key={date.full} style={styles.dateCell}>
                    <Text>{date.full.substring(8, 10)}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.bodyRow}>
              <View style={styles.matrixContainer}>
                <View style={styles.matrix}>
                  {activities.map((activity) => {
                    const completedDates = timeline[activity.id] || new Set<string>();
                    return (
                      <View key={activity.id} style={styles.activityRow}>
                        {dateColumns.map((date) => {
                          const isCompleted = completedDates.has(date.full);
                          const cellKey = `${activity.id}-${date.full}`;
                          return (
                            <View key={cellKey} style={styles.statusCellContainer}>
                              <TouchableOpacity
                                style={[
                                  styles.statusCell,
                                  isCompleted ? styles.statusCellComplete : styles.statusCellIncomplete,
                                ]}
                              />
                            </View>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

          </Animated.ScrollView>
        </Animated.ScrollView>
      </View>
    </>
  )
}

const CELL_SIZE = 20;
const CELL_GAP = 13;
const ROW_CONTENT_SIZE = 36;
const ROW_HEIGHT = ROW_CONTENT_SIZE + (CELL_GAP * 2);
const LOAD_MORE_WIDTH = 170;
const LEFT_COLUMN_WIDTH = 120; // To allow the ticker text to show

const styles = StyleSheet.create({
  container: {
    flexDirection: "row", // Position values besides the activity headers
    flex: 1, // IMPORTANT! Can't scroll Y without it
    backgroundColor: '#fff',
  },
  topRow: {
    flexDirection: 'row',
  },
  colHeaderClip: {
    flex: 1,
    overflow: 'hidden', // Stop overflowing the blank corner, z-index on cornerCell also works
  },
  bottomRow: {
    flexDirection: 'row',
    flex: 1,
  },
  rowHeaderClip: {
    width: ROW_CONTENT_SIZE,
    overflow: 'hidden', // Stop overflowing the blank corner, z-index on cornerCell also works
  },
  header: {
    flexGrow: 0, // Stop from auto growing, lets you keep the column to your chosen width
  },
  headerDatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: CELL_GAP,
    gap: CELL_GAP,
    height: '100%',
  },
  cornerCell: {
    width: ROW_CONTENT_SIZE,
    height: ROW_HEIGHT,
    backgroundColor: '#2c3e50',
  },
  // leftColumnHeader: {
  //   height: '100%',
  //   width: LEFT_COLUMN_WIDTH - CELL_GAP,
  //   borderRightWidth: 1,
  //   borderRightColor: '#e5e8ef',
  // },
  dateCell: {
    width: CELL_SIZE,
    height: ROW_CONTENT_SIZE,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  bodyRow: {
    // flexDirection: 'row',
  },
  leftColumn: {
    width: LEFT_COLUMN_WIDTH,
    minWidth: LEFT_COLUMN_WIDTH,
    borderRightWidth: 1,
    borderRightColor: '#e5e8ef',
    flexShrink: 0,
  },
  activityLabelCell: {
    height: ROW_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f7',
  },
  activityLabelText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '800',
  },
  headerRow: {
    flexDirection: 'row',
    height: ROW_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e8ef',
    backgroundColor: '#fff',
    zIndex: 10,
  },
  matrixContainer: {
    flexDirection: 'row',
    color: 'green',
  },
  matrix: {
    flexDirection: 'column',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ROW_HEIGHT,
    paddingHorizontal: CELL_GAP,
    gap: CELL_GAP,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f7',
  },
  statusCellContainer: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 3,
  },
  statusCellComplete: {
    backgroundColor: '#2f6dff',
  },
  statusCellIncomplete: {
    backgroundColor: '#cfd6e2',
  },
  statusCellToggling: {
    opacity: 0.5,
  },
});
