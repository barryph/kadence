import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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
import DeleteCategoryModal from '@/components/categories/delete-category-modal';
import LoaderScreen from '@/components/base/loader-screen';

// TODO: Add add your first category placeholder
// TODO: Sort categories by activities count

function Categories() {
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<IActivityClient[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ICategory | null>(
    null,
  );
  // This is kept separate as opposed to adding it as another property of each category,
  // to avoid polluting the ICategory interface
  const [categoryToActivityCountMap, setCategoryToActivityCountMap] =
    useState<Record<number, number> | null>(null);

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

        const activitiesList = activitiesResponse.data?.activities || [];
        const categoriesList = categoriesResponse.data?.categories || [];

        // Count number of activities each category is used by
        const map: Record<number, number> = {};
        categoriesList.forEach(
          (category: ICategory) => (map[category.id!] = 0),
        );
        activitiesList.forEach((activity: IActivityClient) => {
          if (activity.categoryId) {
            map[activity.categoryId]++;
          }
        });
        setCategoryToActivityCountMap(map);

        setActivities(activitiesList as IActivityClient[]);
        setCategories(
          categoriesList.sort(
            (a: ICategory, b: ICategory) => map[b.id!] - map[a.id!],
          ) as ICategory[],
        );
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

  function handleSave(updatedCategory: ICategory) {
    setShowEditCategoryModal(false);
    // Update category in memory
    const updatedCategories = categories.map((category) => {
      if (category.id !== selectedCategory!.id) return category;
      return updatedCategory;
    });
    setCategories(updatedCategories);
  }

  function handleDeleted() {
    setIsDeleteModalVisible(false);
    setShowEditCategoryModal(false);
    setCategories(
      categories.filter((category) => category.id !== selectedCategory!.id),
    );
  }

  if (isLoading) {
    return <LoaderScreen text="Loading..." />;
  }

  return (
    <View style={[{ flex: 1 }, styles.container]}>
      <Background showRed={false} />
      <ThemedText style={styles.title} type="title" size="large">
        Your Categories
      </ThemedText>

      <View style={styles.categories}>
        {categories.length === 0 && (
          <ListItemShell style={styles.getStartedPill}>
            {/* TODO: Add dot */}
            <View
              style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}
            >
              <View
                style={[styles.dot, { backgroundColor: 'rgb(0, 255, 52)' }]}
              />
              <ThemedText type="defaultBold">
                Add your first category
              </ThemedText>
            </View>
            <ThemedText size="extraSmall">
              Get started by adding your first Category!
            </ThemedText>
          </ListItemShell>
        )}
        {categories.map((category) => (
          <Pressable key={category.id} onPress={() => openEditModal(category)}>
            <ListItemShell style={styles.category}>
              <View style={styles.leftRow}>
                <View style={styles.topRow}>
                  <View
                    style={[styles.dot, { backgroundColor: category.color }]}
                  />
                  <ThemedText>{category.name}</ThemedText>
                </View>
                <View style={styles.bottomRow}>
                  <ThemedText style={styles.bottomRowText} size="small">
                    Used in{' '}
                    <strong>
                      {categoryToActivityCountMap![category.id!] || '0'}
                    </strong>{' '}
                    activities
                  </ThemedText>
                </View>
              </View>
              <View>
                <FontAwesome6
                  style={[{ color: '#eee' }, styles.settingsButton]}
                  name="gear"
                  size={26}
                />
              </View>
            </ListItemShell>
          </Pressable>
        ))}
      </View>

      {showEditCategoryModal && selectedCategory && (
        <CategoryModal
          initialValues={{
            name: selectedCategory.name,
            color: selectedCategory.color,
          }}
          title={() => (
            <View style={styles.editModalTitleRow}>
              <ThemedText type="subtitle" style={styles.editModalTitle}>
                Edit Category &quot;{selectedCategory.name}&quot;
              </ThemedText>
              <Pressable onPress={() => setIsDeleteModalVisible(true)}>
                <FontAwesome6
                  style={{ padding: 6 }}
                  name="trash"
                  size={20}
                  color="white"
                />
              </Pressable>
            </View>
          )}
          onClose={() => {
            setShowEditCategoryModal(false);
            setIsDeleteModalVisible(false);
          }}
          onSubmit={handleSubmit}
          onSave={handleSave}
        />
      )}

      {selectedCategory && (
        <DeleteCategoryModal
          visible={isDeleteModalVisible}
          categoryId={selectedCategory.id!}
          onClose={() => setIsDeleteModalVisible(false)}
          onDeleted={handleDeleted}
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
  editModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  editModalTitle: {
    flex: 1,
    marginRight: 12,
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
  getStartedPill: {
    paddingTop: 14,
    paddingHorizontal: 15,
    paddingBottom: 12,
    gap: 2,
  },
});

export default function wrapper() {
  return (
    <UnmountOnBlur>
      <Categories />
    </UnmountOnBlur>
  );
}
