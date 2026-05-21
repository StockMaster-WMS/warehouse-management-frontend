"use client";

import { Building2, CalendarDays, CheckCircle2, Loader2, Lock, PackagePlus, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { cn } from "@/lib/utils";
import type { Warehouse as WarehouseType } from "@/types/warehouse";

export interface PoHeaderFormProps {
  supplierId: string;
  setSupplierId: (v: string) => void;
  warehouseId: string;
  setWarehouseId: (v: string) => void;
  orderDate: string;
  setOrderDate: (v: string) => void;
  expectedDate: string;
  setExpectedDate: (v: string) => void;
  totalAmountStr: string;
  setTotalAmountStr: (v: string) => void;
  headerErrors: Record<string, string>;
  headerLocked: boolean;
  savingHeader: boolean;
  savedPoNumber: string | null;
  savedStatus: string | null;
  purchaseOrderId: string | null;
  suppliers: { id: string | number; name: string }[];
  supplierOptions: { value: string; label: string }[];
  warehouses: WarehouseType[];
  suppliersErr: boolean;
  suppliersLoading: boolean;
  warehousesErr: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
      {children}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{msg}</p>;
}

export function PoHeaderForm({
  supplierId,
  setSupplierId,
  warehouseId,
  setWarehouseId,
  orderDate,
  setOrderDate,
  expectedDate,
  setExpectedDate,
  totalAmountStr,
  setTotalAmountStr,
  headerErrors,
  headerLocked,
  savingHeader,
  savedPoNumber,
  savedStatus,
  purchaseOrderId,
  supplierOptions,
  warehouses,
  suppliersErr,
  suppliersLoading,
  warehousesErr,
  onSubmit,
}: PoHeaderFormProps) {
  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40">
            <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400">1</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Thông tin đơn nhập</h3>
            <p className="text-xs text-slate-400">Nhà cung cấp, kho nhận và ngày tháng</p>
          </div>
        </div>
        {headerLocked && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900">
            <Lock className="size-3" />
            Đã lưu
          </span>
        )}
      </div>

      <div className="p-6">
        {/* Success Banner */}
        {headerLocked && savedPoNumber && (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/30">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                Đã tạo đơn: <span className="font-mono">{savedPoNumber}</span>
              </p>
              <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70 font-mono truncate">
                ID: {purchaseOrderId} · Trạng thái: {savedStatus}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Supplier */}
          <div>
            <FieldLabel required>Nhà cung cấp</FieldLabel>
            <SearchableSelect
              id="po-supplier"
              value={supplierId}
              onValueChange={(v) => setSupplierId(v)}
              options={supplierOptions}
              placeholder={
                suppliersErr ? "Lỗi tải NCC"
                  : suppliersLoading ? "Đang tải…"
                  : "Chọn nhà cung cấp"
              }
              searchPlaceholder="Tên nhà cung cấp…"
              emptyText="Không tìm thấy NCC"
              disabled={headerLocked || suppliersErr || suppliersLoading}
              loading={suppliersLoading}
              error={Boolean(headerErrors.supplierId)}
              icon={<Building2 className="size-4" />}
              dialogTitle="Chọn nhà cung cấp"
            />
            {suppliersErr && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">Không tải được danh sách nhà cung cấp.</p>
            )}
            <FieldError msg={headerErrors.supplierId} />
          </div>

          {/* Warehouse */}
          <div>
            <FieldLabel required>Kho nhận hàng</FieldLabel>
            <Select
              value={warehouseId}
              onValueChange={(v) => setWarehouseId(v ?? "")}
              disabled={headerLocked || warehousesErr}
            >
              <SelectTrigger className={cn(
                "rounded-xl h-10",
                headerErrors.warehouseId && "border-rose-400 focus:ring-rose-400/20",
              )}>
                <Warehouse className="size-4 mr-2 text-slate-400 shrink-0" />
                <span className="flex flex-1 truncate text-left">
                  {warehouseId
                    ? (warehouses.find((w) => w.id === warehouseId)?.name ?? warehouseId)
                    : warehousesErr ? "Lỗi tải kho"
                    : "Chọn kho nhận hàng"}
                </span>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id} className="rounded-lg">
                    {w.name} {w.code ? `(${w.code})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {warehousesErr && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">Không tải được danh sách kho.</p>
            )}
            <FieldError msg={headerErrors.warehouseId} />
          </div>

          {/* Order Date */}
          <div>
            <FieldLabel required>Ngày đặt hàng</FieldLabel>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                disabled={headerLocked}
                className={cn("pl-9 rounded-xl h-10", headerErrors.orderDate && "border-rose-400")}
              />
            </div>
            <FieldError msg={headerErrors.orderDate} />
          </div>

          {/* Expected Date */}
          <div>
            <FieldLabel>Ngày dự kiến nhận</FieldLabel>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                disabled={headerLocked}
                className="pl-9 rounded-xl h-10"
              />
            </div>
          </div>

          {/* Total Amount */}
          <div className="md:col-span-2">
            <FieldLabel>Tổng tiền ước tính <span className="text-slate-400 font-normal text-xs">(tuỳ chọn)</span></FieldLabel>
            <div className="relative max-w-xs">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₫</span>
              <Input
                value={totalAmountStr}
                onChange={(e) => setTotalAmountStr(e.target.value)}
                disabled={headerLocked}
                placeholder="0"
                inputMode="decimal"
                className={cn("pl-7 rounded-xl h-10", headerErrors.totalAmountStr && "border-rose-400")}
              />
            </div>
            <FieldError msg={headerErrors.totalAmountStr} />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button
            type="submit"
            disabled={headerLocked || savingHeader}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 gap-1.5"
          >
            {savingHeader
              ? <Loader2 className="size-4 animate-spin" />
              : <PackagePlus className="size-4" />}
            {headerLocked ? "Đã lưu đơn" : "Lưu đơn nhập"}
          </Button>
          {!headerLocked && (
            <p className="text-xs text-slate-400">Sau khi lưu, bạn sẽ có thể thêm dòng hàng bên dưới</p>
          )}
        </div>
      </div>
    </form>
  );
}
