import { useEffect, useState } from 'react';
import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import Input from './input';
import Button from './button';
import CategorySelect from './category-select';
import { ThemedText } from './themed-text';
import {
  activitiesAPI,
  type IActivity,
  type ICategory,
} from '@/api/api.activity';
import Background from './backgrounds/background';
import AlertError from './alerts/alert-error';
import { categoriesAPI } from '@/api/api.categories';

function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface NewActivityOverlayProps {
  onClose: (activity?: IActivity) => void;
}

export default function NewActivityOverlay({
  onClose,
}: NewActivityOverlayProps) {
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [interval, setInterval] = useState('');
  const [category, setCategory] = useState<ICategory | null>(null);
  const [lastDoneDate, setLastDoneDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // TODO: Add clear category button
  const [categories, setCategories] = useState<ICategory[]>([
    // { name: 'Sprint', color: 'green' },
    // { name: 'Jump', color: 'red' },
    // { name: 'BB', color: 'blue' },
  ]);

  // Fetch categories
  useEffect(() => {
    const abortController = new AbortController();

    async function fetchCategories() {
      console.log('fetching categories');
      try {
        const response = await categoriesAPI.getAllByUser({
          signal: abortController.signal,
        });
        if (response.data?.categories) {
          setCategories(response.data.categories as ICategory[]);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching activities', err);
        setIsLoading(false);
      }
    }

    fetchCategories();
    return () => abortController.abort();
  }, []);

  function addCategory(category: ICategory) {
    setCategories((prev) => [...prev, category]);
  }

  function handleSelectCategory(category: ICategory) {
    setCategory(category);
  }

  function handleLastDoneChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'dismissed') {
      return;
    }
    if (date) {
      setLastDoneDate(date);
    }
  }

  function clearLastDone() {
    setLastDoneDate(null);
    setShowDatePicker(false);
  }

  async function handleSubmit() {
    setIsLoading(true);
    setErrorMessage(null);

    const response = await activitiesAPI.createActivity({
      name,
      ticker: ticker || undefined,
      interval: Number.parseInt(interval, 10),
      lastDone: lastDoneDate ? formatDateISO(lastDoneDate) : undefined,
      ...(category && {
        categoryId: category.id,
      }),
    });

    if (response.error) {
      setErrorMessage(response.error.message);
      setIsLoading(false);
      return;
    }

    onClose(response.data?.activity);
  }

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => onClose()}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Background showRed={false} />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => onClose()}
            accessibilityLabel="Close"
          >
            <ThemedText style={styles.closeButtonText}>✕</ThemedText>
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <ThemedText type="title" style={styles.title}>
              New activity
            </ThemedText>

            <Input
              label="Name"
              placeholder="Name"
              value={name}
              onChangeText={setName}
            />
            <Input
              label="Ticker (optional)"
              placeholder="Ticker"
              value={ticker}
              onChangeText={setTicker}
            />
            <Input
              label="Interval (days)"
              placeholder="Interval (days)"
              value={interval}
              onChangeText={setInterval}
              keyboardType="number-pad"
            />
            <CategorySelect
              label="Category (optional)"
              placeholder="Choose a Category"
              options={categories}
              onCreate={addCategory}
              onSelect={handleSelectCategory}
            />
            <ThemedText type="defaultSemiBold" style={styles.dateLabel}>
              Last Done (optional)
            </ThemedText>
            <TouchableOpacity
              style={styles.dateField}
              onPress={() => setShowDatePicker(true)}
            >
              <ThemedText
                style={lastDoneDate ? styles.dateValue : styles.datePlaceholder}
              >
                {lastDoneDate ? formatDateISO(lastDoneDate) : 'Select date'}
              </ThemedText>
            </TouchableOpacity>
            {lastDoneDate ? (
              <TouchableOpacity
                onPress={clearLastDone}
                style={styles.clearDateButton}
              >
                <ThemedText style={styles.clearDateText}>Clear date</ThemedText>
              </TouchableOpacity>
            ) : null}
            {showDatePicker && (
              <>
                <DateTimePicker
                  value={lastDoneDate ?? new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onChange={handleLastDoneChange}
                />
                {Platform.OS === 'ios' ? (
                  <Button
                    onPress={() => setShowDatePicker(false)}
                    style={styles.datePickerDone}
                  >
                    Done
                  </Button>
                ) : null}
              </>
            )}

            {errorMessage ? (
              <View style={{ marginTop: 10 }}>
                <AlertError>{errorMessage}</AlertError>
              </View>
            ) : null}

            <Button
              isLoading={isLoading}
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              Create
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  closeButtonText: {
    fontSize: 28,
    opacity: 0.4,
    lineHeight: 28,
  },
  title: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 20,
  },
  dateLabel: {
    marginBottom: 8,
    fontSize: 14,
    lineHeight: 22,
    color: '#fff',
  },
  dateField: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,.055)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  dateValue: {
    fontSize: 16,
    color: '#fff',
  },
  datePlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  clearDateButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  clearDateText: {
    fontSize: 14,
    color: '#fff',
  },
  datePickerDone: {
    marginBottom: 16,
  },
});
