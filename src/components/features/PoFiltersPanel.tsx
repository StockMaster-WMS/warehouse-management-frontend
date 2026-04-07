"use client";

import { AdvancedFilterPanel } from "@/components/features/AdvancedFilters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Supplier } from "@/types/supplier";
import type { Warehouse } from "@/types/warehouse";

interface PoFiltersPanelProps {
  open: boolean;
  statusFilter: string;
  supplierFilter: string;
  warehouseFilter: string;
  advancedCount: number;
  onStatusChange: (status: string) => void;
  onSupplierChange: (supplierId: string) => void;
  onWarehouseChange: (warehouseId: string) => void;
  suppliers: Supplier[];
  warehouses: Warehouse[];
  statusOptions: readonly string[];
  statusLabels: Record<string, string>;
  suppliersLoading?: boolean;
  warehousesLoading?: boolean;
  suppliersError?: unknown;
  warehousesError?: unknown;
  onRefetchSuppliers?: () => void;
  onRefetchWarehouses?: () => void;
}

export function PoFiltersPanel({
  open,
  statusFilter,
  supplierFilter,
  warehouseFilter,
  advancedCount,
  onStatusChange,
  onSupplierChange,
  onWarehouseChange,
  suppliers,
  warehouses,
  statusOptions,
  statusLabels,
  suppliersLoading,
  warehousesLoading,
  suppliersError,
  warehousesError,
  onRefetchSuppliers,
  onRefetchWarehouses,
}: PoFiltersPanelProps) {
  const findById = <T extends { id: string }>(items: T[], id: string) => items.find(x => x.id === id);

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
                  {statusLabels[statusFilter] ?? statusFilter}
                </span>
              </span>
            ) : null}
            {supplierFilter ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                Nhà cung cấp:{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {findById(suppliers, supplierFilter)?.name ?? "—"}
                </span>
              </span>
            ) : null}
            {warehouseFilter ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                Kho nhận:{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {findById(warehouses, warehouseFilter)?.name ?? "—"}
                </span>
              </span>
            ) : null}
          </div>
        ) : null
      }
    >
      <Select
        value={statusFilter}
        onValueChange={(v) => onStatusChange(v || "")}
      >
        <SelectTrigger className="h-10 w-full rounded-xl border border-slate-200 bg-white sm:w-42 dark:border-slate-800 dark:bg-slate-900">
          <SelectValue placeholder="Tất cả trạng thái">
            {(val) => statusLabels[val as string] ?? "Tất cả trạng thái"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value="" className="rounded-lg">
            Tất cả trạng thái
          </SelectItem>
          {statusOptions.map((st) => (
            <SelectItem key={st} value={st} className="rounded-lg">
              {statusLabels[st] ?? st}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={supplierFilter}
        onValueChange={(v) => onSupplierChange(v || "")}
      >
        <SelectTrigger className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white sm:max-w-60 sm:w-55 dark:border-slate-800 dark:bg-slate-900">
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
              const s = findById(suppliers, val as string);
              return s ? `${s.name} (${s.code || "—"})` : "—";
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-72 rounded-xl">
          {suppliersError ? (
            <div className="px-2 py-1.5 text-xs text-rose-500">
              Không tải được NCC.
              <button
                type="button"
                onClick={() => onRefetchSuppliers?.()}
                className="ml-1 underline"
              >
                Thử lại
              </button>
            </div>
          ) : null}
          <SelectItem value="" className="rounded-lg">
            Tất cả nhà cung cấp
          </SelectItem>
          {suppliers.map((s) => (
            <SelectItem key={s.id} value={s.id} className="rounded-lg">
              {s.name} {s.code ? `(${s.code})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={warehouseFilter}
        onValueChange={(v) => onWarehouseChange(v || "")}
      >
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
              const w = findById(warehouses, val as string);
              return w ? `${w.name} (${w.code || "—"})` : "—";
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-72 rounded-xl">
          {warehousesError ? (
            <div className="px-2 py-1.5 text-xs text-rose-500">
              Không tải được danh sách kho.
              <button
                type="button"
                onClick={() => onRefetchWarehouses?.()}
                className="ml-1 underline"
              >
                Thử lại
              </button>
            </div>
          ) : null}
          <SelectItem value="" className="rounded-lg">
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
  );
}
