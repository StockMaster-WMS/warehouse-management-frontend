"use client";

import Link from "next/link";
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
            render={<Link href="/warehouses/new" />}
            nativeButton={false}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm kho mới
          </Button>
        }
      />

      <WarehousesSearchSection
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

      <div className="space-y-4">
        {logic.isFetching && !logic.isLoading ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
            Đang cập nhật dữ liệu...
          </p>
        ) : null}

        <WarehousesGrid
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
        />
      </div>

      <WarehousesDeleteDialog
        open={logic.isDeleteDialogOpen}
        onOpenChange={logic.setIsDeleteDialogOpen}
        itemName={logic.itemToDelete}
        onConfirm={logic.handleDelete}
      />
    </div>
  );
}
