"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import {
  useOrdersPageLogic,
  OrdersSearchSection,
  OrdersTable,
} from "@/components/features/orders";

export default function OrderPage() {
  const logic = useOrdersPageLogic();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đơn hàng xuất kho"
        description="Quản lý đơn hàng và theo dõi tiến trình giao nhận."
        actions={
          <Button
            render={<Link href="/orders/new" />}
            nativeButton={false}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Tạo đơn xuất
          </Button>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col">
        <OrdersSearchSection
          noContainer
          searchInput={logic.searchInput}
          onSearchChange={(value) => {
            logic.setSearchInput(value);
            logic.setPage(0);
          }}
          advancedOpen={logic.advancedOpen}
          onToggleAdvanced={() => logic.setAdvancedOpen((v) => !v)}
          advancedCount={logic.advancedCount}
          hasAnyFilter={logic.hasAnyFilter}
          statusFilter={logic.statusFilter}
          onStatusChange={(value) => {
            logic.setStatusFilter(value);
            logic.setPage(0);
          }}
          onClearFilters={() => {
            logic.clearFilters();
            logic.setAdvancedOpen(false);
          }}
        />
        <OrdersTable
          noContainer
          rows={logic.rows}
          page={logic.page}
          createdId={logic.createdId}
          hasAnyFilter={logic.hasAnyFilter}
          isLoading={logic.isLoading}
          isFetching={logic.isFetching}
          error={logic.error}
          onRetry={logic.refetch}
          onClearFilters={logic.clearFilters}
          totalElements={logic.totalElements}
          totalPages={logic.totalPages}
          canGoPrev={logic.canGoPrev}
          canGoNext={logic.canGoNext}
          onPrevPage={() => logic.setPage((p) => Math.max(0, p - 1))}
          onNextPage={() => logic.setPage((p) => p + 1)}
        />
      </div>
    </div>
  );
}
