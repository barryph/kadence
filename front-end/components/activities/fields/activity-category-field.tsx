import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import Ionicons from '@expo/vector-icons/Ionicons';
import Label from '@/components/base/label';
import InputErrorMessage from '@/components/base/input-error-message.tsx';
import { ThemedText } from '@/components/base/themed-text';
import { Colors, Spacing, withAlpha } from '@/constants/theme';
import CreateCategoryModal from '@/components/categories/create-category-modal';
import Dot from '@/components/dot';
import type { ICategory } from '@/api/api.categories';
import type { ActivityFormValues } from '../activity-schema';
import { useSheetBackHandler } from '@/hooks/use-sheet-back-handler';

interface Props {
  categories: ICategory[];
}

export default function ActivityCategoryField({ categories }: Props) {
  const { control } = useFormContext<ActivityFormValues>();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const dismissSheet = useCallback(() => sheetRef.current?.dismiss(), []);
  const onSheetChange = useSheetBackHandler(dismissSheet);

  // Backdrop allows us to close the modal on outside click
  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} />,
    [],
  );

  return (
    <Controller
      control={control}
      name="categoryId"
      render={({ field, fieldState }) => {
        const selected = categories.find(
          (category) => category.id === field.value,
        );

        const selectCategory = (category: ICategory) => {
          field.onChange(category.id);
          sheetRef.current?.dismiss();
        };

        return (
          <View style={styles.wrapper}>
            <Label>Category</Label>
            <Pressable
              testID="activity-category-select"
              onPress={() => sheetRef.current?.present()}
              style={styles.select}
              accessibilityRole="button"
              accessibilityLabel="Category"
            >
              {selected ? (
                <View style={styles.selectedRow}>
                  <Dot backgroundColor={selected.color} />
                  <ThemedText selectable={false}>{selected.name}</ThemedText>
                </View>
              ) : (
                <ThemedText style={styles.placeholderText} selectable={false}>
                  Choose a Category
                </ThemedText>
              )}
              <ThemedText size="2xl" style={styles.arrow} selectable={false}>
                ›
              </ThemedText>
            </Pressable>

            {selected && (
              <Pressable
                onPress={() => field.onChange(null)}
                style={styles.clearCategoryButton}
                accessibilityRole="button"
              >
                <ThemedText variant="bodySmall">Clear category</ThemedText>
              </Pressable>
            )}

            {fieldState.error?.message && (
              <InputErrorMessage>{fieldState.error.message}</InputErrorMessage>
            )}

            <BottomSheetModal
              ref={sheetRef}
              index={0}
              onChange={onSheetChange}
              snapPoints={['60%']}
              backgroundStyle={styles.sheetBackground}
              handleIndicatorStyle={styles.sheetHandle}
              backdropComponent={renderBackdrop}
            >
              <BottomSheetScrollView
                contentContainerStyle={styles.sheetContent}
              >
                <Pressable
                  style={styles.createButton}
                  onPress={() => setShowCreateCategoryModal(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Create Category"
                >
                  <ThemedText variant="bodyStrong">
                    + Create Category
                  </ThemedText>
                </Pressable>

                {categories.length === 0 ? (
                  <ThemedText style={styles.emptyText}>
                    No categories yet. Create one above.
                  </ThemedText>
                ) : (
                  categories.map((category) => {
                    const isSelected = category.id === field.value;
                    return (
                      <Pressable
                        key={String(category.id ?? category.name)}
                        testID={`activity-category-option-${category.id ?? category.name}`}
                        style={styles.sheetItem}
                        onPress={() => selectCategory(category)}
                        accessibilityRole="button"
                        accessibilityLabel={category.name}
                        accessibilityState={{ selected: isSelected }}
                      >
                        <Dot backgroundColor={category.color} />
                        <ThemedText
                          style={styles.sheetItemText}
                          variant={isSelected ? 'bodyStrong' : 'body'}
                        >
                          {category.name}
                        </ThemedText>
                        {isSelected && (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color={Colors.textPrimary}
                          />
                        )}
                      </Pressable>
                    );
                  })
                )}
              </BottomSheetScrollView>
            </BottomSheetModal>

            {showCreateCategoryModal && (
              <CreateCategoryModal
                onSave={(category) => {
                  setShowCreateCategoryModal(false);
                  field.onChange(category.id);
                  sheetRef.current?.dismiss();
                }}
                onClose={() => setShowCreateCategoryModal(false)}
              />
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing['2xl'],
    width: '100%',
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surfaceTranslucent,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  placeholderText: {
    color: Colors.textMuted,
    flex: 1,
  },
  arrow: {
    color: Colors.textMuted,
    transform: [{ rotate: '90deg' }],
  },
  clearCategoryButton: {
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  sheetBackground: {
    backgroundColor: Colors.surfaceSelected,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sheetHandle: {
    backgroundColor: withAlpha(Colors.textPrimary, 0.3),
  },
  sheetContent: {
    paddingVertical: Spacing.md,
    paddingBottom: Spacing['4xl'],
  },
  createButton: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.xl,
    color: Colors.textMuted,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.xl,
  },
  sheetItemText: {
    flex: 1,
  },
});
