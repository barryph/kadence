import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import AddCategoryModal from './AddCategoryModal';
import type { ICategory } from '@/api/api.activity';

interface CategorySelectProps {
  label?: string;
  placeholder?: string;
  options: ICategory[];
  onCreate: (category: ICategory) => void;
}

export default function CategorySelect({
  label,
  placeholder = 'Choose a category',
  options,
  onCreate,
}: CategorySelectProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ICategory | null>(null);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);

  function handleSave(category: ICategory) {
    setSelectedCategory(category);
    setShowCreateCategoryModal(false);
    setShowDropdown(false);
    onCreate(category);
  }

  function selectCategory(category: ICategory) {
    setSelectedCategory(category);
    setShowDropdown(false);
  }

  return (
    <View style={styles.wrapper}>
      {label && <ThemedText style={styles.label}>{label}</ThemedText>}
      <Pressable
        onPress={() => setShowDropdown((open) => !open)}
        style={[styles.select, !selectedCategory && styles.selectFaint]}
      >
        {selectedCategory ? (
          <View style={styles.selectedRow}>
            <ThemedText style={styles.selectText}>{selectedCategory.name}</ThemedText>
            <View style={[styles.dot, { backgroundColor: selectedCategory.color }]} />
          </View>
        ) : (
          <ThemedText style={styles.placeholderText}>{placeholder}</ThemedText>
        )}
        <ThemedText style={styles.arrow}>›</ThemedText>
      </Pressable>

      {showDropdown && (
        <View style={styles.dropdown}>
          {options.map((option) => (
            <Pressable
              key={option.name}
              onPress={() => selectCategory(option)}
              style={styles.dropdownItem}
            >
              <ThemedText>{option.name}</ThemedText>
              <View style={[styles.dot, { backgroundColor: option.color }]} />
            </Pressable>
          ))}
          <Pressable
            onPress={() => {
              setShowCreateCategoryModal(true);
              setShowDropdown(false);
            }}
            style={styles.dropdownItem}
          >
            <ThemedText type="defaultSemiBold">+ Create Category</ThemedText>
          </Pressable>
        </View>
      )}

      {showCreateCategoryModal && (
        <AddCategoryModal
          onSave={handleSave}
          onClose={() => setShowCreateCategoryModal(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: 16,
    width: '100%',
    zIndex: 10,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
    opacity: 0.7,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f6f6f6',
    borderWidth: 1,
    borderColor: '#eaeaea',
    borderRadius: 8,
  },
  selectFaint: {},
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectText: {
    fontSize: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: '#555',
    flex: 1,
  },
  arrow: {
    fontSize: 20,
    color: '#888',
    transform: [{ rotate: '90deg' }],
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#eaeaea',
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
});
