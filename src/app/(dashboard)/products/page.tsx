"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import {
  PRODUCTS_PAGE_SIZE,
  ProductDeleteDialog,
  useProductsPageLogic,
  ProductStatsGrid,
  ProductsSearchSection,
  ProductTable,
} from "@/components/features/products";

const ProductImportExportMenu = dynamic(
  () => import("@/components/features/products").then((m) => m.ProductImportExportMenu),
  { ssr: false },
);

export default function ProductsPage() {
  const logic = useProductsPageLogic();

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Sản phẩm"
        description="Quản lý thông tin SKU, tồn kho đa điểm và vị trí lưu trữ."
        actions={
          <div className="flex items-center gap-2">
            <ProductImportExportMenu products={logic.products} pageIndex={logic.page} listParams={logic.listParams} />
            <Button
              render={<Link href="/products/new" />}
              nativeButton={false}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tạo mới Sản phẩm
            </Button>
          </div>
        }
      />

      <ProductStatsGrid stats={logic.stats} />

      <ProductsSearchSection
        searchInput={logic.searchInput}
        onSearchChange={logic.setSearchInput}
        advancedOpen={logic.advancedOpen}
        onToggleAdvanced={() => logic.setAdvancedOpen((v) => !v)}
        advancedCount={logic.advancedCount}
        hasAnyFilter={logic.hasAnyFilter}
        onClearFilters={logic.clearFilters}
        statusFilter={logic.statusFilter}
        categoryFilter={logic.categoryFilter}
        warehouseFilter={logic.warehouseFilter}
        onStatusChange={logic.setStatusFilter}
        onCategoryChange={logic.setCategoryFilter}
        onWarehouseChange={logic.setWarehouseFilter}
        categoryOptionsData={logic.categoryOptionsData}
        categoriesLoading={logic.categoriesLoading}
        categoriesError={logic.categoriesError}
        onRefetchCategories={logic.refetchCategories}
        warehouseOptionsData={logic.warehouseOptionsData}
        warehousesLoading={logic.warehousesLoading}
        warehousesError={logic.warehousesError}
        onRefetchWarehouses={logic.refetchWarehouses}
      />

      <ProductTable
        products={logic.products}
        isLoading={logic.isLoading}
        isFetching={logic.isFetching}
        error={logic.error}
        hasAnyFilter={logic.hasAnyFilter}
        onRequestDelete={logic.handleRequestDelete}
        onRetry={logic.refetch}
        onClearFilters={logic.clearFilters}
        pageIndex={logic.page}
        pageSize={PRODUCTS_PAGE_SIZE}
        page={logic.page}
        totalElements={logic.totalElements}
        totalPages={logic.serverTotalPages}
        canGoPrev={logic.canGoPrev}
        canGoNext={logic.canGoNext}
        onPrevPage={logic.handlePrevPage}
        onNextPage={logic.handleNextPage}
      />

      <ProductDeleteDialog
        open={logic.isDeleteDialogOpen}
        onOpenChange={logic.setIsDeleteDialogOpen}
        onConfirm={logic.handleConfirmDelete}
        itemName={logic.deleteTarget?.name}
      />
    </div>
  );
}
