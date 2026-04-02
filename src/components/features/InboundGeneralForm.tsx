"use client";

import {
  Building2,
  Boxes,
  Calendar,
  Truck,
  Warehouse,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { FieldErrors } from "@/types/inbound";

interface InboundGeneralFormProps {
  supplierId: string;
  setSupplierId: (v: string) => void;
  warehouseId: string;
  setWarehouseId: (v: string) => void;
  inboundDate: string;
  setInboundDate: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  transportMode: string;
  setTransportMode: (v: string) => void;
  fieldErrors: FieldErrors;
  setFieldErrors: React.Dispatch<React.SetStateAction<FieldErrors>>;
  supplierOptions: { value: string; label: string }[];
  warehouses: { id: string; name: string }[];
  selectedWarehouseName: string | undefined;
  suppliersErr: boolean;
  suppliersLoading: boolean;
  warehousesErr: boolean;
  warehousesLoading: boolean;
  transportLabel: string;
}

export function InboundGeneralForm({
  supplierId,
  setSupplierId,
  warehouseId,
  setWarehouseId,
  inboundDate,
  setInboundDate,
  note,
  setNote,
  transportMode,
  setTransportMode,
  fieldErrors,
  setFieldErrors,
  supplierOptions,
  warehouses,
  selectedWarehouseName,
  suppliersErr,
  suppliersLoading,
  warehousesErr,
  warehousesLoading,
  transportLabel,
}: InboundGeneralFormProps) {
  return (
    <section aria-labelledby="inbound-general-heading" className="space-y-3">
      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
        <Boxes className="size-4 shrink-0 text-indigo-600" />
        <h2 id="inbound-general-heading" className="text-sm font-semibold tracking-tight">
          Thông tin chung
        </h2>
      </div>
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-x-8 md:gap-y-4">
          <div className="space-y-1.5">
            <label htmlFor="supplier-pick" className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Nhà cung cấp <span className="text-rose-500">*</span>
            </label>
            <SearchableSelect
              id="supplier-pick"
              value={supplierId}
              onValueChange={(v) => {
                setSupplierId(v);
                setFieldErrors((prev) => ({ ...prev, supplier: undefined }));
              }}
              options={supplierOptions}
              placeholder={suppliersErr ? "Lỗi tải danh sách" : suppliersLoading ? "Đang tải…" : "Chạm để chọn NCC"}
              searchPlaceholder="Tên nhà cung cấp…"
              emptyText="Không tìm thấy NCC"
              disabled={suppliersErr || suppliersLoading}
              loading={suppliersLoading}
              error={Boolean(fieldErrors.supplier)}
              icon={<Building2 className="size-4" />}
              dialogTitle="Chọn nhà cung cấp"
            />
            {fieldErrors.supplier ? (
              <p className="text-xs text-rose-600 dark:text-rose-400">{fieldErrors.supplier}</p>
            ) : suppliersErr ? (
              <p className="text-xs text-amber-600 dark:text-amber-500">Không tải được danh sách nhà cung cấp.</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Kho nhận <span className="text-rose-500">*</span>
            </label>
            <Select
              value={warehouseId}
              onValueChange={(v) => {
                setWarehouseId(v ?? "");
                setFieldErrors((prev) => ({ ...prev, warehouse: undefined }));
              }}
              disabled={warehousesErr || warehousesLoading}
            >
              <SelectTrigger
                id="warehouse-pick"
                aria-invalid={Boolean(fieldErrors.warehouse)}
                className="h-10 border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-950/50"
              >
                <Warehouse className="size-4 shrink-0 text-slate-500" />
                <SelectValue
                  placeholder={
                    warehousesErr ? "Lỗi tải kho" : warehousesLoading ? "Đang tải…" : "Chọn kho nhận hàng"
                  }
                >
                  {selectedWarehouseName ?? null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={String(w.id)}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.warehouse ? (
              <p className="text-xs text-rose-600 dark:text-rose-400">{fieldErrors.warehouse}</p>
            ) : warehousesErr ? (
              <p className="text-xs text-amber-600 dark:text-amber-500">Không tải được danh sách kho.</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="inbound-date" className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Ngày nhập kho <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="inbound-date"
                type="date"
                value={inboundDate}
                onChange={(e) => {
                  setInboundDate(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, date: undefined }));
                }}
                aria-invalid={Boolean(fieldErrors.date)}
                className="h-10 border-slate-200 bg-slate-50/50 pl-10 dark:border-slate-700 dark:bg-slate-950/50"
              />
            </div>
            {fieldErrors.date ? <p className="text-xs text-rose-600 dark:text-rose-400">{fieldErrors.date}</p> : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Phương thức vận chuyển</label>
            <Select value={transportMode} onValueChange={(v) => setTransportMode(v ?? "road")}>
              <SelectTrigger className="h-10 border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-950/50">
                <Truck className="size-4 shrink-0 text-slate-500" />
                <SelectValue placeholder="Chọn hình thức">{transportLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="road">Đường bộ</SelectItem>
                <SelectItem value="sea">Đường biển</SelectItem>
                <SelectItem value="air">Hàng không</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="inbound-note" className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Ghi chú <span className="font-normal text-slate-400">(tuỳ chọn)</span>
            </label>
            <Textarea
              id="inbound-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Hàng dễ vỡ, giao buổi sáng…"
              rows={2}
              className="min-h-18 border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-950/50"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
