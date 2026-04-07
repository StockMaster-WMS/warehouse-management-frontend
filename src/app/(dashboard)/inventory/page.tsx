"use client";

import { FileSpreadsheet, Wrench } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { apiErrMessage } from "@/types/api";
import {
  InventorySummaryCards,
  InventoryStockTable,
  LowStockTable,
  NearExpiryTable,
  StockAdjustDialog,
  InventoryTabs,
  InventorySearchSection,
  useInventoryPageLogic,
} from "@/components/features/inventory";

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
              onClick={logic.handleExportStock}
            >
              <FileSpreadsheet className="mr-1.5 h-4 w-4 text-emerald-600" />
              Xuất Excel
            </Button>
            {logic.activeTab === "near-expiry" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={logic.handleExportNearExpiry}
              >
                <FileSpreadsheet className="mr-1.5 h-4 w-4 text-rose-600" />
                Xuất hết hạn
              </Button>
            )}
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

      <InventoryTabs activeTab={logic.activeTab} onTabChange={logic.setActiveTab} />

      {logic.activeTab === "stock" ? (
        <>
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
            warehouses={logic.warehouses}
            isWarehousesLoading={logic.isWarehousesLoading}
          />

          <InventoryStockTable
            items={logic.stockList}
            page={logic.page}
            totalPages={logic.stockTotalPages}
            totalElements={logic.stockTotalElements}
            canGoPrev={logic.canGoPrev}
            canGoNext={logic.canGoNext}
            isLoading={logic.isStockListLoading}
            isFetching={logic.isStockListFetching}
            errorMessage={
              logic.stockListError
                ? apiErrMessage(logic.stockListError, "Không thể tải dữ liệu tồn kho")
                : null
            }
            onPrevPage={() => logic.setPage((p) => Math.max(0, p - 1))}
            onNextPage={() => logic.setPage((p) => p + 1)}
            onRetry={() => logic.refetchStockList()}
          />
        </>
      ) : null}

      {logic.activeTab === "low-stock" ? (
        <LowStockTable
          items={logic.lowStockItems}
          isLoading={logic.isLowStockLoading}
          errorMessage={
            logic.lowStockError
              ? apiErrMessage(logic.lowStockError, "Không thể tải cảnh báo tồn kho thấp")
              : null
          }
          onRetry={() => logic.refetchLowStock()}
        />
      ) : null}

      {logic.activeTab === "near-expiry" ? (
        <div className="space-y-4">
          <InventorySearchSection
            searchInput=""
            onSearchChange={() => {}}
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
          />
          <NearExpiryTable
            items={logic.nearExpiryItems}
            isLoading={logic.isNearExpiryLoading}
            errorMessage={
              logic.nearExpiryError
                ? apiErrMessage(logic.nearExpiryError, "Không thể tải cảnh báo hàng sắp hết hạn")
                : null
            }
            onRetry={() => logic.refetchNearExpiry()}
          />
        </div>
      ) : null}

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
