"use client";

import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { Warehouse } from "@/types/warehouse";

export interface PoHeaderFormProps {
  poNumber: string;
  setPoNumber: (v: string) => void;
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
  warehouses: Warehouse[];
  suppliersErr: boolean;
  suppliersLoading: boolean;
  warehousesErr: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function PoHeaderForm({
  poNumber,
  setPoNumber,
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
  suppliers: _suppliers,
  supplierOptions,
  warehouses,
  suppliersErr,
  suppliersLoading,
  warehousesErr,
  onSubmit,
}: PoHeaderFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
        Thông tin đơn nhập
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500">Mã PO *</label>
          <Input
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            maxLength={30}
            disabled={headerLocked}
            placeholder="VD: PO-2025-001"
            className={headerErrors.poNumber ? "border-rose-400" : ""}
          />
          {headerErrors.poNumber && <p className="text-xs text-rose-600">{headerErrors.poNumber}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500">Ngày đặt *</label>
          <Input
            type="date"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            disabled={headerLocked}
            className={headerErrors.orderDate ? "border-rose-400" : ""}
          />
          {headerErrors.orderDate && <p className="text-xs text-rose-600">{headerErrors.orderDate}</p>}
        </div>
        <div className="space-y-2">
          <label htmlFor="po-supplier" className="text-xs font-semibold text-slate-500">
            Nhà cung cấp *
          </label>
          <SearchableSelect
            id="po-supplier"
            value={supplierId}
            onValueChange={(v) => setSupplierId(v)}
            options={supplierOptions}
            placeholder={
              suppliersErr ? "Lỗi tải NCC" : suppliersLoading ? "Đang tải…" : "Chạm để chọn NCC"
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
            <p className="text-xs text-amber-600">Không tải được danh sách nhà cung cấp.</p>
          )}
          {headerErrors.supplierId && <p className="text-xs text-rose-600">{headerErrors.supplierId}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500">Kho nhận *</label>
          <Select
            value={warehouseId}
            onValueChange={(v) => setWarehouseId(v ?? "")}
            disabled={headerLocked || warehousesErr}
          >
            <SelectTrigger className={headerErrors.warehouseId ? "border-rose-400" : ""}>
              <SelectValue placeholder={warehousesErr ? "Lỗi GET /api/warehouses" : "Chọn kho"} />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {warehousesErr && (
            <p className="text-xs text-amber-600">Không tải được danh sách kho.</p>
          )}
          {headerErrors.warehouseId && <p className="text-xs text-rose-600">{headerErrors.warehouseId}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500">Ngày dự kiến</label>
          <Input
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
            disabled={headerLocked}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500">Tổng tiền (tuỳ chọn)</label>
          <Input
            value={totalAmountStr}
            onChange={(e) => setTotalAmountStr(e.target.value)}
            disabled={headerLocked}
            placeholder="0"
            inputMode="decimal"
            className={headerErrors.totalAmountStr ? "border-rose-400" : ""}
          />
          {headerErrors.totalAmountStr && (
            <p className="text-xs text-rose-600">{headerErrors.totalAmountStr}</p>
          )}
        </div>
      </div>

      {headerLocked && savedPoNumber && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
          <span className="font-medium text-emerald-900 dark:text-emerald-100">Đã lưu đơn:</span>
          <Badge>{savedPoNumber}</Badge>
          <span className="text-slate-600 dark:text-slate-300">Trạng thái: {savedStatus}</span>
          <span className="font-mono text-xs text-slate-500">id: {purchaseOrderId}</span>
        </div>
      )}

      <div className="mt-6">
        <Button type="submit" disabled={headerLocked || savingHeader} className="bg-indigo-600 hover:bg-indigo-700">
          {savingHeader ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Lưu đơn nhập
        </Button>
      </div>
    </form>
  );
}
