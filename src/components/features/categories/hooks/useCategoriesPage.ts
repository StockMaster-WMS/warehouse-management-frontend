"use client";

import { useCallback, useMemo, useState } from "react";
import {
  useDeleteCategoryMutation,
  useGetCategoriesQuery,
} from "@/store/services/category.service";
import { apiErrMessage } from "@/types/api";
import type { Category } from "@/types/category";
import { toast } from "sonner";

type CategoryDeleteItem = {
  id: string;
  name: string;
};

export function useCategoriesPageLogic() {
  const [query, setQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string> | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CategoryDeleteItem | null>(null);
  
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);

  const { data, error, isLoading, isFetching, refetch } = useGetCategoriesQuery();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();
  const categories = useMemo(() => data?.data?.content ?? [], [data]);

  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category] as const)),
    [categories],
  );

  const childrenByParentId = useMemo(() => {
    const map = new Map<string, Category[]>();

    for (const category of categories) {
      const parentId = category.parentId ?? "";
      if (!parentId) continue;
      const current = map.get(parentId) ?? [];
      current.push(category);
      map.set(parentId, current);
    }

    for (const list of map.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name, "vi"));
    }

    return map;
  }, [categories]);

  const roots = useMemo(() => categories.filter((category) => !category.parentId), [categories]);

  const treeModel = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const hasQuery = normalizedQuery.length > 0;

    const matchedIds = new Set<string>();
    if (hasQuery) {
      for (const category of categories) {
        const name = category.name?.toLowerCase() ?? "";
        const code = category.code?.toLowerCase() ?? "";
        if (name.includes(normalizedQuery) || code.includes(normalizedQuery)) {
          matchedIds.add(category.id);
        }
      }
    }

    const ancestorIds = new Set<string>();
    if (hasQuery) {
      for (const id of matchedIds) {
        let current = categoriesById.get(id);
        while (current?.parentId) {
          ancestorIds.add(current.parentId);
          current = categoriesById.get(current.parentId);
        }
      }
    }

    const baseExpandedIds =
      expandedIds ?? new Set(roots.map((root) => root.id));
    const effectiveExpandedIds = new Set(baseExpandedIds);
    if (hasQuery) {
      for (const id of ancestorIds) {
        effectiveExpandedIds.add(id);
      }
    }

    const visibleSet = hasQuery ? new Set<string>([...matchedIds, ...ancestorIds]) : null;
    const visibleIds = visibleSet ?? new Set<string>();

    const visibleNodes: Array<{ cat: Category; treeDepth: number; hasChildren: boolean }> = [];

    const walk = (category: Category, depth: number) => {
      const children = childrenByParentId.get(category.id) ?? [];
      const hasChildren = children.length > 0;
      const shouldShow = !hasQuery || visibleIds.has(category.id);

      if (shouldShow) {
        visibleNodes.push({ cat: category, treeDepth: depth, hasChildren });
      }

      if (hasChildren && effectiveExpandedIds.has(category.id)) {
        for (const child of children) {
          walk(child, depth + 1);
        }
      }
    };

    for (const root of roots) {
      walk(root, 0);
    }

    const displayCount = hasQuery ? matchedIds.size : categories.length;

    return { visibleNodes, effectiveExpandedIds, displayCount, hasQuery };
  }, [categories, categoriesById, childrenByParentId, expandedIds, query, roots]);

  const stats = useMemo(() => {
    const total = categories.length;
    const rootCategories = categories.filter((category) => !category.parentId).length;
    const childCategories = total - rootCategories;

    return [
      { label: "Tổng nhóm hàng", value: String(total) },
      { label: "Nhóm cấp gốc", value: String(rootCategories) },
      { label: "Nhóm con", value: String(childCategories) },
      { label: "Đang hiển thị", value: String(treeModel.displayCount) },
    ];
  }, [categories, treeModel.displayCount]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current ?? roots.map((root) => root.id));
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, [roots]);

  const prepareDelete = useCallback((category: Category) => {
    setItemToDelete({ id: category.id, name: category.name });
    setIsDeleteDialogOpen(true);
  }, []);

  const openCreateDialog = useCallback(() => {
    setEditCategoryId(null);
    setIsFormDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((category: Category) => {
    setEditCategoryId(category.id);
    setIsFormDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete?.id) return;

    try {
      await deleteCategory(itemToDelete.id).unwrap();
      toast.success(`Đã xóa nhóm hàng \"${itemToDelete.name}\"`);
      setItemToDelete(null);
    } catch (deleteError) {
      toast.error(apiErrMessage(deleteError, "Không thể xóa nhóm hàng. Vui lòng thử lại."));
    }
  }, [deleteCategory, itemToDelete]);

  const clearQuery = useCallback(() => setQuery(""), []);

  return {
    query,
    setQuery,
    clearQuery,
    isLoading,
    isFetching,
    error,
    refetch,
    categories,
    childrenByParentId,
    treeModel,
    stats,
    expandedIds,
    toggleExpanded,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    itemToDelete,
    setItemToDelete,
    prepareDelete,
    confirmDelete,
    isDeleting,
    isFormDialogOpen,
    setIsFormDialogOpen,
    editCategoryId,
    openCreateDialog,
    openEditDialog,
  };
}
