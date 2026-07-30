import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { ThemedText } from '@/components/base/themed-text';
import type { ICategory } from '@/api/api.categories';

interface FilterListProps {
  label?: string;
  categories: ICategory[];
  activeCategoryId: number | null;
  onCategoryPress: (categoryId: number) => void;
  style?: ViewStyle;
}

export default function FilterList({
  label,
  categories,
  activeCategoryId,
  onCategoryPress,
  style,
}: FilterListProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <View style={[style]}>
      {label && (
        <ThemedText style={styles.title} type="defaultSemiBold">
          {label}
        </ThemedText>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.pillsRow}>
          {categories.map((category) => {
            const isActive = activeCategoryId === category.id;
            return (
              <Pressable
                key={category.id}
                onPress={() => onCategoryPress(category.id!)}
              >
                <ThemedText
                  size="small"
                  type="defaultSemiBold"
                  style={[
                    styles.categoryPill,
                    isActive && {
                      borderWidth: 1.5,
                      borderColor: `${category.color}88`,
                      backgroundColor: `${category.color}1A`,
                      color: category.color,
                    },
                  ]}
                >
                  {category.name}
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
    // fixes visual bug on android where the bottom border of each category pill is cut off
    paddingBottom: 1,
  },
  categoryPill: {
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
