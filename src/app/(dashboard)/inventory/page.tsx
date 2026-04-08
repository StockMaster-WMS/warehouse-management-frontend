"use client";

import { FileSpreadsheet, Wrench } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { apiErrMessage } from "@/types/api";
import {
  InventorySummaryCards,
  InventoryStockTable,
  StockAdjustDialog,
  InventorySearchSection,
  useInventoryPageLogic,
} from "@/components/features/inventory";
import { cn } from "@/lib/utils";

export default function InventoryPage() {
  const logic = useInventoryPageLogic();

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Theo dõi tồn kho"
        description="Giám sát tồn kho theo kho, vị trí, cảnh báo tồn thấp và hàng sắp hết hạn."
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={
                logic.activeTab === "near-expiry"
                  ? logic.handleExportNearExpiry
                  : logic.activeTab === "low-stock"
                    ? logic.handleExportLowStock
                    : logic.handleExportStock
              }
            >
              <FileSpreadsheet
                className={cn(
                  "mr-1.5 h-4 w-4",
                  logic.activeTab === "near-expiry"
                    ? "text-rose-600"
                    : logic.activeTab === "low-stock"
                      ? "text-amber-600"
                      : "text-emerald-600",
                )}
              />
              {logic.activeTab === "near-expiry"
                ? "Xuất hết hạn"
                : logic.activeTab === "low-stock"
                  ? "Xuất tồn thấp"
                  : "Xuất Excel"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => logic.openAdjustDialog("qty")}
            >
              <Wrench className="mr-1.5 h-4 w-4" />
              Điều chỉnh tồn
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => logic.openAdjustDialog("reserved")}
            >
              <Wrench className="mr-1.5 h-4 w-4" />
              Điều chỉnh giữ chỗ
            </Button>
          </div>
        }
      />

      <InventorySummaryCards
        summary={logic.summary}
        isLoading={logic.isSummaryLoading}
        onTabChange={logic.setActiveTab}
      />

      <InventorySearchSection
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
      />

      <div className="mt-2">
        <InventoryStockTable
          items={logic.displayItems}
          page={logic.page}
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
    </div>
  );
}
