"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import {
  SUPPLIERS_PAGE_SIZE,
  SupplierDeleteDialog,
  SuppliersSearchSection,
  SuppliersStatsGrid,
  SuppliersTable,
  useSuppliersPageLogic,
} from "@/components/features/suppliers";

export default function SuppliersPage() {
  const logic = useSuppliersPageLogic();

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Nhà cung cấp"
        description="Quản lý thông tin đối tác cung ứng và lịch sử giao dịch."
        actions={
          <Button
            render={<Link href="/suppliers/new" />}
            nativeButton={false}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm đối tác mới
          </Button>
        }
      />

      <SuppliersStatsGrid
        totalPartners={logic.totalPartners}
        activeCount={logic.activeCount}
        inactiveCount={logic.inactiveCount}
        multiPage={logic.multiPage}
        pageDisplay={
          logic.paged
            ? `${logic.paged.page + 1}/${logic.paged.total_pages} · ${logic.paged.size}`
            : `${logic.rows.length}`
        }
      />

      <SuppliersSearchSection
        searchInput={logic.searchInput}
        onSearchChange={logic.setSearchInput}
        hasAnyFilter={logic.hasAnyFilter}
        onClearFilters={logic.clearFilters}
      />

      <SuppliersTable
        rows={logic.rows}
        page={logic.page}
        totalElements={logic.paged?.total_elements ?? logic.rows.length}
        totalPages={logic.paged?.total_pages ?? 1}
        pageSize={logic.paged?.size ?? SUPPLIERS_PAGE_SIZE}
        canGoPrev={logic.canGoPrev}
        canGoNext={logic.canGoNext}
        isLoading={logic.isLoading}
        isFetching={logic.isFetching}
        isError={logic.isError}
        error={logic.error}
        hasAnyFilter={logic.hasAnyFilter}
        onRetry={logic.refetch}
        onPrevPage={() => logic.setPage((p) => Math.max(0, p - 1))}
        onNextPage={() => logic.setPage((p) => p + 1)}
        onRequestDelete={logic.openDeleteDialog}
      />

      <SupplierDeleteDialog
        open={logic.isDeleteDialogOpen}
        onOpenChange={logic.setIsDeleteDialogOpen}
        onConfirm={logic.handleDelete}
        itemName={logic.deleteTarget?.name ?? ""}
      />
    </div>
  );
}
