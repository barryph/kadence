import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { ThemedText } from '@/components/base/themed-text';
import { Colors, Spacing } from '@/constants/theme';

export interface FilterListItem {
  id: number;
  name: string;
  color: string;
}

interface FilterListProps {
  label?: string;
  items: FilterListItem[];
  selectedIds: number | null;
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
        <ThemedText style={styles.title} variant="eyebrow">
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
            const isActive = selectedIds === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => onItemPress(item.id)}
                // A filter pill is a toggle, so expose it as a button that is
                // either selected or not, and keep a 44pt-ish touch target
                // around the 26pt visual pill.
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={item.name}
                hitSlop={8}
              >
                <ThemedText
                  variant="bodySmall"
                  weight="600"
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
    marginBottom: 7,
  },
  pillsRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingBottom: 1,
  },
  pill: {
    backgroundColor: Colors.surfaceTranslucent,
    color: Colors.textFaint,
    borderWidth: 1,
    borderColor: Colors.borderFaint,
    paddingHorizontal: 14,
    paddingVertical: 3,
    borderRadius: 16,
  },
});
