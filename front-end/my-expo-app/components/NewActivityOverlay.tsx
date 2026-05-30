import { useState } from 'react';
import {
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Input from './Input';
import Button from './Button';
import CategorySelect from './CategorySelect';
import { ThemedText } from './themed-text';
import { activitiesAPI, type IActivity, type ICategory } from '@/api/api.activity';

function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface NewActivityOverlayProps {
  onClose: (activity?: IActivity) => void;
}

export default function NewActivityOverlay({ onClose }: NewActivityOverlayProps) {
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [interval, setInterval] = useState('');
  const [lastDoneDate, setLastDoneDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // TODO: Fetch categories list from server
  const [categories, setCategories] = useState<ICategory[]>([
    { name: 'Sprint', color: 'green' },
    { name: 'Jump', color: 'red' },
    { name: 'BB', color: 'blue' },
  ]);

  function addCategory(category: ICategory) {
    setCategories((prev) => [...prev, category]);
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
    });

    if (response.error) {
      setErrorMessage(response.error.message);
      setIsLoading(false);
      return;
    }

    onClose(response.data?.activity);
  }

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={() => onClose()}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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

            <Input label="Name" placeholder="Name" value={name} onChangeText={setName} />
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
            />
            <ThemedText style={styles.dateLabel}>Last Done (optional)</ThemedText>
            <TouchableOpacity
              style={styles.dateField}
              onPress={() => setShowDatePicker(true)}
            >
              <ThemedText style={lastDoneDate ? styles.dateValue : styles.datePlaceholder}>
                {lastDoneDate ? formatDateISO(lastDoneDate) : 'Select date'}
              </ThemedText>
            </TouchableOpacity>
            {lastDoneDate ? (
              <TouchableOpacity onPress={clearLastDone} style={styles.clearDateButton}>
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
                  <Button onPress={() => setShowDatePicker(false)} style={styles.datePickerDone}>
                    Done
                  </Button>
                ) : null}
              </>
            )}

            {errorMessage ? (
              <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
            ) : null}

            <Button isLoading={isLoading} style={styles.submitButton} onPress={handleSubmit}>
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
    backgroundColor: '#fff',
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
  errorText: {
    color: '#ff3333',
    marginBottom: 12,
  },
  submitButton: {
    marginTop: 8,
  },
  dateLabel: {
    marginBottom: 8,
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
  dateField: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  dateValue: {
    fontSize: 16,
    color: '#333',
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
    color: '#0072ff',
  },
  datePickerDone: {
    marginBottom: 16,
  },
});
