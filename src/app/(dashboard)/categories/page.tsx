"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PermissionControl, useHasPermissions } from "@/components/permission-control";
import { ADMIN_MANAGER_ROLES } from "@/lib/access-control";
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
  const canManageCategories = useHasPermissions(ADMIN_MANAGER_ROLES);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Nhóm / loại hàng"
        description="Cây phân loại: nhóm gốc và loại con — dùng khi gán sản phẩm và báo cáo."
        actions={
          <PermissionControl allowedRoles={ADMIN_MANAGER_ROLES}>
            <Button
              onClick={logic.openCreateDialog}
              size="sm"
              className="h-10 w-full bg-indigo-600 shadow-sm shadow-indigo-200 hover:bg-indigo-700 dark:shadow-none sm:w-auto sm:h-7"
            >
              <Plus className="mr-2 size-4" />
              Thêm phân loại mới
            </Button>
          </PermissionControl>
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
          canManageCategories={canManageCategories}
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
