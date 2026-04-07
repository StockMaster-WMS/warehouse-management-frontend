import { AdvancedFilterActions, AdvancedFilterPanel } from "@/components/features/AdvancedFilters";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  warehouses: WarehouseOption[];
  isWarehousesLoading: boolean;
  noContainer?: boolean;
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
  warehouses,
  isWarehousesLoading,
  noContainer = false,
}: InventorySearchSectionProps) {
  const showFilters = advancedOpen || advancedCount > 0;

  const warehouseLabel = warehouseId
    ? warehouses.find((w) => w.id === warehouseId)?.name ?? "—"
    : "";

  const warehouseItems = [
    { value: "__all__", label: "Tất cả kho" },
    ...warehouses.map((w) => ({
      value: w.id,
      label: `${w.name}${w.code ? ` (${w.code})` : ""}`,
    })),
  ];

  return (
    <SearchToolbar
      noContainer={noContainer}
      placeholder="Tìm theo SKU, tên sản phẩm, vị trí..."
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
                </div>
              ) : null
            }
          >
            <Select
              value={warehouseId || "__all__"}
              onValueChange={(v) => onWarehouseChange(v === "__all__" ? "" : (v ?? ""))}
              items={warehouseItems}
            >
              <SelectTrigger className="h-10 w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80 sm:w-56">
                <SelectValue
                  placeholder={isWarehousesLoading ? "Đang tải kho..." : "Kho"}
                />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-slate-200 shadow-xl dark:border-slate-800">
                <SelectItem value="__all__" className="rounded-lg">
                  Tất cả kho
                </SelectItem>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id} className="rounded-lg">
                    {w.name} {w.code ? `(${w.code})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AdvancedFilterPanel>
        ) : null
      }
    />
  );
}
