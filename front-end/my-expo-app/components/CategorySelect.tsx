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
  const [selectedCategory, setSelectedCategory] = useState<ICategory | null>(
    null,
  );
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
      {label && (
        <ThemedText style={styles.label} type="defaultSemiBold">
          {label}
        </ThemedText>
      )}
      <Pressable
        onPress={() => setShowDropdown((open) => !open)}
        style={[styles.select, !selectedCategory && styles.selectFaint]}
      >
        {selectedCategory ? (
          <View style={styles.selectedRow}>
            <ThemedText style={styles.selectText}>
              {selectedCategory.name}
            </ThemedText>
            <View
              style={[styles.dot, { backgroundColor: selectedCategory.color }]}
            />
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
              <ThemedText style={styles.dropDownText}>{option.name}</ThemedText>
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
            <ThemedText style={styles.dropDownText} type="defaultSemiBold">
              + Create Category
            </ThemedText>
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
    color: '#fff',
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
    color: '#fff',
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
    color: '#999',
    flex: 1,
  },
  arrow: {
    fontSize: 20,
    color: '#999',
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
  dropDownText: {
    color: '#333',
  },
});
