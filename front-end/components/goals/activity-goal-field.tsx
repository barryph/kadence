import { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import Ionicons from '@expo/vector-icons/Ionicons';
import Label from '@/components/base/label';
import InputErrorMessage from '@/components/base/input-error-message.tsx';
import { ThemedText } from '@/components/base/themed-text';
import { Colors, Spacing, withAlpha } from '@/constants/theme';
import type { ActivityFormValues } from '../activities/activity-schema';
import { useSheetBackHandler } from '@/hooks/use-sheet-back-handler';

const GOAL_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'No goal' },
  ...Array.from({ length: 7 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1} ${i === 0 ? 'Time' : 'Times'} Per Week`,
  })),
];

export default function ActivityGoalField() {
  const { control } = useFormContext<ActivityFormValues>();
  const sheetRef = useRef<BottomSheetModal>(null);

  // Backdrop allows us to close the modal on outside click
  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} />,
    [],
  );

  const dismissSheet = useCallback(() => sheetRef.current?.dismiss(), []);
  const onSheetChange = useSheetBackHandler(dismissSheet);

  return (
    <Controller
      control={control}
      name="goalTargetPerWeek"
      render={({ field, fieldState }) => {
        const selected = GOAL_OPTIONS.find(
          (option) => option.value === field.value,
        );

        const selectOption = (option: (typeof GOAL_OPTIONS)[number]) => {
          field.onChange(option.value);
          sheetRef.current?.dismiss();
        };

        return (
          <View style={styles.wrapper}>
            <Label>How many times per week?</Label>
            <Pressable
              testID="activity-goal-select"
              onPress={() => sheetRef.current?.present()}
              style={styles.select}
              accessibilityRole="button"
              accessibilityLabel="Goal frequency"
            >
              <ThemedText
                style={
                  selected?.value === null ? styles.placeholder : undefined
                }
                selectable={false}
              >
                {selected?.label ?? 'No goal'}
              </ThemedText>
              <ThemedText size="2xl" style={styles.arrow} selectable={false}>
                ›
              </ThemedText>
            </Pressable>

            {fieldState.error?.message && (
              <InputErrorMessage>{fieldState.error.message}</InputErrorMessage>
            )}

            <BottomSheetModal
              ref={sheetRef}
              onChange={onSheetChange}
              index={0}
              snapPoints={['50%']}
              backgroundStyle={styles.sheetBackground}
              handleIndicatorStyle={styles.sheetHandle}
              backdropComponent={renderBackdrop}
            >
              <BottomSheetView style={styles.sheetContent}>
                {GOAL_OPTIONS.map((option) => {
                  const isSelected = option.value === field.value;
                  return (
                    <Pressable
                      key={String(option.value)}
                      testID={`activity-goal-option-${option.value ?? 'none'}`}
                      style={styles.sheetItem}
                      onPress={() => selectOption(option)}
                      accessibilityRole="button"
                      accessibilityLabel={option.label}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <ThemedText
                        style={styles.sheetItemText}
                        variant={isSelected ? 'bodyStrong' : 'body'}
                      >
                        {option.label}
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
                })}
              </BottomSheetView>
            </BottomSheetModal>
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
  placeholder: {
    color: Colors.textMuted,
  },
  arrow: {
    color: Colors.textMuted,
    transform: [{ rotate: '90deg' }],
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
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.xl,
  },
  sheetItemText: {
    flex: 1,
  },
});
