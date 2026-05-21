"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PermissionControl, useHasPermissions } from "@/components/permission-control";
import { ADMIN_MANAGER_ROLES } from "@/lib/access-control";
import { DeleteConfirmDialog } from "@/components/features/DeleteConfirmDialog";
import {
  CustomersList,
  CustomersSearchSection,
  CustomersStatsGrid,
  useCustomersPageLogic,
} from "@/components/features/customers";

export default function CustomersPage() {
  const logic = useCustomersPageLogic();
  const canManageCustomers = useHasPermissions(ADMIN_MANAGER_ROLES);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Khách hàng"
        description="Duy trì mối quan hệ và quản lý thông tin khách hàng/nhà cung cấp."
        actions={
          <PermissionControl allowedRoles={ADMIN_MANAGER_ROLES}>
            <Button
              render={<Link href="/customers/new" />}
              nativeButton={false}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Thêm mới
            </Button>
          </PermissionControl>
        }
      />

      <CustomersStatsGrid
        total={logic.paged?.total_elements ?? 0}
        activeOnPage={logic.activeRowsCount}
        inactiveOnPage={logic.inactiveRowsCount}
        pageLabel={
          logic.paged
            ? `${logic.paged.page + 1}/${Math.max(logic.paged.total_pages, 1)} · ${logic.paged.size}`
            : "—"
        }
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col">
        <CustomersSearchSection
          noContainer
          searchInput={logic.searchInput}
          onSearchChange={(value) => {
            logic.setSearchInput(value);
            logic.setPage(0);
          }}
          statusFilter={logic.statusFilter}
          onStatusChange={(value) => {
            logic.setStatusFilter(value);
            logic.setPage(0);
          }}
          advancedOpen={logic.advancedOpen}
          onToggleAdvanced={() => logic.setAdvancedOpen((v) => !v)}
          advancedCount={logic.advancedCount}
          hasAnyFilter={logic.hasAnyFilter}
          onClearFilters={logic.clearFilters}
        />

        <CustomersList
          noContainer
          rows={logic.rows}
          page={logic.page}
          totalElements={logic.paged?.total_elements ?? logic.rows.length}
          totalPages={logic.paged?.total_pages ?? 1}
          pageSize={logic.pageSize}
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
          onPageSizeChange={(nextSize) => {
            logic.setPageSize(nextSize);
            logic.setPage(0);
          }}
          onRequestDelete={logic.openDeleteDialog}
          canManageCustomers={canManageCustomers}
        />
      </div>

      <DeleteConfirmDialog
        open={logic.isDeleteDialogOpen}
        onOpenChange={logic.setIsDeleteDialogOpen}
        onConfirm={logic.handleDelete}
        itemName={logic.deleteTarget?.name ?? ""}
        title="Xóa hồ sơ khách hàng"
        description="Xóa khách hàng sẽ gỡ bỏ lịch sử giao dịch liên quan. Hãy cân nhắc kỹ."
      />
    </div>
  );
}
