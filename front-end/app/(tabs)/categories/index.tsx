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
    <View style={[{ flex: 1 }]}>
      <Background showRed={false} />

      <ScrollView>
        <Container style={styles.scrollContent}>
          <View style={styles.headlineRow}>
            <ThemedText style={styles.headline} variant="heading" font="system">
              Categories
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
            {sortedCategories.length === 0 && (
              <ListItemShell style={styles.getStartedPill}>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: Spacing.xxs,
                    alignItems: 'center',
                  }}
                >
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
                <ListItemShell style={styles.category}>
                  <View style={styles.leftRow}>
                    <View style={styles.topRow}>
                      <Dot backgroundColor={category.color} />
                      <ThemedText variant="bodyBold" lineHeight={28}>
                        {category.name}
                      </ThemedText>
                    </View>
                    <View style={styles.bottomRow}>
                      <ThemedText
                        style={styles.bottomRowText}
                        variant="caption"
                      >
                        Used in{' '}
                        {categoryToActivityCountMap[category.id!] || '0'}{' '}
                        {categoryToActivityCountMap[category.id!] !== 1
                          ? 'activities'
                          : 'activity'}
                      </ThemedText>
                    </View>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: Spacing.sm,
                      gap: 9,
                    }}
                  >
                    <Feather
                      name="edit-2"
                      size={18}
                      color={Colors.textSecondary}
                    />
                  </View>
                </ListItemShell>
              </Pressable>
            ))}
          </View>
        </Container>
      </ScrollView>

      <FloatingActionButton
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
                  style={{ padding: Spacing.sm }}
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
  scrollContent: {
    paddingBottom: 100,
    gap: Spacing['4xl'],
  },
  headlineRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing['2xl'],
  },
  headline: {
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
  category: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing['2xl'],
  },
  leftRow: {
    flexGrow: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3xl'],
  },
  bottomRowText: {
    opacity: 0.8,
  },
  settingsButton: {
    paddingVertical: 9,
    // paddingHorizontal: 9,
  },
  getStartedPill: {
    paddingTop: 14,
    paddingHorizontal: 15,
    paddingBottom: Spacing.xl,
    gap: Spacing.xxs,
  },
});
