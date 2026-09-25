import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

import Background from '@/components/backgrounds/background';
import { ThemedText } from '@/components/base/themed-text';
import { ICategory } from '@/api/api.categories';
import ListItemShell from '@/components/list-item-shell';
import CategoryModal, {
  CategoryFormValues,
} from '@/components/categories/category-modal';
import DeleteCategoryModal from '@/components/categories/delete-category-modal';
import LoaderScreen from '@/components/base/loader-screen';
import ErrorScreen from '@/components/base/error-screen';
import Dot from '@/components/dot';
import CreateCategoryModal from '@/components/categories/create-category-modal';
import FloatingActionButton from '@/components/ui/floating-action-button';
import Container from '@/components/base/container';
import { Colors, Spacing } from '@/constants/theme';
import { useActivitiesQuery } from '@/hooks/queries/use-activities';
import { useCategoriesQuery } from '@/hooks/queries/use-categories';
import { useEditCategoryMutation } from '@/hooks/mutations/use-category-mutations';
import { ApiError } from '@/lib/query/unwrap';
import type { ApiResponse } from '@/api/api.types';

/**
 * Stable fallback for a query with no data yet, so the array identity does
 * not change on every render and invalidate downstream memoisation.
 */
const EMPTY_LIST: never[] = [];

export default function Categories() {
  const router = useRouter();
  const {
    data: activitiesData,
    isPending: isActivitiesPending,
    refetch: refetchActivities,
  } = useActivitiesQuery();
  const {
    data: categoriesData,
    isPending: isCategoriesPending,
    isError: isCategoriesError,
    refetch: refetchCategories,
  } = useCategoriesQuery();
  const activities = activitiesData ?? EMPTY_LIST;
  const categories = categoriesData ?? EMPTY_LIST;
  const editCategory = useEditCategoryMutation();

  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ICategory | null>(
    null,
  );

  const { sortedCategories, categoryToActivityCountMap } = useMemo(() => {
    const map: Record<number, number> = {};
    categories.forEach((category) => {
      if (category.id !== undefined) {
        map[category.id] = 0;
      }
    });
    activities.forEach((activity) => {
      if (activity.categoryId) {
        map[activity.categoryId] = (map[activity.categoryId] ?? 0) + 1;
      }
    });

    const sorted = [...categories].sort(
      (a, b) => (map[b.id!] ?? 0) - (map[a.id!] ?? 0),
    );

    return { sortedCategories: sorted, categoryToActivityCountMap: map };
  }, [activities, categories]);

  function openEditModal(category: ICategory) {
    setSelectedCategory(category);
    setShowEditCategoryModal(true);
  }

  async function handleSubmit(
    values: CategoryFormValues,
  ): Promise<ApiResponse<{ category: ICategory }>> {
    if (!selectedCategory) throw new Error('No selected category');

    try {
      const category = await editCategory.mutateAsync({
        categoryId: selectedCategory.id!,
        body: {
          name: values.name,
          color: values.color,
        },
      });
      return { data: { category } };
    } catch (error) {
      if (error instanceof ApiError) {
        return { error: error.appError };
      }
      throw error;
    }
  }

  function handleSave() {
    setShowEditCategoryModal(false);
  }

  function handleDeleted() {
    setIsDeleteModalVisible(false);
    setShowEditCategoryModal(false);
  }

  function handleCreatedCategory() {
    setShowCreateCategoryModal(false);
  }

  if (isActivitiesPending || isCategoriesPending) {
    return <LoaderScreen text="Loading..." />;
  }

  // Only a failure with nothing cached is terminal: a silent refetch that fails
  // must keep the categories already on screen.
  if (isCategoriesError && !categoriesData) {
    return (
      <ErrorScreen
        message="Unable to load categories."
        onRetry={() => {
          void refetchActivities();
          void refetchCategories();
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Background showRed={false} />

      <ScrollView>
        <Container style={styles.scrollContent}>
          <View style={styles.titleRow}>
            <ThemedText style={styles.title} variant="heading" font="system">
              Your Categories
            </ThemedText>

            <View style={styles.insightsLinks}>
              <Pressable
                onPress={() => router.push('/categories/insights')}
                style={styles.insightsLink}
              >
                <ThemedText variant="bodySmall" style={styles.insightsLinkText}>
                  See Insights &rarr;
                </ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={styles.categories}>
            <ThemedText
              variant="eyebrow"
              weight="400"
              size="xs"
              style={styles.count}
            >
              {sortedCategories.length}{' '}
              {sortedCategories.length !== 1 ? 'Categories' : 'Category'}
            </ThemedText>
            {sortedCategories.length === 0 && (
              <ListItemShell style={styles.emptyState}>
                <View style={styles.emptyStateRow}>
                  <Dot />
                  <ThemedText variant="bodyBold">
                    Add your first category
                  </ThemedText>
                </View>
                <ThemedText variant="caption">
                  Get started by adding your first Category!
                </ThemedText>
              </ListItemShell>
            )}
            {sortedCategories.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => openEditModal(category)}
              >
                <ListItemShell
                  style={[
                    styles.category,
                    {
                      borderWidth: 1,
                      borderColor: `${category.color}cc`,
                      backgroundColor: `${category.color}20`,
                    },
                  ]}
                >
                  <View style={styles.categoryDetails}>
                    <View style={styles.categoryHeader}>
                      <View style={styles.categoryNameGroup}>
                        <Dot backgroundColor={category.color} />
                        <ThemedText variant="bodyBold" lineHeight={28}>
                          {category.name}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.categoryUsage}>
                      <ThemedText
                        style={styles.categoryUsageText}
                        variant="eyebrow"
                        weight="400"
                        size="xs"
                      >
                        Used in{' '}
                      </ThemedText>
                      <ThemedText variant="eyebrow" size="xs">
                        {categoryToActivityCountMap[category.id!] || '0'}{' '}
                      </ThemedText>
                      <ThemedText
                        style={styles.categoryUsageText}
                        variant="eyebrow"
                        weight="400"
                        size="xs"
                      >
                        {categoryToActivityCountMap[category.id!] !== 1
                          ? 'activities'
                          : 'activity'}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.editButtonContainer}>
                    <View style={styles.editButton}>
                      <Feather
                        name="edit-2"
                        size={18}
                        color={Colors.textPrimary}
                      />
                    </View>
                  </View>
                </ListItemShell>
              </Pressable>
            ))}
          </View>
        </Container>
      </ScrollView>

      <FloatingActionButton
        testID="create-category-button"
        label="Create Category"
        onPress={() => setShowCreateCategoryModal(true)}
      />

      {showCreateCategoryModal && (
        <CreateCategoryModal
          onSave={handleCreatedCategory}
          onClose={() => setShowCreateCategoryModal(false)}
        />
      )}

      {showEditCategoryModal && selectedCategory && (
        <CategoryModal
          initialValues={{
            name: selectedCategory.name,
            color: selectedCategory.color,
          }}
          title={() => (
            <View style={styles.editModalTitleRow}>
              <ThemedText variant="subheading" style={styles.editModalTitle}>
                Edit Category &quot;{selectedCategory.name}&quot;
              </ThemedText>
              <Pressable onPress={() => setIsDeleteModalVisible(true)}>
                <FontAwesome6
                  style={styles.deleteIcon}
                  name="trash"
                  size={20}
                  color={Colors.textPrimary}
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
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    gap: Spacing['4xl'],
  },
  titleRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing['3xl'],
  },
  title: {
    color: Colors.textPrimary,
  },
  insightsLinks: {},
  insightsLink: {},
  insightsLinkText: {},
  editModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing['2xl'],
  },
  editModalTitle: {
    flex: 1,
    marginRight: Spacing.xl,
  },
  categories: {
    gap: Spacing.xl,
  },
  count: {
    color: Colors.textSecondary,
  },
  category: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  categoryDetails: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing['2xl'],
    flexGrow: 1,
    gap: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
  },
  categoryUsage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryUsageText: {
    opacity: 0.7,
  },
  editButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    borderLeftWidth: 1,
    borderColor: Colors.border,
  },
  editButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    height: 40,
    width: 40,
  },
  emptyState: {
    paddingTop: 14,
    paddingHorizontal: 15,
    paddingBottom: Spacing.xl,
    gap: Spacing.xxs,
  },
  emptyStateRow: {
    flexDirection: 'row',
    gap: Spacing.xxs,
    alignItems: 'center',
  },
  deleteIcon: {
    padding: Spacing.sm,
  },
});
