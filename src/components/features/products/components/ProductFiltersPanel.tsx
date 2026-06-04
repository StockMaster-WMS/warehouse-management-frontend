import { AdvancedFilterPanel } from "@/components/features/AdvancedFilters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryTreeSelectItems } from "@/components/features/CategoryTreeSelectItems";
import type { ApiResponse, PagedResponse } from "@/types/api";
import type { Category } from "@/types/category";
import type { Warehouse } from "@/types/warehouse";
import type { Supplier } from "@/types/supplier";

type OptionResponse<T> = ApiResponse<PagedResponse<T>> | undefined;

function findById<T extends { id: string }>(items: T[] | undefined, id: string) {
  return items?.find((item) => item.id === id);
}

interface ProductFiltersPanelProps {
  open: boolean;
  statusFilter: "" | "ACTIVE" | "INACTIVE";
  categoryFilter: string;
  warehouseFilter: string;
  supplierFilter: string;
  advancedCount: number;
  onStatusChange: (status: "" | "ACTIVE" | "INACTIVE" | null) => void;
  onCategoryChange: (categoryId: string | null) => void;
  onWarehouseChange: (warehouseId: string | null) => void;
  onSupplierChange: (supplierId: string | null) => void;
  categoryOptionsData: OptionResponse<Category>;
  categoriesLoading: boolean;
  categoriesError: unknown;
  onRefetchCategories: () => void;
  warehouseOptionsData: OptionResponse<Warehouse>;
  warehousesLoading: boolean;
  warehousesError: unknown;
  onRefetchWarehouses: () => void;
  supplierOptionsData: OptionResponse<Supplier>;
  suppliersLoading: boolean;
  suppliersError: unknown;
  onRefetchSuppliers: () => void;
}

export function ProductFiltersPanel({
  open,
  statusFilter,
  categoryFilter,
  warehouseFilter,
  supplierFilter,
  advancedCount,
  onStatusChange,
  onCategoryChange,
  onWarehouseChange,
  onSupplierChange,
  categoryOptionsData,
  categoriesLoading,
  categoriesError,
  onRefetchCategories,
  warehouseOptionsData,
  warehousesLoading,
  warehousesError,
  onRefetchWarehouses,
  supplierOptionsData,
  suppliersLoading,
  suppliersError,
  onRefetchSuppliers,
}: ProductFiltersPanelProps) {
  const categoryItems = categoryOptionsData?.data?.content;
  const warehouseItems = warehouseOptionsData?.data?.content;
  const supplierItems = supplierOptionsData?.data?.content;

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
                  {findById(categoryItems, categoryFilter)?.code ??
                    findById(categoryItems, categoryFilter)?.name ??
                    "—"}
                </span>
              </span>
            ) : null}
            {warehouseFilter ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                Kho:{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {findById(warehouseItems, warehouseFilter)?.code ??
                    findById(warehouseItems, warehouseFilter)?.name ??
                    "—"}
                </span>
              </span>
            ) : null}
            {supplierFilter ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                NCC:{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {findById(supplierItems, supplierFilter)?.name ??
                    findById(supplierItems, supplierFilter)?.code ??
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
              const c = findById(categoryItems, val);
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
          {categoryItems?.length ? (
            <CategoryTreeSelectItems
              categories={categoryItems}
              itemClassName="rounded-lg"
            />
          ) : null}
        </SelectContent>
      </Select>

      <Select value={supplierFilter} onValueChange={(v) => onSupplierChange(v)}>
        <SelectTrigger className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white sm:max-w-64 sm:w-60 dark:border-slate-800 dark:bg-slate-900">
          <SelectValue
            placeholder={
              suppliersLoading
                ? "Đang tải NCC..."
                : suppliersError
                  ? "Lỗi tải NCC"
                  : "Tất cả nhà cung cấp"
            }
          >
            {(val) => {
              if (!val) return "Tất cả nhà cung cấp";
              const s = findById(supplierItems, val);
              return s ? `${s.name} (${s.code || "—"})` : "Đang tải…";
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-72 rounded-xl">
          {suppliersError ? (
            <div className="px-2 py-1.5 text-xs text-rose-500">
              Không tải được danh sách nhà cung cấp.
              <button
                type="button"
                onClick={() => onRefetchSuppliers()}
                className="ml-1 underline"
              >
                Thử lại
              </button>
            </div>
          ) : null}
          <SelectItem value="" className="rounded-lg">
            Tất cả nhà cung cấp
          </SelectItem>
          {supplierItems?.map((s) => (
            <SelectItem key={s.id} value={s.id} className="rounded-lg">
              {s.name} {s.code ? `(${s.code})` : ""}
            </SelectItem>
          ))}
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
              const w = findById(warehouseItems, val);
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
          {warehouseItems?.map((w) => (
            <SelectItem key={w.id} value={w.id} className="rounded-lg">
              {w.name} {w.code ? `(${w.code})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </AdvancedFilterPanel>
  );
}
