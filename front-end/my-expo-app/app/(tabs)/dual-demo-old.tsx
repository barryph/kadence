// NOTE: You can sticky header vertial, but not horizontal
// overScrollMode="never" (android) bounces={false} iOS - stops the bounce, helps the scroll look more sync, less janky
// NOTE: Requires, GestureHandlerRootView - either place at root of app, or wrap the component




// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   useAnimatedScrollHandler,
// } from 'react-native-reanimated';
//
// const CELL_WIDTH = 100;
// const CELL_HEIGHT = 50;
// const HEADER_WIDTH = 120;
// const HEADER_HEIGHT = 50;
//
// // Mock data
// const DATES = [
//   'Mon 1', 'Tue 2', 'Wed 3', 'Thu 4', 'Fri 5', 'Sat 6', 'Sun 7', 'Mon 8',
//   'Tue 9', 'Wed 10', 'Thu 11', 'Fri 12',
// ];
// const SPORTS = [
//   'Soccer', 'Basketball', 'Tennis', 'Baseball', 'Hockey', 'Volleyball',
//   'Swimming', 'Athletics', 'Cycling', 'Rugby', 'Netball', 'Running', 'Sprinting',
//   'Ult Frisbee', 'Cricket', 'Table Tennis', 'Archery', 'Badminton'
// ];
// const DATA = SPORTS.map((sport, i) =>
//   DATES.map((_date, j) => `${sport[0]}${i}-${j}`)
// );
//
// export default function StickyTable() {
//   const scrollX = useSharedValue(0);
//   const scrollY = useSharedValue(0);
//
//   // Runs on the UI thread
//   const scrollHandlerX = useAnimatedScrollHandler({
//     onScroll: (event) => {
//       scrollX.value = event.contentOffset.x;
//     },
//   });
//   const scrollHandlerY = useAnimatedScrollHandler({
//     onScroll: (event) => {
//       scrollY.value = event.contentOffset.y;
//     },
//   });
//
//   // Sync the "scroll" position of the date header with the body
//   const colHeaderStyle = useAnimatedStyle(() => ({
//     transform: [{ translateX: -scrollX.value }],
//   }));
//   // Sync the "scroll" position of the sports header with the body
//   const rowHeaderStyle = useAnimatedStyle(() => ({
//     transform: [{ translateY: -scrollY.value }],
//   }));
//
//   return (
//     <View style={styles.container}>
//       {/* Top row - blank corner + dates header */}
//       <View style={styles.topRow}>
//         {/* Blank corner cell - top left */}
//         <View style={styles.cornerCell}></View>
//
//         {/* Dates header — clipped so overflow is hidden, translated by scrollX */}
//         <View style={styles.colHeaderClip}>
//           <Animated.View style={[styles.headerRow, colHeaderStyle]}>
//             {DATES.map((date) => (
//               <View key={date} style={styles.headerCell}>
//                 <Text style={styles.headerText}>{date}</Text>
//               </View>
//             ))}
//           </Animated.View>
//         </View>
//       </View>
//
//       {/* Sports header + content grid */}
//       <View style={styles.bottomRow}>
//         {/* Sports header — clipped so overflow is hidden, translated by scrollY */}
//         <View style={styles.rowHeaderClip}>
//           <Animated.View style={rowHeaderStyle}>
//             {SPORTS.map((sport) => (
//               <View key={sport} style={styles.rowHeaderCell}>
//                 <Text style={styles.headerText}>{sport}</Text>
//               </View>
//             ))}
//           </Animated.View>
//         </View>
//
//         {/* Content Grid */}
//         <Animated.ScrollView
//           horizontal
//           onScroll={scrollHandlerX}
//           overScrollMode="never"
//           scrollEventThrottle={16}
//         >
//           <Animated.ScrollView
//             onScroll={scrollHandlerY}
//             overScrollMode="never"
//             scrollEventThrottle={16}
//             nestedScrollEnabled={true}
//           >
//             {DATA.map((row, rowIndex) => (
//               <View key={rowIndex} style={styles.bodyRow}>
//                 {row.map((cell, colIndex) => (
//                   <View key={colIndex} style={styles.cell}>
//                     <Text style={styles.cellText}>{cell}</Text>
//                   </View>
//                 ))}
//               </View>
//             ))}
//           </Animated.ScrollView>
//         </Animated.ScrollView>
//       </View>
//     </View>
//   );
// }
//
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   topRow: {
//     flexDirection: 'row',
//   },
//   bottomRow: {
//     flexDirection: 'row',
//     flex: 1,
//   },
//   cornerCell: {
//     width: HEADER_WIDTH,
//     height: HEADER_HEIGHT,
//     backgroundColor: '#2c3e50',
//   },
//   cornerText: {
//     color: '#fff',
//     fontSize: 11,
//     fontWeight: 'bold',
//   },
//   headerRow: {
//     flexDirection: 'row',
//   },
//   colHeaderClip: {
//     flex: 1,
//     overflow: 'hidden', // Stop overflowing the blank corner, z-index on cornerCell also works
//   },
//   rowHeaderClip: {
//     width: HEADER_WIDTH,
//     overflow: 'hidden', // Stop overflowing the blank corner, z-index on cornerCell also works
//   },
//   headerCell: {
//     width: CELL_WIDTH,
//     height: HEADER_HEIGHT,
//     backgroundColor: '#34495e',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRightWidth: 1,
//     borderColor: '#2c3e50',
//   },
//   rowHeaderCell: {
//     width: HEADER_WIDTH,
//     height: CELL_HEIGHT,
//     backgroundColor: '#34495e',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderBottomWidth: 1,
//     borderColor: '#2c3e50',
//   },
//   headerText: {
//     color: '#fff',
//     fontWeight: 'bold',
//     fontSize: 13,
//   },
//   bodyRow: {
//     flexDirection: 'row',
//   },
//   cell: {
//     width: CELL_WIDTH,
//     height: CELL_HEIGHT,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRightWidth: 1,
//     borderBottomWidth: 1,
//     borderColor: '#ddd',
//   },
//   cellText: {
//     fontSize: 13,
//     color: '#333',
//   },
// });
//



// WORKIGN BUT NEEDS CELL_WIDTH + CELL_HEIGHT - not reusable

// import React from 'react';
// import { View, Text, StyleSheet, Dimensions, useWindowDimensions } from 'react-native';
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   clamp,
//   withDecay,
//   withSpring
// } from 'react-native-reanimated';
// import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
//
// const CELL_WIDTH = 100;
// const CELL_HEIGHT = 50;
// const HEADER_WIDTH = 120;
// const HEADER_HEIGHT = 50;
//
// const DATES = ['Mon 1', 'Tue 2', 'Wed 3', 'Thu 4', 'Fri 5', 'Sat 6', 'Sun 7',
//   'Mon 8', 'Tue 9', 'Wed 10', 'Thu 11', 'Fri 12'];
//
// const SPORTS = [
//   'Soccer', 'Basketball', 'Tennis', 'Baseball', 'Hockey', 'Volleyball',
//   'Swimming', 'Athletics', 'Cycling', 'Rugby', 'Netball', 'Running', 'Sprinting',
//   'Ult Frisbee', 'Cricket', 'Table Tennis', 'Archery', 'Badminton'
// ];
//
// const DATA = SPORTS.map((sport, i) =>
//   DATES.map((_date, j) => `${sport[0]}${i}-${j}`)
// );
//
// // const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// //
// // // Total content size
// // const CONTENT_WIDTH = DATES.length * CELL_WIDTH;
// // const CONTENT_HEIGHT = SPORTS.length * CELL_HEIGHT;
// //
// // // Max scroll bounds
// // const MAX_SCROLL_X = CONTENT_WIDTH - (SCREEN_WIDTH - HEADER_WIDTH);
// // const MAX_SCROLL_Y = CONTENT_HEIGHT - (SCREEN_HEIGHT - HEADER_HEIGHT);
//
// export default function StickyTable() {
//   const { width: windowWidth } = useWindowDimensions();
//
//   const [bodyHeight, setBodyHeight] = React.useState(0);
//   const [bodyWidth, setBodyWidth] = React.useState(0);
//
//   const CONTENT_WIDTH = DATES.length * CELL_WIDTH;
//   const CONTENT_HEIGHT = SPORTS.length * CELL_HEIGHT;
//
//   const maxScrollX = Math.max(0, CONTENT_WIDTH - bodyWidth);
//   const maxScrollY = Math.max(0, CONTENT_HEIGHT - bodyHeight);
//
//   const scrollX = useSharedValue(0);
//   const scrollY = useSharedValue(0);
//   // Snapshot of offset at gesture start
//   const startX = useSharedValue(0);
//   const startY = useSharedValue(0);
//
//   const lockedAxis = useSharedValue(0); // 0 = unlocked, 1 = x, 2 = y
//   const AXIS_LOCK_THRESHOLD = 5; // pixels before we commit to an axis
//   //
//   // const pan = Gesture.Pan()
//   //   .onBegin(() => {
//   //     startX.value = scrollX.value;
//   //     startY.value = scrollY.value;
//   //     lockedAxis.value = 0;
//   //   })
//   //   .onUpdate((e) => {
//   //     if (lockedAxis.value === 0) {
//   //       const absX = Math.abs(e.translationX);
//   //       const absY = Math.abs(e.translationY);
//   //
//   //       // Wait until movement is large enough to determine intent
//   //       if (absX < AXIS_LOCK_THRESHOLD && absY < AXIS_LOCK_THRESHOLD) return;
//   //
//   //       lockedAxis.value = absX > absY ? 1 : 2;
//   //     }
//   //
//   //     if (lockedAxis.value === 1) {
//   //       scrollX.value = clamp(startX.value - e.translationX, 0, MAX_SCROLL_X);
//   //     } else if (lockedAxis.value === 2) {
//   //       scrollY.value = clamp(startY.value - e.translationY, 0, MAX_SCROLL_Y);
//   //     }
//   //   })
//   //   .onEnd((e) => {
//   //     if (lockedAxis.value === 1) {
//   //       scrollX.value = withDecay({ velocity: -e.velocityX, clamp: [0, MAX_SCROLL_X] });
//   //     } else if (lockedAxis.value === 2) {
//   //       scrollY.value = withDecay({ velocity: -e.velocityY, clamp: [0, MAX_SCROLL_Y] });
//   //     }
//   //     lockedAxis.value = 0;
//   //   });
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
//         scrollX.value = clamp(startX.value - e.translationX, 0, maxScrollX);
//       } else if (lockedAxis.value === 2) {
//         scrollY.value = clamp(startY.value - e.translationY, 0, maxScrollY);
//       }
//     })
//     .onEnd((e) => {
//       if (lockedAxis.value === 1) {
//         scrollX.value = withDecay({ velocity: -e.velocityX, clamp: [0, maxScrollX] });
//       } else if (lockedAxis.value === 2) {
//         scrollY.value = withDecay({ velocity: -e.velocityY, clamp: [0, maxScrollY] });
//       }
//       lockedAxis.value = 0;
//     });
//
//
//   // const BOUNCE_OVERSHOOT_PX = 20;        // how far past the edge you can drag
//   // const AXIS_LOCK_THRESHOLD_PX = 5;      // min movement before axis is decided
//   //
//   // const SPRING_DAMPING = 20000;             // higher = less oscillation (try 20–50)
//   // const SPRING_STIFFNESS = 9000;          // higher = snaps back faster (try 200–400)
//   //
//   // const pan = Gesture.Pan()
//   //   .onBegin(() => {
//   //     startX.value = scrollX.value;
//   //     startY.value = scrollY.value;
//   //     lockedAxis.value = 0;
//   //   })
//   //   .onUpdate((e) => {
//   //     // Wait until gesture is clear enough to determine axis
//   //     if (lockedAxis.value === 0) {
//   //       const absX = Math.abs(e.translationX);
//   //       const absY = Math.abs(e.translationY);
//   //       if (absX < AXIS_LOCK_THRESHOLD_PX && absY < AXIS_LOCK_THRESHOLD_PX) return;
//   //       lockedAxis.value = absX > absY ? 1 : 2;
//   //     }
//   //
//   //     if (lockedAxis.value === 1) {
//   //       scrollX.value = clamp(
//   //         startX.value - e.translationX,
//   //         -BOUNCE_OVERSHOOT_PX,
//   //         MAX_SCROLL_X + BOUNCE_OVERSHOOT_PX
//   //       );
//   //     } else if (lockedAxis.value === 2) {
//   //       scrollY.value = clamp(
//   //         startY.value - e.translationY,
//   //         -BOUNCE_OVERSHOOT_PX,
//   //         MAX_SCROLL_Y + BOUNCE_OVERSHOOT_PX
//   //       );
//   //     }
//   //   })
//   //   .onEnd((e) => {
//   //     if (lockedAxis.value === 1) {
//   //       scrollX.value = withDecay(
//   //         {
//   //           velocity: -e.velocityX,
//   //           clamp: [-BOUNCE_OVERSHOOT_PX, MAX_SCROLL_X + BOUNCE_OVERSHOOT_PX],
//   //         },
//   //         () => {
//   //           'worklet';
//   //           const isOutOfBounds = scrollX.value < 0 || scrollX.value > MAX_SCROLL_X;
//   //           if (isOutOfBounds) {
//   //             const nearestBound = scrollX.value < 0 ? 0 : MAX_SCROLL_X;
//   //             scrollX.value = withSpring(nearestBound, {
//   //               damping: SPRING_DAMPING,
//   //               stiffness: SPRING_STIFFNESS,
//   //             });
//   //           }
//   //         }
//   //       );
//   //     } else if (lockedAxis.value === 2) {
//   //       scrollY.value = withDecay(
//   //         {
//   //           velocity: -e.velocityY,
//   //           clamp: [-BOUNCE_OVERSHOOT_PX, MAX_SCROLL_Y + BOUNCE_OVERSHOOT_PX],
//   //         },
//   //         () => {
//   //           'worklet';
//   //           const isOutOfBounds = scrollY.value < 0 || scrollY.value > MAX_SCROLL_Y;
//   //           if (isOutOfBounds) {
//   //             const nearestBound = scrollY.value < 0 ? 0 : MAX_SCROLL_Y;
//   //             scrollY.value = withSpring(nearestBound, {
//   //               damping: SPRING_DAMPING,
//   //               stiffness: SPRING_STIFFNESS,
//   //             });
//   //           }
//   //         }
//   //       );
//   //     }
//   //     lockedAxis.value = 0;
//   //   });
//
//
//   // const pan = Gesture.Pan()
//   //   .onBegin(() => {
//   //     startX.value = scrollX.value;
//   //     startY.value = scrollY.value;
//   //   })
//   //   .onUpdate((e) => {
//   //     scrollX.value = clamp(startX.value - e.translationX, 0, MAX_SCROLL_X);
//   //     scrollY.value = clamp(startY.value - e.translationY, 0, MAX_SCROLL_Y);
//   //   });
//
//   // Body content shifts opposite to scroll offset
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
//       {/* Top row: corner + dates header */}
//       <View style={styles.topRow}>
//         <View style={[styles.cornerCell, { width: HEADER_WIDTH, height: HEADER_HEIGHT }]}>
//           <Text style={styles.cornerText}>Sport / Date</Text>
//         </View>
//         <View style={styles.colHeaderClip}>
//           <Animated.View style={[styles.headerRow, colHeaderStyle]}>
//             {DATES.map((date) => (
//               <View key={date} style={[styles.headerCell, { width: CELL_WIDTH, height: HEADER_HEIGHT }]}>
//                 <Text style={styles.headerText}>{date}</Text>
//               </View>
//             ))}
//           </Animated.View>
//         </View>
//       </View>
//
//       {/* Bottom row: sports column + body */}
//       <View style={styles.bottomRow}>
//         {/* Sports sticky column */}
//         <View style={[styles.rowHeaderClip, { width: HEADER_WIDTH }]}>
//           <Animated.View style={rowHeaderStyle}>
//             {SPORTS.map((sport) => (
//               <View key={sport} style={[styles.rowHeaderCell, { width: HEADER_WIDTH, height: CELL_HEIGHT }]}>
//                 <Text style={styles.headerText}>{sport}</Text>
//               </View>
//             ))}
//           </Animated.View>
//         </View>
//
//         {/* Body — gesture controlled */}
//         <GestureDetector gesture={pan}>
//           <View
//             style={styles.bodyClip}
//             onLayout={(e) => {
//               setBodyWidth(e.nativeEvent.layout.width);
//               setBodyHeight(e.nativeEvent.layout.height);
//             }}
//           >
//
//             <Animated.View style={bodyStyle}>
//               {DATA.map((row, rowIndex) => (
//                 <View key={rowIndex} style={styles.bodyRow}>
//                   {row.map((cell, colIndex) => (
//                     <View key={colIndex} style={[styles.cell, { width: CELL_WIDTH, height: CELL_HEIGHT }]}>
//                       <Text style={styles.cellText}>{cell}</Text>
//                     </View>
//                   ))}
//                 </View>
//               ))}
//             </Animated.View>
//           </View>
//         </GestureDetector>
//       </View>
//     </GestureHandlerRootView>
//   );
// }
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





// import React, { useState, useCallback, useEffect } from 'react';
// import { Platform, View, Text, StyleSheet } from 'react-native';
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   useAnimatedScrollHandler,
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
// function useStickyScroll() {
//   const scrollX = useSharedValue(0);
//   const scrollY = useSharedValue(0);
//   const maxScrollX = useSharedValue(0);
//   const maxScrollY = useSharedValue(0);
//
//   // Called when the visible body area is measured
//   const onBodyLayout = useCallback((e) => {
//     const { width, height } = e.nativeEvent.layout;
//     maxScrollX.value = Math.max(0, maxScrollX.value - width);
//     maxScrollY.value = Math.max(0, maxScrollY.value - height);
//   }, []);
//
//   // Called when the full content area is measured
//   const onContentLayout = useCallback((e) => {
//     const { width, height } = e.nativeEvent.layout;
//     maxScrollX.value = width;
//     maxScrollY.value = height;
//   }, []);
//
//   return { scrollX, scrollY, maxScrollX, maxScrollY, onBodyLayout, onContentLayout };
// }
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
//   // Store measured sizes as shared values so the worklet can read them
//   const maxScrollX = useSharedValue(0);
//   const maxScrollY = useSharedValue(0);
//   const contentWidth = useSharedValue(0);
//   const contentHeight = useSharedValue(0);
//   const bodyWidth = useSharedValue(0);
//   const bodyHeight = useSharedValue(0);
//
//   useEffect(() => {
//     contentWidth.value = columnHeaders.length * cellWidth;
//     contentHeight.value = rowHeaders.length * cellHeight;
//     // Recompute max if bodySize is already known
//     maxScrollX.value = Math.max(0, contentWidth.value - bodyWidth.value);
//     maxScrollY.value = Math.max(0, contentHeight.value - bodyHeight.value);
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
//         {/* Body clip — measures visible area */}
//         <View style={styles.bodyClip} onLayout={onBodyLayout}>
//             <Animated.View style={bodyStyle}>
//               {data.map((row, rowIndex) => (
//                 <View key={rowIndex} style={styles.bodyRow}>
//                   {row.map((cell, colIndex) => (
//                     <View key={colIndex} style={[styles.cell, { width: cellWidth, height: cellHeight }]}>
//                       {renderCell(cell, rowIndex, colIndex)}
//                     </View>
//                   ))}
//                 </View>
//               ))}
//             </Animated.View>
//
//           {/* Gesture layer sits on top, covers the clip area */}
//           <GestureDetector gesture={pan}>
//             <View style={StyleSheet.absoluteFill} />
//           </GestureDetector>
//         </View>
//       </View>
//     </GestureHandlerRootView>
//   );
// }
//
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





/// Clean but I broke the x sroll :((((
import React from 'react';
import { Text, View, StyleSheet, ViewStyle, StyleProp, LayoutChangeEvent } from 'react-native';
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
          style={[styles.body, styles.clip]}
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
  main: {
    flexDirection: 'row',
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  colHeaderClip: {
    flex: 1,
    overflow: 'hidden',
  },
  rowHeaderClip: {
    overflow: 'hidden',
  },
  body: {
    flex: 1,
  },
  cornerCell: {
    backgroundColor: '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
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
