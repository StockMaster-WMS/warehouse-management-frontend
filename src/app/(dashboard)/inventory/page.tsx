"use client";

import { useState } from "react";
import { FileSpreadsheet, Wrench, History } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { apiErrMessage } from "@/types/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InventorySummaryCards,
  InventoryStockTable,
  StockAdjustDialog,
  InventorySearchSection,
  useInventoryPageLogic,
  StockMovementsTable,
  HistorySearchSection,
  useStockMovementsPageLogic,
} from "@/components/features/inventory";
import { cn } from "@/lib/utils";
import { PermissionControl } from "@/components/permission-control";
import { ADMIN_MANAGER_ROLES } from "@/lib/access-control";

function HistoryModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const logic = useStockMovementsPageLogic();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] overflow-y-auto w-[95vw] sm:max-w-[1400px] rounded-2xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">Lịch sử biến động tồn kho</DialogTitle>
          <DialogDescription>Theo dõi mọi thay đổi nhập kho, xuất kho, giữ chỗ và nhả chỗ.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
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
            isFetching={logic.isFetching}
            onRefresh={() => logic.refetch()}
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
            onPageSizeChange={(nextSize) => {
              logic.setPageSize(nextSize);
              logic.setPage(0);
            }}
            onRetry={() => logic.refetch()}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function InventoryPage() {
  const logic = useInventoryPageLogic();
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Theo dõi tồn kho"
        description="Giám sát tồn kho theo kho, vị trí, cảnh báo tồn thấp và hàng sắp hết hạn."
        actions={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 rounded-xl border-slate-200 sm:flex-none"
              onClick={() => setHistoryOpen(true)}
            >
              <History className="size-4 text-indigo-600" />
              Lịch sử biến động
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={
                logic.activeTab === "near-expiry"
                  ? logic.handleExportNearExpiry
                  : logic.activeTab === "out-of-stock"
                    ? logic.handleExportOutOfStock
                  : logic.activeTab === "low-stock"
                    ? logic.handleExportLowStock
                    : logic.handleExportStock
              }
            >
              <FileSpreadsheet
                className={cn(
                  "mr-1.5 size-4",
                  logic.activeTab === "near-expiry"
                    ? "text-rose-600"
                    : logic.activeTab === "out-of-stock"
                      ? "text-red-600"
                    : logic.activeTab === "low-stock"
                      ? "text-amber-600"
                      : "text-emerald-600",
                )}
              />
              {logic.activeTab === "near-expiry"
                ? "Xuất hết hạn"
                : logic.activeTab === "out-of-stock"
                  ? "Xuất hết hàng"
                : logic.activeTab === "low-stock"
                  ? "Xuất tồn thấp"
                  : "Xuất Excel"}
            </Button>
            <PermissionControl allowedRoles={ADMIN_MANAGER_ROLES}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={() => logic.openAdjustDialog("qty")}
              >
                <Wrench className="mr-1.5 size-4" />
                Điều chỉnh tồn
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={() => logic.openAdjustDialog("reserved")}
              >
                <Wrench className="mr-1.5 size-4" />
                Điều chỉnh giữ chỗ
              </Button>
            </PermissionControl>
          </div>
        }
      />

      <InventorySummaryCards
        summary={logic.summary}
        isLoading={logic.isSummaryLoading}
        onTabChange={logic.setActiveTab}
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <InventorySearchSection
          noContainer
          searchInput={logic.searchInput}
          onSearchChange={(v) => {
            logic.setSearchInput(v);
            logic.setPage(0);
          }}
          advancedOpen={logic.advancedOpen}
          onToggleAdvanced={() => logic.setAdvancedOpen((prev) => !prev)}
          advancedCount={logic.advancedCount}
          hasAnyFilter={logic.hasAnyFilter}
          onClearFilters={() => {
            logic.clearFilters();
            logic.setAdvancedOpen(false);
          }}
          warehouseId={logic.warehouseId}
          onWarehouseChange={(v) => {
            logic.setWarehouseId(v);
            logic.setPage(0);
          }}
          alertType={logic.activeTab}
          onAlertTypeChange={logic.setActiveTab}
          warehouses={logic.warehouses}
          isWarehousesLoading={logic.isWarehousesLoading}
          isFetching={logic.isDataFetching}
          onRefresh={logic.refetchAll}
        />

        <InventoryStockTable
          noContainer
          items={logic.displayItems}
          page={logic.page}
          pageSize={logic.pageSize}
          totalPages={logic.displayTotalPages}
          totalElements={logic.displayTotalElements}
          canGoPrev={logic.canGoPrev}
          canGoNext={logic.canGoNext}
          isLoading={logic.isDataLoading}
          isFetching={logic.isDataFetching}
          errorMessage={
            logic.itemsError
              ? apiErrMessage(logic.itemsError, "Không thể tải dữ liệu tồn kho")
              : null
          }
          onPrevPage={() => logic.setPage((p) => Math.max(0, p - 1))}
          onNextPage={() => logic.setPage((p) => p + 1)}
          onPageSizeChange={(nextSize) => {
            logic.setPageSize(nextSize);
            logic.setPage(0);
          }}
          onRetry={logic.refetchAll}
        />
      </div>

      <StockAdjustDialog
        open={logic.adjustDialogOpen}
        onOpenChange={logic.setAdjustDialogOpen}
        adjustType={logic.adjustType}
        formState={logic.adjustForm}
        setFormState={logic.setAdjustForm}
        isSubmitting={logic.isAdjusting}
        onSubmit={logic.handleAdjustSubmit}
        warehouses={logic.warehouses}
        locations={logic.adjustLocations}
        isLocationsLoading={logic.isLocationsLoading}
        products={logic.adjustProducts}
        isProductsLoading={logic.isProductsLoading}
      />

      {historyOpen && (
        <HistoryModal open={historyOpen} onOpenChange={setHistoryOpen} />
      )}
    </div>
  );
}
