import { AdvancedFilterPanel } from "@/components/features/AdvancedFilters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryTreeSelectItems } from "@/components/features/CategoryTreeSelectItems";

interface ProductFiltersPanelProps {
  open: boolean;
  statusFilter: "" | "ACTIVE" | "INACTIVE";
  categoryFilter: string;
  warehouseFilter: string;
  advancedCount: number;
  onStatusChange: (status: "" | "ACTIVE" | "INACTIVE" | null) => void;
  onCategoryChange: (categoryId: string | null) => void;
  onWarehouseChange: (warehouseId: string | null) => void;
  categoryOptionsData: any;
  categoriesLoading: boolean;
  categoriesError: any;
  onRefetchCategories: () => void;
  warehouseOptionsData: any;
  warehousesLoading: boolean;
  warehousesError: any;
  onRefetchWarehouses: () => void;
}

export function ProductFiltersPanel({
  open,
  statusFilter,
  categoryFilter,
  warehouseFilter,
  advancedCount,
  onStatusChange,
  onCategoryChange,
  onWarehouseChange,
  categoryOptionsData,
  categoriesLoading,
  categoriesError,
  onRefetchCategories,
  warehouseOptionsData,
  warehousesLoading,
  warehousesError,
  onRefetchWarehouses,
}: ProductFiltersPanelProps) {
  return (
    <AdvancedFilterPanel
      open={open}
      summary={
        advancedCount > 0 ? (
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
            {statusFilter ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                Trạng thái:{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {statusFilter === "ACTIVE" ? "Hoạt động" : "Ngưng"}
                </span>
              </span>
            ) : null}
            {categoryFilter ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                Nhóm:{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {categoryOptionsData?.data?.content?.find(
                    (x: any) => x.id === categoryFilter
                  )?.code ??
                    categoryOptionsData?.data?.content?.find(
                      (x: any) => x.id === categoryFilter
                    )?.name ??
                    "—"}
                </span>
              </span>
            ) : null}
            {warehouseFilter ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                Kho:{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {warehouseOptionsData?.data?.content?.find(
                    (x: any) => x.id === warehouseFilter
                  )?.code ??
                    warehouseOptionsData?.data?.content?.find(
                      (x: any) => x.id === warehouseFilter
                    )?.name ??
                    "—"}
                </span>
              </span>
            ) : null}
          </div>
        ) : null
      }
    >
      <Select value={statusFilter} onValueChange={(v) => onStatusChange(v)}>
        <SelectTrigger className="h-10 w-full rounded-xl border border-slate-200 bg-white sm:w-42 dark:border-slate-800 dark:bg-slate-900">
          <SelectValue placeholder="Trạng thái">
            {(val) =>
              val === "ACTIVE"
                ? "Hoạt động"
                : val === "INACTIVE"
                  ? "Ngưng"
                  : "Tất cả trạng thái"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value="" className="rounded-lg">
            Tất cả trạng thái
          </SelectItem>
          <SelectItem value="ACTIVE" className="rounded-lg">
            Hoạt động
          </SelectItem>
          <SelectItem value="INACTIVE" className="rounded-lg">
            Ngưng
          </SelectItem>
        </SelectContent>
      </Select>

      <Select value={categoryFilter} onValueChange={(v) => onCategoryChange(v)}>
        <SelectTrigger className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white sm:max-w-60 sm:w-55 dark:border-slate-800 dark:bg-slate-900">
          <SelectValue
            placeholder={
              categoriesLoading
                ? "Đang tải nhóm..."
                : categoriesError
                  ? "Lỗi nhóm hàng"
                  : "Tất cả nhóm hàng"
            }
          >
            {(val) => {
              if (!val) return "Tất cả nhóm hàng";
              const c = categoryOptionsData?.data?.content?.find(
                (x: any) => x.id === val
              );
              return c ? `${c.name} (${c.code})` : "Đang tải…";
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-72 rounded-xl">
          {categoriesError ? (
            <div className="px-2 py-1.5 text-xs text-rose-500">
              Không tải được nhóm.
              <button
                type="button"
                onClick={() => onRefetchCategories()}
                className="ml-1 underline"
              >
                Thử lại
              </button>
            </div>
          ) : null}
          <SelectItem value="" className="rounded-lg">
            Tất cả nhóm hàng
          </SelectItem>
          {categoryOptionsData?.data?.content?.length ? (
            <CategoryTreeSelectItems
              categories={categoryOptionsData.data.content}
              itemClassName="rounded-lg"
            />
          ) : null}
        </SelectContent>
      </Select>

      <Select value={warehouseFilter} onValueChange={(v) => onWarehouseChange(v)}>
        <SelectTrigger className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white sm:max-w-60 sm:w-55 dark:border-slate-800 dark:bg-slate-900">
          <SelectValue
            placeholder={
              warehousesLoading
                ? "Đang tải kho..."
                : warehousesError
                  ? "Lỗi tải kho"
                  : "Tất cả kho"
            }
          >
            {(val) => {
              if (!val) return "Tất cả kho";
              const w = warehouseOptionsData?.data?.content?.find(
                (x: any) => x.id === val
              );
              return w ? `${w.name} (${w.code || "—"})` : "Đang tải…";
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-72 rounded-xl">
          {warehousesError ? (
            <div className="px-2 py-1.5 text-xs text-rose-500">
              Không tải được danh sách kho.
              <button
                type="button"
                onClick={() => onRefetchWarehouses()}
                className="ml-1 underline"
              >
                Thử lại
              </button>
            </div>
          ) : null}
          <SelectItem value="" className="rounded-lg">
            Tất cả kho
          </SelectItem>
          {warehouseOptionsData?.data?.content?.map((w: any) => (
            <SelectItem key={w.id} value={w.id} className="rounded-lg">
              {w.name} {w.code ? `(${w.code})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </AdvancedFilterPanel>
  );
}
