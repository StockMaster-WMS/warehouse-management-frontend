"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import {
  CategoriesSearchSection,
  CategoryStatsGrid,
  CategoryTreeTable,
  CategoryDeleteDialog,
  useCategoriesPageLogic,
  CategoryDialog,
} from "@/components/features/categories";

export default function CategoriesPage() {
  const logic = useCategoriesPageLogic();

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Nhóm / loại hàng"
        description="Cây phân loại: nhóm gốc và loại con — dùng khi gán sản phẩm và báo cáo."
        actions={
          <Button
            onClick={logic.openCreateDialog}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm phân loại mới
          </Button>
        }
      />

      <CategoryStatsGrid stats={logic.stats} />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col">
        <CategoriesSearchSection
          noContainer
          query={logic.query}
          onQueryChange={logic.setQuery}
          onClearQuery={logic.clearQuery}
        />

        <CategoryTreeTable
          noContainer
          treeModel={logic.treeModel}
          isLoading={logic.isLoading}
          isFetching={logic.isFetching}
          error={logic.error}
          onRetry={logic.refetch}
          onToggleExpanded={logic.toggleExpanded}
          onEditCategory={logic.openEditDialog}
          onDeleteCategory={logic.prepareDelete}
        />
      </div>

      <CategoryDeleteDialog
        open={logic.isDeleteDialogOpen}
        onOpenChange={logic.setIsDeleteDialogOpen}
        itemName={logic.itemToDelete?.name}
        onConfirm={logic.confirmDelete}
      />

      <CategoryDialog
        open={logic.isFormDialogOpen}
        onOpenChange={logic.setIsFormDialogOpen}
        categoryId={logic.editCategoryId}
      />
    </div>
  );
}
