"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import {
  CategoriesSearchSection,
  CategoryStatsGrid,
  CategoryTreeTable,
  CategoryDeleteDialog,
  useCategoriesPageLogic,
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
            render={<Link href="/categories/new" />}
            nativeButton={false}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm phân loại mới
          </Button>
        }
      />

      <CategoryStatsGrid stats={logic.stats} />

      <CategoriesSearchSection
        query={logic.query}
        onQueryChange={logic.setQuery}
        onClearQuery={logic.clearQuery}
      />

      <CategoryTreeTable
        categories={logic.categories}
        treeModel={logic.treeModel}
        childrenByParentId={logic.childrenByParentId}
        isLoading={logic.isLoading}
        isFetching={logic.isFetching}
        error={logic.error}
        onRetry={logic.refetch}
        onToggleExpanded={logic.toggleExpanded}
        onDeleteCategory={logic.prepareDelete}
      />

      <CategoryDeleteDialog
        open={logic.isDeleteDialogOpen}
        onOpenChange={logic.setIsDeleteDialogOpen}
        itemName={logic.itemToDelete?.name}
        onConfirm={logic.confirmDelete}
      />
    </div>
  );
}
