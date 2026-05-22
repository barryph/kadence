// NOTE: WORKS, but requires passing cell height and width as props
//
// import React, { useEffect } from 'react';
// import { View, Text, StyleSheet } from 'react-native';
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   withDecay,
//   clamp,
// } from 'react-native-reanimated';
// import {
//   Gesture,
//   GestureDetector,
//   GestureHandlerRootView,
// } from 'react-native-gesture-handler';
//
// const AXIS_LOCK_THRESHOLD = 5;
//
// function StickyTable({
//   columnHeaders,
//   rowHeaders,
//   data,
//   renderColumnHeader,
//   renderRowHeader,
//   renderCell,
//   cellWidth,
//   cellHeight,
//   headerWidth,
//   headerHeight,
// }) {
//   const scrollX = useSharedValue(0);
//   const scrollY = useSharedValue(0);
//   const startX = useSharedValue(0);
//   const startY = useSharedValue(0);
//   const lockedAxis = useSharedValue(0);
//
//   const maxScrollX = useSharedValue(0);
//   const maxScrollY = useSharedValue(0);
//   const contentWidth = useSharedValue(0);
//   const contentHeight = useSharedValue(0);
//   const bodyWidth = useSharedValue(0);
//   const bodyHeight = useSharedValue(0);
//
//   // ✅ Fix 1: Compute content size directly from props — no layout measurement needed.
//   // The Animated.View's rendered size is always cols×cellWidth by rows×cellHeight.
//   useEffect(() => {
//     contentWidth.value = columnHeaders.length * cellWidth;
//     contentHeight.value = rowHeaders.length * cellHeight;
//     // Recompute max scroll in case body is already laid out
//     maxScrollX.value = Math.max(0, contentWidth.value - bodyWidth.value);
//     maxScrollY.value = Math.max(0, contentHeight.value - bodyHeight.value);
//   }, [columnHeaders.length, rowHeaders.length, cellWidth, cellHeight]);
//
//   // ✅ Fix 2: onBodyLayout now has correct content dimensions to diff against.
//   const onBodyLayout = (e) => {
//     bodyWidth.value = e.nativeEvent.layout.width;
//     bodyHeight.value = e.nativeEvent.layout.height;
//     maxScrollX.value = Math.max(0, contentWidth.value - e.nativeEvent.layout.width);
//     maxScrollY.value = Math.max(0, contentHeight.value - e.nativeEvent.layout.height);
//   };
//
//   const pan = Gesture.Pan()
//     .onBegin(() => {
//       startX.value = scrollX.value;
//       startY.value = scrollY.value;
//       lockedAxis.value = 0;
//     })
//     .onUpdate((e) => {
//       if (lockedAxis.value === 0) {
//         const absX = Math.abs(e.translationX);
//         const absY = Math.abs(e.translationY);
//         if (absX < AXIS_LOCK_THRESHOLD && absY < AXIS_LOCK_THRESHOLD) return;
//         lockedAxis.value = absX > absY ? 1 : 2;
//       }
//       if (lockedAxis.value === 1) {
//         scrollX.value = clamp(startX.value - e.translationX, 0, maxScrollX.value);
//       } else if (lockedAxis.value === 2) {
//         scrollY.value = clamp(startY.value - e.translationY, 0, maxScrollY.value);
//       }
//     })
//     .onEnd((e) => {
//       if (lockedAxis.value === 1) {
//         scrollX.value = withDecay({ velocity: -e.velocityX, clamp: [0, maxScrollX.value] });
//       } else if (lockedAxis.value === 2) {
//         scrollY.value = withDecay({ velocity: -e.velocityY, clamp: [0, maxScrollY.value] });
//       }
//       lockedAxis.value = 0;
//     });
//
//   const bodyStyle = useAnimatedStyle(() => ({
//     transform: [
//       { translateX: -scrollX.value },
//       { translateY: -scrollY.value },
//     ],
//   }));
//
//   const colHeaderStyle = useAnimatedStyle(() => ({
//     transform: [{ translateX: -scrollX.value }],
//   }));
//
//   const rowHeaderStyle = useAnimatedStyle(() => ({
//     transform: [{ translateY: -scrollY.value }],
//   }));
//
//   return (
//     <GestureHandlerRootView style={styles.container}>
//       <View style={styles.topRow}>
//         <View style={[styles.cornerCell, { width: headerWidth, height: headerHeight }]}>
//           <Text style={styles.cornerText}>Sport / Date</Text>
//         </View>
//         <View style={styles.colHeaderClip}>
//           <Animated.View style={[styles.headerRow, colHeaderStyle]}>
//             {columnHeaders.map((col, i) => (
//               <View key={i} style={[styles.headerCell, { width: cellWidth, height: headerHeight }]}>
//                 {renderColumnHeader(col, i)}
//               </View>
//             ))}
//           </Animated.View>
//         </View>
//       </View>
//
//       <View style={styles.bottomRow}>
//         <View style={[styles.rowHeaderClip, { width: headerWidth }]}>
//           <Animated.View style={rowHeaderStyle}>
//             {rowHeaders.map((row, i) => (
//               <View key={i} style={[styles.rowHeaderCell, { width: headerWidth, height: cellHeight }]}>
//                 {renderRowHeader(row, i)}
//               </View>
//             ))}
//           </Animated.View>
//         </View>
//
//         {/* ✅ Fix 3: Removed the <View onLayout={onContentLayout}> wrapper entirely.
//             The Animated.View no longer needs a parent to measure it — content size
//             comes from props via the useEffect above. */}
//         <View style={styles.bodyClip} onLayout={onBodyLayout}>
//           <Animated.View style={bodyStyle}>
//             {data.map((row, rowIndex) => (
//               <View key={rowIndex} style={styles.bodyRow}>
//                 {row.map((cell, colIndex) => (
//                   <View key={colIndex} style={[styles.cell, { width: cellWidth, height: cellHeight }]}>
//                     {renderCell(cell, rowIndex, colIndex)}
//                   </View>
//                 ))}
//               </View>
//             ))}
//           </Animated.View>
//
//           <GestureDetector gesture={pan}>
//             <View style={StyleSheet.absoluteFill} />
//           </GestureDetector>
//         </View>
//       </View>
//     </GestureHandlerRootView>
//   );
// }
// const DATES = ['Mon 1', 'Tue 2', 'Wed 3', 'Thu 4', 'Fri 5', 'Sat 6', 'Sun 7',
//   'Mon 8', 'Tue 9', 'Wed 10', 'Thu 11', 'Fri 12'];
// const SPORTS = [
//   'Soccer', 'Basketball', 'Tennis', 'Baseball', 'Hockey', 'Volleyball',
//   'Swimming', 'Athletics', 'Cycling', 'Rugby', 'Netball', 'Running', 'Sprinting',
//   'Ult Frisbee', 'Cricket', 'Table Tennis', 'Archery', 'Badminton'
// ];
// const DATA = SPORTS.map((sport, i) => DATES.map((_d, j) => `${sport[0]}${i}-${j}`));
//
// export default function StickyTableExample() {
//   return (
//     <StickyTable
//       columnHeaders={DATES}
//       rowHeaders={SPORTS}
//       data={DATA}
//       renderColumnHeader={(date) => <Text style={styles.headerText}>{date}</Text>}
//       renderRowHeader={(sport) => <Text style={styles.headerText}>{sport}</Text>}
//       renderCell={(value) => <Text style={styles.cellText}>{value}</Text>}
//       cellWidth={100}
//       cellHeight={50}
//       headerWidth={120}
//       headerHeight={50}
//     />
//   );
// }
//
// // ─── Styles ───────────────────────────────────────────────────────────────────
//
// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#fff' },
//   topRow: { flexDirection: 'row' },
//   bottomRow: { flexDirection: 'row', flex: 1 },
//   cornerCell: { backgroundColor: '#2c3e50', justifyContent: 'center', alignItems: 'center' },
//   cornerText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
//   headerRow: { flexDirection: 'row' },
//   colHeaderClip: { flex: 1, overflow: 'hidden' },
//   rowHeaderClip: { overflow: 'hidden' },
//   bodyClip: { flex: 1, overflow: 'hidden' },
//   headerCell: { backgroundColor: '#34495e', justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderColor: '#2c3e50' },
//   rowHeaderCell: { backgroundColor: '#34495e', justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderColor: '#2c3e50' },
//   headerText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
//   bodyRow: { flexDirection: 'row' },
//   cell: { justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#ddd' },
//   cellText: { fontSize: 13, color: '#333' },
// });





// import React, { useEffect, useCallback } from 'react';
// import { View, Text, StyleSheet } from 'react-native';
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   withDecay,
//   clamp,
// } from 'react-native-reanimated';
// import {
//   Gesture,
//   GestureDetector,
//   GestureHandlerRootView,
// } from 'react-native-gesture-handler';
//
// const AXIS_LOCK_THRESHOLD = 5;
//
// function StickyTable({
//   columnHeaders,
//   rowHeaders,
//   data,
//   renderColumnHeader,
//   renderRowHeader,
//   renderCell,
//   cellWidth,
//   cellHeight,
//   headerWidth,
//   headerHeight,
//   cornerLabel = '',
// }) {
//   const scrollX = useSharedValue(0);
//   const scrollY = useSharedValue(0);
//   const startX = useSharedValue(0);
//   const startY = useSharedValue(0);
//   // Lock scrolling to one direction at a time
//   const lockedAxis = useSharedValue(0); // 0 = undecided, 1 = horizontal, 2 = vertical
//
//   const maxScrollX = useSharedValue(0);
//   const maxScrollY = useSharedValue(0);
//   const bodyWidth = useSharedValue(0);
//   const bodyHeight = useSharedValue(0);
//
//   // Updates maxScrollX/Y if the props change post mount.
//   // Note: The initial run of this effect on mount is pointless because it runs before
//   // onBodyLayout and therefore bodyWidth and bodyHeight haven't yet been calced.
//   useEffect(() => {
//     const contentWidth = columnHeaders.length * cellWidth;
//     const contentHeight = rowHeaders.length * cellHeight;
//     maxScrollX.value = Math.max(0, contentWidth - bodyWidth.value);
//     maxScrollY.value = Math.max(0, contentHeight - bodyHeight.value);
//   }, [columnHeaders.length, rowHeaders.length, cellWidth, cellHeight]);
//
//   const onBodyLayout = useCallback((e) => {
//     const { width, height } = e.nativeEvent.layout;
//     bodyWidth.value = width;
//     bodyHeight.value = height;
//     maxScrollX.value = Math.max(0, columnHeaders.length * cellWidth - width);
//     maxScrollY.value = Math.max(0, rowHeaders.length * cellHeight - height);
//   }, [columnHeaders.length, rowHeaders.length, cellWidth, cellHeight]);
//
//   const pan = Gesture.Pan()
//     .onBegin(() => {
//       startX.value = scrollX.value;
//       startY.value = scrollY.value;
//       lockedAxis.value = 0;
//     })
//     .onUpdate((e) => {
//       if (lockedAxis.value === 0) {
//         const absX = Math.abs(e.translationX);
//         const absY = Math.abs(e.translationY);
//         if (absX < AXIS_LOCK_THRESHOLD && absY < AXIS_LOCK_THRESHOLD) return;
//         lockedAxis.value = absX > absY ? 1 : 2;
//       }
//       if (lockedAxis.value === 1) {
//         scrollX.value = clamp(startX.value - e.translationX, 0, maxScrollX.value);
//       } else {
//         scrollY.value = clamp(startY.value - e.translationY, 0, maxScrollY.value);
//       }
//     })
//     .onEnd((e) => {
//       if (lockedAxis.value === 1) {
//         scrollX.value = withDecay({ velocity: -e.velocityX, clamp: [0, maxScrollX.value] });
//       } else if (lockedAxis.value === 2) {
//         scrollY.value = withDecay({ velocity: -e.velocityY, clamp: [0, maxScrollY.value] });
//       }
//       lockedAxis.value = 0;
//     });
//
//   const colHeaderStyle = useAnimatedStyle(() => ({
//     transform: [{ translateX: -scrollX.value }],
//   }));
//
//   const rowHeaderStyle = useAnimatedStyle(() => ({
//     transform: [{ translateY: -scrollY.value }],
//   }));
//
//   const bodyStyle = useAnimatedStyle(() => ({
//     transform: [
//       { translateX: -scrollX.value },
//       { translateY: -scrollY.value },
//     ],
//   }));
//
//   return (
//     <GestureHandlerRootView style={styles.container}>
//       {/* Top row: corner + scrolling column headers */}
//       <View style={styles.topRow}>
//         <View style={[styles.cornerCell, { width: headerWidth, height: headerHeight }]}>
//           {cornerLabel ? <Text style={styles.cornerText}>{cornerLabel}</Text> : null}
//         </View>
//         <View style={styles.colHeaderClip}>
//           <Animated.View style={[styles.row, colHeaderStyle]}>
//             {columnHeaders.map((col, i) => (
//               <View key={i} style={[styles.colHeaderCell, { width: cellWidth, height: headerHeight }]}>
//                 {renderColumnHeader(col, i)}
//               </View>
//             ))}
//           </Animated.View>
//         </View>
//       </View>
//
//       {/* Bottom row: sticky row headers + scrollable body */}
//       <View style={styles.bottomRow}>
//         <View style={[styles.rowHeaderClip, { width: headerWidth }]}>
//           <Animated.View style={rowHeaderStyle}>
//             {rowHeaders.map((row, i) => (
//               <View key={i} style={[styles.rowHeaderCell, { width: headerWidth, height: cellHeight }]}>
//                 {renderRowHeader(row, i)}
//               </View>
//             ))}
//           </Animated.View>
//         </View>
//
//         <View style={styles.bodyClip} onLayout={onBodyLayout}>
//           <Animated.View style={bodyStyle}>
//             {data.map((row, rowIndex) => (
//               <View key={rowIndex} style={styles.row}>
//                 {row.map((cell, colIndex) => (
//                   <View key={colIndex} style={[styles.cell, { width: cellWidth, height: cellHeight }]}>
//                     {renderCell(cell, rowIndex, colIndex)}
//                   </View>
//                 ))}
//               </View>
//             ))}
//           </Animated.View>
//
//           <GestureDetector gesture={pan}>
//             <View style={StyleSheet.absoluteFill} />
//           </GestureDetector>
//         </View>
//       </View>
//     </GestureHandlerRootView>
//   );
// }
//
// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   topRow: { flexDirection: 'row' },
//   bottomRow: { flexDirection: 'row', flex: 1 },
//   row: { flexDirection: 'row' },
//   colHeaderClip: { flex: 1, overflow: 'hidden' },
//   rowHeaderClip: { overflow: 'hidden' },
//   bodyClip: { flex: 1, overflow: 'hidden' },
//   cornerCell: { backgroundColor: '#2c3e50', justifyContent: 'center', alignItems: 'center' },
//   cornerText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
//   colHeaderCell: { backgroundColor: '#34495e', justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderColor: '#2c3e50' },
//   rowHeaderCell: { backgroundColor: '#34495e', justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderColor: '#2c3e50' },
//   cell: { justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#ddd' },
// });
//
// // ─── Example usage ────────────────────────────────────────────────────────────
//
// const DATES = [
//   'Mon 1', 'Tue 2', 'Wed 3', 'Thu 4', 'Fri 5', 'Sat 6', 'Sun 7',
//   'Mon 8', 'Tue 9', 'Wed 10', 'Thu 11', 'Fri 12',
// ];
//
// const SPORTS = [
//   'Soccer', 'Basketball', 'Tennis', 'Baseball', 'Hockey', 'Volleyball',
//   'Swimming', 'Athletics', 'Cycling', 'Rugby', 'Netball', 'Running',
//   'Sprinting', 'Ult Frisbee', 'Cricket', 'Table Tennis', 'Archery', 'Badminton',
// ];
//
// const DATA = SPORTS.map((sport, i) => DATES.map((_d, j) => `${sport[0]}${i}-${j}`));
//
// const exampleStyles = StyleSheet.create({
//   headerText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
//   cellText: { fontSize: 13, color: '#333' },
// });
//
// export default function StickyTableExample() {
//   return (
//     <StickyTable
//       columnHeaders={DATES}
//       rowHeaders={SPORTS}
//       data={DATA}
//       renderColumnHeader={(date) => <Text style={exampleStyles.headerText}>{date}</Text>}
//       renderRowHeader={(sport) => <Text style={exampleStyles.headerText}>{sport}</Text>}
//       renderCell={(value) => <Text style={exampleStyles.cellText}>{value}</Text>}
//       cellWidth={100}
//       cellHeight={50}
//       headerWidth={120}
//       headerHeight={50}
//       cornerLabel="Sport / Date"
//     />
//   );
// }



// NOTE: You can sticky header vertial, but not horizontal
// overScrollMode="never" (android) bounces={false} iOS - stops the bounce, helps the scroll look more sync, less janky
// NOTE: Requires, GestureHandlerRootView - either place at root of app, or wrap the component

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

const AXIS_THRESHOLD = 5;

type StickyTableProps<TCell, TColumn, TRow> = {
  columnHeaders: TColumn[];
  rowHeaders: TRow[];
  data: TCell[][];

  renderColumnHeader: (column: TColumn, index: number) => React.ReactNode;
  renderRowHeader: (row: TRow, index: number) => React.ReactNode;
  renderCell: (
    cell: TCell,
    rowIndex: number,
    columnIndex: number,
  ) => React.ReactNode;

  cellWidth: number;
  cellHeight: number;
  headerWidth: number;
  headerHeight: number;

  renderCorner?: () => React.ReactNode;
};

export function StickyTable<TCell, TColumn, TRow>({
  columnHeaders,
  rowHeaders,
  data,
  renderColumnHeader,
  renderRowHeader,
  renderCell,
  cellWidth,
  cellHeight,
  headerWidth,
  headerHeight,
  renderCorner,
}: StickyTableProps<TCell, TColumn, TRow>) {
  const scrollX = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const viewportWidth = useSharedValue(0);
  const viewportHeight = useSharedValue(0);
  // Lock scrolling to one direction at a time
  const lockedAxis = useSharedValue<'x' | 'y' | null>(null);

  const contentWidth = columnHeaders.length * cellWidth;
  const contentHeight = rowHeaders.length * cellHeight;

  function onBodyLayout(event: LayoutChangeEvent) {
    viewportWidth.value = event.nativeEvent.layout.width;
    viewportHeight.value = event.nativeEvent.layout.height;
  }

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
        const maxScrollX = Math.max(0, contentWidth - viewportWidth.value);
        scrollX.value = clamp(startX.value - event.translationX, 0, maxScrollX);
      } else {
        // Handle scrolling vertically
        const maxScrollY = Math.max(0, contentHeight - viewportHeight.value);
        scrollY.value = clamp(startY.value - event.translationY, 0, maxScrollY);
      }
    })
    .onEnd((event) => {
      if (lockedAxis.value === 'x') {
        const maxScrollX = Math.max(0, contentWidth - viewportWidth.value);
        scrollX.value = withDecay({
          velocity: -event.velocityX,
          clamp: [0, maxScrollX],
        });
      } else if (lockedAxis.value === 'y') {
        const maxScrollY = Math.max(0, contentHeight - viewportHeight.value);
        scrollY.value = withDecay({
          velocity: -event.velocityY,
          clamp: [0, maxScrollY],
        });
      }
    });

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

const DATES = ['Mon 1', 'Tue 2', 'Wed 3', 'Thu 4', 'Fri 5', 'Sat 6', 'Sun 7',
  'Mon 8', 'Tue 9', 'Wed 10', 'Thu 11', 'Fri 12'];
const SPORTS = [
  'Soccer', 'Basketball', 'Tennis', 'Baseball', 'Hockey', 'Volleyball',
  'Swimming', 'Athletics', 'Cycling', 'Rugby', 'Netball', 'Running', 'Sprinting',
  'Ult Frisbee', 'Cricket', 'Table Tennis', 'Archery', 'Badminton'
];
const DATA = SPORTS.map((sport, i) => DATES.map((_d, j) => `${sport[0]}${i}-${j}`));

const exampleStyles = StyleSheet.create({
  headerText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  cellText: { fontSize: 13, color: '#333' },
});

export default function StickyTableExample() {
  return (
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
  );
}
