import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import Label from '@/components/base/label';
import InputErrorMessage from '@/components/base/input-error-message.tsx';
import { ThemedText } from '@/components/base/themed-text';
import type { ActivityFormValues } from '../activities/activity-schema';

const GOAL_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'No goal' },
  ...Array.from({ length: 7 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1} ${i === 0 ? 'Time' : 'Times'} Per Week`,
  })),
];

export default function ActivityGoalField() {
  const { control } = useFormContext<ActivityFormValues>();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Controller
      control={control}
      name="goalTargetPerWeek"
      render={({ field, fieldState }) => {
        const selected = GOAL_OPTIONS.find(
          (option) => option.value === field.value,
        );

        return (
          <View style={styles.wrapper}>
            <Label>How often do you want to do this?</Label>
            <Pressable
              onPress={() => setIsOpen((open) => !open)}
              style={styles.select}
            >
              <ThemedText
                style={
                  selected?.value === null ? styles.placeholder : undefined
                }
                selectable={false}
              >
                {selected?.label ?? 'No goal'}
              </ThemedText>
              <ThemedText style={styles.arrow} selectable={false}>
                ›
              </ThemedText>
            </Pressable>

            {isOpen && (
              <View style={styles.dropdown}>
                {GOAL_OPTIONS.map((option) => (
                  <Pressable
                    key={String(option.value)}
                    style={styles.dropdownItem}
                    onPress={() => {
                      field.onChange(option.value);
                      setIsOpen(false);
                    }}
                  >
                    <ThemedText>{option.label}</ThemedText>
                  </Pressable>
                ))}
              </View>
            )}

            {fieldState.error?.message && (
              <InputErrorMessage>{fieldState.error.message}</InputErrorMessage>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: 16,
    width: '100%',
    zIndex: 10,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,.055)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  placeholder: {
    color: '#999',
  },
  arrow: {
    fontSize: 20,
    color: '#999',
    transform: [{ rotate: '90deg' }],
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    backgroundColor: 'rgb(22, 50, 81)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
});
