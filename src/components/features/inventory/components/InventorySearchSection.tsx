import { AdvancedFilterActions, AdvancedFilterPanel } from "@/components/features/AdvancedFilters";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InventoryTab } from "@/components/features/inventory/hooks/useInventoryPageLogic";

type WarehouseOption = { id: string; name: string; code?: string };

type InventorySearchSectionProps = {
  searchInput: string;
  onSearchChange: (value: string) => void;
  advancedOpen: boolean;
  onToggleAdvanced: () => void;
  advancedCount: number;
  hasAnyFilter: boolean;
  onClearFilters: () => void;
  warehouseId: string;
  onWarehouseChange: (value: string) => void;
  alertType: InventoryTab;
  onAlertTypeChange: (value: InventoryTab) => void;
  warehouses: WarehouseOption[];
  isWarehousesLoading: boolean;
  noContainer?: boolean;
};

const ALERT_TYPE_LABELS: Record<InventoryTab, string> = {
  "stock": "Tất cả tồn kho",
  "low-stock": "Tồn kho thấp",
  "near-expiry": "Sắp hết hạn",
};

export function InventorySearchSection({
  searchInput,
  onSearchChange,
  advancedOpen,
  onToggleAdvanced,
  advancedCount,
  hasAnyFilter,
  onClearFilters,
  warehouseId,
  onWarehouseChange,
  alertType,
  onAlertTypeChange,
  warehouses,
  isWarehousesLoading,
  noContainer = false,
}: InventorySearchSectionProps) {
  const showFilters = advancedOpen || advancedCount > 0;

  const warehouseLabel = warehouseId
    ? warehouses.find((w) => w.id === warehouseId)?.name ?? "—"
    : "Tất cả kho";

  const alertTypeLabel = alertType !== "stock" ? ALERT_TYPE_LABELS[alertType] : "";

  return (
    <SearchToolbar
      noContainer={noContainer}
      placeholder="Tìm theo mã hàng, tên sản phẩm, vị trí..."
      className="max-w-full"
      value={searchInput}
      onValueChange={onSearchChange}
      right={
        <AdvancedFilterActions
          open={advancedOpen}
          onToggle={onToggleAdvanced}
          activeCount={advancedCount}
          hasAnyFilter={hasAnyFilter}
          onClear={onClearFilters}
        />
      }
      filters={
        showFilters ? (
          <AdvancedFilterPanel
            open={advancedOpen}
            summary={
              advancedCount > 0 ? (
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                  {warehouseLabel ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                      Kho:{" "}
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {warehouseLabel}
                      </span>
                    </span>
                  ) : null}
                  {alertTypeLabel ? (
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-100 dark:border-amber-900/30">
                      Loại: <span className="font-semibold">{alertTypeLabel}</span>
                    </span>
                  ) : null}
                </div>
              ) : null
            }
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Select
                value={warehouseId || "all"}
                onValueChange={(v) => onWarehouseChange(v === "all" ? "" : (v ?? ""))}
              >
                <SelectTrigger className="h-10 w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80 sm:w-56">
                  <SelectValue
                    placeholder={isWarehousesLoading ? "Đang tải kho..." : "Chọn kho"}
                  >
                    {warehouseLabel}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-slate-200 shadow-xl dark:border-slate-800">
                  <SelectItem value="all" className="rounded-lg">
                    Tất cả kho
                  </SelectItem>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id} className="rounded-lg">
                      {w.name} {w.code ? `(${w.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={alertType}
                onValueChange={(v) => onAlertTypeChange(v as InventoryTab)}
              >
                <SelectTrigger className="h-10 w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80 sm:w-48">
                  <SelectValue placeholder="Loại tồn kho">
                    {ALERT_TYPE_LABELS[alertType]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-slate-200 shadow-xl dark:border-slate-800">
                  <SelectItem value="stock" className="rounded-lg">Tất cả tồn kho</SelectItem>
                  <SelectItem value="low-stock" className="rounded-lg">Tồn kho thấp</SelectItem>
                  <SelectItem value="near-expiry" className="rounded-lg">Sắp hết hạn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </AdvancedFilterPanel>
        ) : null
      }
    />
  );
}
