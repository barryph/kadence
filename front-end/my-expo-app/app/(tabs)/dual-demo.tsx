import React from 'react';
import { Text, View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  clamp,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';

type StickyTableProps<TCell, TColumn, TRow> = {
  columnHeaders: TColumn[];
  rowHeaders: TRow[];
  data: TCell[][];
  cellWidth: number;
  cellHeight: number;
  headerWidth: number;
  headerHeight: number;
  renderColumnHeader: (column: TColumn, index: number) => React.ReactNode;
  renderRowHeader: (row: TRow, index: number) => React.ReactNode;
  renderCell: (
    cell: TCell,
    rowIndex: number,
    columnIndex: number,
  ) => React.ReactNode;
  renderCorner?: () => React.ReactNode;
};

export function StickyTable<TCell, TColumn, TRow>({
  columnHeaders,
  rowHeaders,
  data,
  cellWidth,
  cellHeight,
  headerWidth,
  headerHeight,
  renderColumnHeader,
  renderRowHeader,
  renderCell,
  renderCorner,
}: StickyTableProps<TCell, TColumn, TRow>) {
  const scrollX = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const componentWidth = useSharedValue(0);
  const componentHeight = useSharedValue(0);
  // Lock scrolling to one direction at a time
  const lockedAxis = useSharedValue<'x' | 'y' | null>(null);
  const AXIS_THRESHOLD = 5;

  const contentWidth = columnHeaders.length * cellWidth;
  const contentHeight = rowHeaders.length * cellHeight;

  // When the layout has been calculated get the size of this component,
  // used to set max scroll limits
  function onBodyLayout(event: LayoutChangeEvent) {
    componentWidth.value = event.nativeEvent.layout.width;
    componentHeight.value = event.nativeEvent.layout.height;
  }

  // Handles swiping (mobile only, does not work for scrolling on web)
  const pan = Gesture.Pan()
    .onBegin(() => {
      startX.value = scrollX.value;
      startY.value = scrollY.value;
      lockedAxis.value = null;
    })
    .onUpdate((event) => {
      if (!lockedAxis.value) {
        // Determines the direction of scrolling
        const dragDistanceX = Math.abs(event.translationX);
        const dragDistanceY = Math.abs(event.translationY);
        const hasExceededLockThreshold = dragDistanceX >= AXIS_THRESHOLD || dragDistanceY >= AXIS_THRESHOLD;
        if (!hasExceededLockThreshold) return;
        // Set scroll direction
        lockedAxis.value = dragDistanceX > dragDistanceY ? 'x' : 'y';
      } else if (lockedAxis.value === 'x') {
        // Handle scrolling horizontally
        const maxScrollX = Math.max(0, contentWidth - componentWidth.value);
        scrollX.value = clamp(startX.value - event.translationX, 0, maxScrollX);
      } else {
        // Handle scrolling vertically
        const maxScrollY = Math.max(0, contentHeight - componentHeight.value);
        scrollY.value = clamp(startY.value - event.translationY, 0, maxScrollY);
      }
    })
    .onEnd((event) => {
      if (lockedAxis.value === 'x') {
        const maxScrollX = Math.max(0, contentWidth - componentWidth.value);
        scrollX.value = withDecay({
          velocity: -event.velocityX,
          clamp: [0, maxScrollX],
        });
      } else if (lockedAxis.value === 'y') {
        const maxScrollY = Math.max(0, contentHeight - componentHeight.value);
        scrollY.value = withDecay({
          velocity: -event.velocityY,
          clamp: [0, maxScrollY],
        });
      }
    });

  // "Scroll" position is set manually via transform: translate
  const columnHeaderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -scrollX.value }],
  }));
  const rowHeaderStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -scrollY.value }],
  }));
  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -scrollX.value },
      { translateY: -scrollY.value },
    ],
  }));

  return (
    <View style={styles.container}>
      {/* Top row: corner + horizontal sticky header */}
      <View style={styles.topRow}>
        <View style={[styles.cornerCell, { width: headerWidth, height: headerHeight, }]}>
          {renderCorner?.()}
        </View>

        <View style={styles.clip}>
          <Animated.View style={[styles.row, columnHeaderStyle]}>
            {columnHeaders.map((column, index) => (
              <View key={index} style={[styles.colHeaderCell, { width: cellWidth, height: headerHeight }]}>
                {renderColumnHeader(column, index)}
              </View>
            ))}
          </Animated.View>
        </View>
      </View>

      {/* Main - vertical sticky header + scrollable body */}
      <View style={styles.main}>
        <View style={[styles.clip, { width: headerWidth }]}>
          <Animated.View style={rowHeaderStyle}>
            {rowHeaders.map((row, index) => (
              <View key={index} style={[styles.rowHeaderCell, { width: headerWidth, height: cellHeight }]}>
                {renderRowHeader(row, index)}
              </View>
            ))}
          </Animated.View>
        </View>

        {/* Scrollable body */}
        <View
          style={[styles.bodyWrapper, styles.clip]}
          onLayout={onBodyLayout}
        >
          <Animated.View style={bodyStyle}>
            {data.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((cell, index) => (
                  <View key={index} style={[styles.cell, { width: cellWidth, height: cellHeight }]}>
                    {renderCell(cell, rowIndex, index)}
                  </View>
                ))}
              </View>
            ))}
          </Animated.View>

          <GestureDetector gesture={pan}>
            <View style={StyleSheet.absoluteFill} />
          </GestureDetector>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  clip: {
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
  },
  cornerCell: {
    backgroundColor: '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  main: {
    flexDirection: 'row',
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  bodyWrapper: {
    flex: 1,
  },
  colHeaderCell: {
    backgroundColor: '#34495e',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#2c3e50',
  },
  rowHeaderCell: {
    backgroundColor: '#34495e',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#2c3e50',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
});

const DATES = [
  'Mon 1', 'Tue 2', 'Wed 3', 'Thu 4', 'Fri 5', 'Sat 6', 'Sun 7', 'Mon 8',
  'Tue 9', 'Wed 10', 'Thu 11', 'Fri 12'
];
const SPORTS = [
  'Soccer', 'Basketball', 'Tennis', 'Baseball', 'Hockey', 'Volleyball',
  'Swimming', 'Athletics', 'Cycling', 'Rugby', 'Netball', 'Running', 'Sprinting',
  'Ult Frisbee', 'Cricket', 'Table Tennis', 'Archery', 'Badminton'
];
const DATA = SPORTS.map((sport, i) => DATES.map((_d, j) => `${sport[0]}${i}-${j}`));

export default function StickyTableExample() {
  return (
    <View style={{ backgroundColor: '#fff', flex: 1 }}>
      <Text>AAAAAAA</Text>
      <Text>AAAAAAA</Text>
      <Text>AAAAAAA</Text>
      <Text>AAAAAAA</Text>
      <Text>AAAAAAA</Text>
      <StickyTable
        columnHeaders={DATES}
        rowHeaders={SPORTS}
        data={DATA}
        renderColumnHeader={(date) => <Text style={exampleStyles.headerText}>{date}</Text>}
        renderRowHeader={(sport) => <Text style={exampleStyles.headerText}>{sport}</Text>}
        renderCell={(value) => <Text style={exampleStyles.cellText}>{value}</Text>}
        cellWidth={100}
        cellHeight={50}
        headerWidth={120}
        headerHeight={50}
      />
    </View>
  );
}

const exampleStyles = StyleSheet.create({
  headerText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  cellText: { fontSize: 13, color: '#333' },
});
