"use client";

import { PageHeader } from "@/components/page-header";
import { apiErrMessage } from "@/types/api";
import {
  StockMovementsTable,
  HistorySearchSection,
  useStockMovementsPageLogic,
} from "@/components/features/inventory";

export default function HistoryPage() {
  const logic = useStockMovementsPageLogic();

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Lịch sử biến động tồn kho"
        description="Theo dõi mọi thay đổi nhập kho, xuất kho, giữ chỗ và nhả chỗ."
      />

      <HistorySearchSection
        advancedOpen={logic.advancedOpen}
        onToggleAdvanced={() => logic.setAdvancedOpen((prev) => !prev)}
        advancedCount={logic.advancedCount}
        hasAnyFilter={logic.hasAnyFilter}
        onClearFilters={() => {
          logic.clearFilters();
          logic.setAdvancedOpen(false);
        }}
        warehouseId={logic.warehouseId}
        onWarehouseChange={logic.setWarehouseId}
        warehouses={logic.warehouses}
        isWarehousesLoading={logic.isWarehousesLoading}
        movementType={logic.movementType}
        onMovementTypeChange={logic.setMovementType}
        fromDate={logic.fromDate}
        onFromDateChange={logic.setFromDate}
        toDate={logic.toDate}
        onToDateChange={logic.setToDate}
      />

      <StockMovementsTable
        items={logic.movements}
        page={logic.page}
        pageSize={logic.pageSize}
        totalPages={logic.totalPages}
        totalElements={logic.totalElements}
        canGoPrev={logic.canGoPrev}
        canGoNext={logic.canGoNext}
        isLoading={logic.isLoading}
        isFetching={logic.isFetching}
        errorMessage={
          logic.error ? apiErrMessage(logic.error, "Không thể tải lịch sử biến động") : null
        }
        onPrevPage={() => logic.setPage((p) => Math.max(0, p - 1))}
        onNextPage={() => logic.setPage((p) => p + 1)}
        onRetry={() => logic.refetch()}
      />
    </div>
  );
}
