import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useDerivedValue,
  useAnimatedRef,
  scrollTo,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';

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

export default function StickyTableTwo<TCell, TColumn, TRow>({
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

  const columnHeaderRef = useAnimatedRef();
  const rowHeaderRef = useAnimatedRef();

  // Sync the "scroll" position of the headers with the body
  useDerivedValue(() => {
    scrollTo(columnHeaderRef, scrollX.value, 0, false);
  });
  useDerivedValue(() => {
    scrollTo(rowHeaderRef, 0, scrollY.value, false);
  });

  return (
    <View style={styles.container}>
      {/* Top row: corner + horizontal sticky header */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.cornerCell,
            { width: headerWidth, height: headerHeight },
          ]}
        >
          {renderCorner?.()}
        </View>

        {/* Top Header */}
        <View style={styles.colHeaderClip}>
          <Animated.ScrollView
            ref={columnHeaderRef}
            style={[styles.row]}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
          >
            {columnHeaders.map((column, index) => (
              <View
                key={index}
                style={[
                  styles.colHeaderCell,
                  { width: cellWidth, height: headerHeight },
                ]}
              >
                {renderColumnHeader(column, index)}
              </View>
            ))}
          </Animated.ScrollView>
        </View>
      </View>

      {/* Main - vertical sticky header + scrollable body */}
      <View style={styles.main}>
        {/* Left Header */}
        <View style={[styles.rowHeaderClip, { width: headerWidth }]}>
          <Animated.ScrollView
            ref={rowHeaderRef}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          >
            {rowHeaders.map((row, index) => (
              <View
                key={index}
                style={[
                  styles.rowHeaderCell,
                  { width: headerWidth, height: cellHeight },
                ]}
              >
                {renderRowHeader(row, index)}
              </View>
            ))}
          </Animated.ScrollView>
        </View>

        {/* Scrollable body */}
        <Animated.ScrollView horizontal onScroll={scrollHandlerX}>
          <Animated.ScrollView
            onScroll={scrollHandlerY}
            nestedScrollEnabled={true}
          >
            {data.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((cell, index) => (
                  <View
                    key={index}
                    style={[
                      styles.cell,
                      { width: cellWidth, height: cellHeight },
                    ]}
                  >
                    {renderCell(cell, rowIndex, index)}
                  </View>
                ))}
              </View>
            ))}
          </Animated.ScrollView>
        </Animated.ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  colHeaderClip: {
    overflow: 'hidden',
    flex: 1,
  },
  rowHeaderClip: {
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
