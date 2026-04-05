import { useMemo } from "react";
import {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
} from "@/store/services/category.service";

export function useCategoryDetailLogic(categoryId: string) {
  const { data, error, isLoading, isFetching, refetch } = useGetCategoryByIdQuery(categoryId);
  const { data: allCategoriesData } = useGetCategoriesQuery();

  const category = data?.data;
  const allCategories = allCategoriesData?.data?.content ?? [];

  const categoriesById = useMemo(
    () => new Map(allCategories.map((c) => [c.id, c] as const)),
    [allCategories],
  );

  const parentLabel = useMemo(() => {
    if (!category?.parentId) return "Nhóm gốc (không thuộc nhóm cha)";
    const parent = categoriesById.get(category.parentId);
    return parent ? `${parent.name} (${parent.code})` : category.parentId;
  }, [category, categoriesById]);

  const parentResolved = useMemo(() => {
    if (!category?.parentId) return true;
    return categoriesById.has(category.parentId);
  }, [category, categoriesById]);

  return {
    category,
    error,
    isLoading,
    isFetching,
    refetch,
    parentLabel,
    parentResolved,
  };
}
