import { AdvancedFilterActions, AdvancedFilterPanel } from "@/components/features/AdvancedFilters";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOVEMENT_TYPE_OPTIONS } from "@/components/features/inventory/constants";

type WarehouseOption = { id: string; name: string; code?: string };

type HistorySearchSectionProps = {
  advancedOpen: boolean;
  onToggleAdvanced: () => void;
  advancedCount: number;
  hasAnyFilter: boolean;
  onClearFilters: () => void;
  warehouseId: string;
  onWarehouseChange: (value: string) => void;
  warehouses: WarehouseOption[];
  isWarehousesLoading: boolean;
  movementType: string;
  onMovementTypeChange: (value: string) => void;
  fromDate: string;
  onFromDateChange: (value: string) => void;
  toDate: string;
  onToDateChange: (value: string) => void;
  noContainer?: boolean;
};

function getMovementTypeLabel(value: string) {
  return MOVEMENT_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? "";
}

export function HistorySearchSection({
  advancedOpen,
  onToggleAdvanced,
  advancedCount,
  hasAnyFilter,
  onClearFilters,
  warehouseId,
  onWarehouseChange,
  warehouses,
  isWarehousesLoading,
  movementType,
  onMovementTypeChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  noContainer = false,
}: HistorySearchSectionProps) {
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

  const movementTypeItems = MOVEMENT_TYPE_OPTIONS.map((opt) => ({
    value: opt.value || "__all__",
    label: opt.label,
  }));

  return (
    <SearchToolbar
      noContainer={noContainer}
      placeholder="Lịch sử biến động tồn kho"
      className="max-w-full"
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
                  {movementType ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                      Loại:{" "}
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {getMovementTypeLabel(movementType)}
                      </span>
                    </span>
                  ) : null}
                  {fromDate ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                      Từ:{" "}
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {fromDate}
                      </span>
                    </span>
                  ) : null}
                  {toDate ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                      Đến:{" "}
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {toDate}
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
              <SelectTrigger className="h-10 w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80 sm:w-52">
                <SelectValue
                  placeholder={isWarehousesLoading ? "Đang tải kho..." : "Chọn kho"}
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

            <Select
              value={movementType || "__all__"}
              onValueChange={(v) => onMovementTypeChange(v === "__all__" ? "" : (v ?? ""))}
              items={movementTypeItems}
            >
              <SelectTrigger className="h-10 w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80 sm:w-44">
                <SelectValue placeholder="Loại biến động" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-slate-200 shadow-xl dark:border-slate-800">
                {MOVEMENT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value || "__all__"}
                    value={opt.value || "__all__"}
                    className="rounded-lg"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Từ:</span>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => onFromDateChange(e.target.value)}
                className="h-10 w-40 rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Đến:</span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => onToDateChange(e.target.value)}
                className="h-10 w-40 rounded-xl"
              />
            </div>
          </AdvancedFilterPanel>
        ) : null
      }
    />
  );
}
