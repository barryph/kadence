import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

import Background from '@/components/backgrounds/background';
import { ThemedText } from '@/components/base/themed-text';
import UnmountOnBlur from '@/components/router/unmount-on-blur';
import { activitiesAPI, IActivityClient } from '@/api/api.activity';
import { categoriesAPI, ICategory } from '@/api/api.categories';
import ListItemShell from '@/components/list-item-shell';
import CategoryModal, {
  CategoryFormValues,
} from '@/components/categories/category-modal';

function Categories() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<IActivityClient[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ICategory | null>(
    null,
  );

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchData() {
      try {
        const [activitiesResponse, categoriesResponse] = await Promise.all([
          activitiesAPI.getAllByUser({
            signal: abortController.signal,
          }),
          categoriesAPI.getAllByUser({
            signal: abortController.signal,
          }),
        ]);

        if (activitiesResponse.data?.activities) {
          const activities = activitiesResponse.data.activities;
          setActivities(activities as IActivityClient[]);
        }

        if (categoriesResponse.data?.categories) {
          setCategories(categoriesResponse.data.categories as ICategory[]);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          console.error('Error fetching data', err);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
    return () => abortController.abort();
  }, []);

  function openEditModal(category: ICategory) {
    setSelectedCategory(category);
    // router.push(`/categories/edit/${category.id}`);
    setShowEditCategoryModal(true);
  }

  async function handleSubmit(values: CategoryFormValues) {
    if (!selectedCategory) throw new Error('No selected category');
    const response = await categoriesAPI.editCategory(selectedCategory.id!, {
      name: values.name,
      color: values.color,
    });
    return response;
  }

  function handleSave(category: ICategory) {
    // TODO: Update category in memory
    setShowEditCategoryModal(false);
  }

  return (
    <View style={[{ flex: 1 }, styles.container]}>
      <Background />
      <ThemedText style={styles.title} type="title" size="large">
        Categories
      </ThemedText>

      <View style={styles.categories}>
        {categories.map((category) => (
          <ListItemShell key={category.id} style={styles.category}>
            <View style={styles.leftRow}>
              <View style={styles.topRow}>
                <View
                  style={[styles.dot, { backgroundColor: category.color }]}
                />
                <ThemedText>{category.name}</ThemedText>
              </View>
              <View style={styles.bottomRow}>
                <ThemedText style={styles.bottomRowText} size="small">
                  Used in <strong>3</strong> activities
                </ThemedText>
              </View>
            </View>
            <View style={styles.rightRow}>
              <Pressable
                onPress={() => openEditModal(category)}
                style={styles.settingsButton}
              >
                <FontAwesome6 style={{ color: '#eee' }} name="gear" size={26} />
              </Pressable>
            </View>
          </ListItemShell>
        ))}
      </View>

      {showEditCategoryModal && selectedCategory && (
        <CategoryModal
          initialValues={{
            name: selectedCategory.name,
            color: selectedCategory.color,
          }}
          title={() => (
            <ThemedText type="subtitle" style={styles.title}>
              Edit Category &quot;{selectedCategory.name}&quot;
            </ThemedText>
          )}
          onClose={() => setShowEditCategoryModal(false)}
          onSubmit={handleSubmit}
          onSave={handleSave}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 32,
  },
  title: {
    marginTop: 20,
    marginBottom: 25,
  },
  categories: {
    gap: 8,
  },
  category: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 15,
  },
  leftRow: {
    flexGrow: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  bottomRowText: {
    fontSize: 12,
    opacity: 0.8,
  },
  settingsButton: {
    paddingVertical: 9,
    paddingHorizontal: 9,
  },
});

export default function wrapper() {
  return (
    <UnmountOnBlur>
      <Categories />
    </UnmountOnBlur>
  );
}
