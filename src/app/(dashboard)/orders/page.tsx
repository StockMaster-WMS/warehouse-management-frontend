"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PermissionControl, useHasPermissions } from "@/components/permission-control";
import { ADMIN_MANAGER_ROLES } from "@/lib/access-control";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useOrdersPageLogic,
  OrdersSearchSection,
  OrdersTable,
} from "@/components/features/orders";

function OrderPageContent() {
  const { get } = useSearchParams();
  const logic = useOrdersPageLogic(get("created") || "");
  const canManageOrders = useHasPermissions(ADMIN_MANAGER_ROLES);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đơn hàng xuất kho"
        description="Quản lý đơn hàng và theo dõi tiến trình giao nhận."
        actions={
          <PermissionControl allowedRoles={["ADMIN", "WAREHOUSE_MANAGER"]}>
            <Button
              render={<Link href="/orders/new" />}
              nativeButton={false}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none"
            >
              <Plus className="mr-2 size-4" />
              Tạo đơn xuất
            </Button>
          </PermissionControl>
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
          datePreset={logic.datePreset}
          onDatePresetChange={(value) => {
            logic.setDatePreset(value);
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
          pageSize={logic.pageSize}
          onPageSizeChange={(nextSize) => {
            logic.setPageSize(nextSize);
            logic.setPage(0);
          }}
          canManageOrders={canManageOrders}
        />
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-[520px] w-full rounded-2xl" />
        </div>
      }
    >
      <OrderPageContent />
    </Suspense>
  );
}
