"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import {
  SORT_DIR_LABELS,
  SORT_FIELD_LABELS,
  WAREHOUSES_PAGE_SIZE,
  WarehousesDeleteDialog,
  WarehousesGrid,
  WarehousesSearchSection,
  WarehouseFormDialog,
  WarehouseStatsGrid,
  useWarehousesPageLogic,
} from "@/components/features/warehouses";

export default function WarehousesPage() {
  const logic = useWarehousesPageLogic();

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Danh sách kho"
        description="Hệ thống quản lý không gian lưu trữ và mạng lưới kho bãi."
        actions={
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none"
            onClick={logic.openCreateDialog}
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm kho mới
          </Button>
        }
      />

      <WarehouseStatsGrid summary={logic.summary} isLoading={logic.isLoading} />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col">
        <WarehousesSearchSection
          noContainer
          searchInput={logic.searchInput}
          onSearchChange={logic.setSearchInput}
          advancedOpen={logic.advancedOpen}
          onToggleAdvanced={() => logic.setAdvancedOpen((value) => !value)}
          advancedCount={logic.advancedCount}
          hasAnyFilter={logic.hasAnyFilter}
          statusValue={logic.statusValue}
          sortValue={logic.sortValue}
          sortDirValue={logic.sortDirValue}
          onStatusChange={logic.handleStatusChange}
          onSortChange={(value) => logic.setSort(SORT_FIELD_LABELS[value] ?? "createdAt")}
          onSortDirChange={(value) => logic.setSortDir(SORT_DIR_LABELS[value] ?? "desc")}
          onClearFilters={() => {
            logic.clearFilters();
            logic.setAdvancedOpen(false);
          }}
        />

        <div className="bg-slate-50/50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-800">
          <WarehousesGrid
            noContainer
            warehouses={logic.warehouses}
            error={logic.error}
            isLoading={logic.isLoading}
            isFetching={logic.isFetching}
            hasAnyFilter={logic.hasAnyFilter}
            totalElements={logic.totalElements}
            totalPages={logic.totalPages}
            page={logic.page}
            pageSize={logic.size || WAREHOUSES_PAGE_SIZE}
            onRetry={logic.refetch}
            onClearFilters={logic.clearFilters}
            onPrevPage={() => logic.setPage(Math.max(0, logic.page - 1))}
            onNextPage={() => logic.setPage(logic.page + 1)}
            onPageSizeChange={(nextSize) => {
              logic.setSize(nextSize);
              logic.setPage(0);
            }}
            onRequestDelete={logic.openDeleteDialog}
            onRequestEdit={logic.openEditDialog}
            onRequestCreate={logic.openCreateDialog}
          />
        </div>
      </div>

      <WarehouseFormDialog
        open={logic.isFormOpen}
        onOpenChange={logic.handleFormOpenChange}
        editingWarehouse={logic.editingWarehouse}
        isSubmitting={logic.isSubmitting}
        formState={logic.formState}
        setFormState={logic.setFormState}
        onSubmit={logic.handleSubmitForm}
      />

      <WarehousesDeleteDialog
        open={logic.isDeleteDialogOpen}
        onOpenChange={logic.setIsDeleteDialogOpen}
        itemName={logic.deleteTarget?.name ?? ""}
        onConfirm={logic.handleDelete}
      />
    </div>
  );
}
