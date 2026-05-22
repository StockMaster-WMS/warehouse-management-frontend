import { FileSpreadsheet } from "lucide-react";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { Button } from "@/components/ui/button";
import { TableRefreshButton } from "@/components/ui/table-refresh-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type WarehouseOption = { id: string; name: string; code?: string };

type InventoryFiltersProps = {
  searchInput: string;
  onSearchChange: (value: string) => void;
  warehouseId: string;
  onWarehouseChange: (value: string) => void;
  warehouses: WarehouseOption[];
  isWarehousesLoading: boolean;
  onExportStock: () => void;
  onExportNearExpiry?: () => void;
  showExportNearExpiry?: boolean;
  isFetching?: boolean;
  onRefresh?: () => void;
};

export function InventoryFilters({
  searchInput,
  onSearchChange,
  warehouseId,
  onWarehouseChange,
  warehouses,
  isWarehousesLoading,
  onExportStock,
  onExportNearExpiry,
  showExportNearExpiry,
  isFetching = false,
  onRefresh,
}: InventoryFiltersProps) {
  const warehouseLabel = warehouseId
    ? warehouses.find((w) => w.id === warehouseId)?.name ?? "—"
    : "Tất cả kho";

  return (
    <SearchToolbar
      placeholder="Tìm theo mã hàng, tên sản phẩm, vị trí..."
      value={searchInput}
      onValueChange={onSearchChange}
      right={
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {onRefresh ? <TableRefreshButton isFetching={isFetching} onRefresh={onRefresh} /> : null}
          <Select
            value={warehouseId || "all"}
            onValueChange={(v) => onWarehouseChange(v === "all" ? "" : (v ?? ""))}
          >
            <SelectTrigger className="h-10 w-full rounded-xl sm:w-56">
              <SelectValue
                placeholder={isWarehousesLoading ? "Đang tải kho..." : "Chọn kho"}
              >
                {warehouseLabel}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả kho</SelectItem>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name} {w.code ? `(${w.code})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 rounded-xl"
            onClick={onExportStock}
          >
            <FileSpreadsheet className="mr-1.5 size-4 text-emerald-600" />
            Xuất Excel
          </Button>

          {showExportNearExpiry && onExportNearExpiry ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 rounded-xl"
              onClick={onExportNearExpiry}
            >
              <FileSpreadsheet className="mr-1.5 size-4 text-rose-600" />
              Xuất hết hạn
            </Button>
          ) : null}
        </div>
      }
    />
  );
}
