import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { ThemedText } from '@/components/base/themed-text';

export interface FilterListItem {
  id: number;
  name: string;
  color: string;
}

interface FilterListProps {
  label?: string;
  items: FilterListItem[];
  selectedIds: number[];
  onItemPress: (id: number) => void;
  style?: ViewStyle;
  scrollViewStyle?: ViewStyle;
}

export default function FilterList({
  label,
  items,
  selectedIds,
  onItemPress,
  style,
  scrollViewStyle,
}: FilterListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <View style={[style]}>
      {label ? (
        <ThemedText style={styles.title} type="defaultSemiBold">
          {label}
        </ThemedText>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={scrollViewStyle}
      >
        <View style={styles.pillsRow}>
          {items.map((item) => {
            const isActive = selectedIds.includes(item.id);
            return (
              <Pressable key={item.id} onPress={() => onItemPress(item.id)}>
                <ThemedText
                  size="small"
                  type="defaultSemiBold"
                  style={[
                    styles.pill,
                    isActive && {
                      borderWidth: 1.5,
                      borderColor: `${item.color}88`,
                      backgroundColor: `${item.color}1A`,
                      color: item.color,
                    },
                  ]}
                >
                  {item.name}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    opacity: 0.6,
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 13,
  },
  pillsRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 4,
    paddingBottom: 1,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,.055)',
    color: '#f5f7fbcc',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.1)',
    paddingHorizontal: 14,
    paddingVertical: 3,
    borderRadius: 16,
    fontSize: 13,
  },
});
