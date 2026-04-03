"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { AdvancedFilterActions } from "@/components/features/AdvancedFilters";
import { useDeleteProductMutation } from "@/store/services/product.service";
import {
  useProductsPageLogic,
  ProductStatsGrid,
  ProductFiltersPanel,
  ProductTable,
} from "@/components/features/products";

const DeleteConfirmDialog = dynamic(
  () => import("@/components/features/DeleteConfirmDialog").then((m) => m.DeleteConfirmDialog),
  { ssr: false },
);
const ProductImportExportMenu = dynamic(
  () => import("@/components/features/products").then((m) => m.ProductImportExportMenu),
  { ssr: false },
);

const PAGE_SIZE = 20;

export default function ProductsPage() {
  const logic = useProductsPageLogic();
  const [deleteProduct] = useDeleteProductMutation();

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

      <SearchToolbar
        placeholder="Tìm kiếm sản phẩm"
        value={logic.searchInput}
        onValueChange={logic.setSearchInput}
        right={
          <AdvancedFilterActions
            open={logic.advancedOpen}
            onToggle={() => logic.setAdvancedOpen((v) => !v)}
            activeCount={logic.advancedCount}
            hasAnyFilter={logic.hasAnyFilter}
            onClear={logic.clearFilters}
          />
        }
        filters={
          <ProductFiltersPanel
            open={logic.advancedOpen}
            statusFilter={logic.statusFilter}
            categoryFilter={logic.categoryFilter}
            warehouseFilter={logic.warehouseFilter}
            advancedCount={logic.advancedCount}
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
        }
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
        pageSize={PAGE_SIZE}
        page={logic.page}
        totalElements={logic.totalElements}
        totalPages={logic.serverTotalPages}
        canGoPrev={logic.canGoPrev}
        canGoNext={logic.canGoNext}
        onPrevPage={logic.handlePrevPage}
        onNextPage={logic.handleNextPage}
      />

      <DeleteConfirmDialog
        open={logic.isDeleteDialogOpen}
        onOpenChange={logic.setIsDeleteDialogOpen}
        onConfirm={async () => {
          try {
            if (logic.deleteTarget?.id) {
              await deleteProduct(logic.deleteTarget.id).unwrap();
            }
          } catch (err) {
            console.error("Xóa sản phẩm thất bại:", err);
          }
        }}
        itemName={logic.deleteTarget?.name}
      />
    </div>
  );
}
