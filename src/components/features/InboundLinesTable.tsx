"use client";

import React from "react";
import {
  PackagePlus,
  Plus,
  Trash2,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { InboundLine, LineFormErrors } from "@/types/inbound";

interface InboundLinesTableProps {
  lines: InboundLine[];
  onAddLine: (e: React.FormEvent) => void;
  lineProductId: string;
  setLineProductId: (v: string) => void;
  lineQtyStr: string;
  setLineQtyStr: (v: string) => void;
  linePriceStr: string;
  setLinePriceStr: (v: string) => void;
  lineFormErrors: LineFormErrors;
  setLineFormErrors: React.Dispatch<React.SetStateAction<LineFormErrors>>;
  rowErrors: Record<string, { qty?: string; price?: string }>;
  updateLineQty: (rowId: string, val: string) => void;
  updateLinePrice: (rowId: string, val: string) => void;
  setRemoveTarget: (line: InboundLine | null) => void;
  productOptions: { value: string; label: string; hint: string }[];
  selectedLineProduct: { id: string; sku: string; name: string } | undefined;
  productsErr: boolean;
  productsLoading: boolean;
  productSearch: string;
  setProductSearch: (v: string) => void;
  totals: { lineCount: number; qtySum: number; moneySum: number; hasPrice: boolean };
  fieldErrors: { lines?: string };
}

export function InboundLinesTable({
  lines,
  onAddLine,
  lineProductId,
  setLineProductId,
  lineQtyStr,
  setLineQtyStr,
  linePriceStr,
  setLinePriceStr,
  lineFormErrors,
  setLineFormErrors,
  rowErrors,
  updateLineQty,
  updateLinePrice,
  setRemoveTarget,
  productOptions,
  selectedLineProduct,
  productsErr,
  productsLoading,
  productSearch,
  setProductSearch,
  totals,
  fieldErrors,
}: InboundLinesTableProps) {
  return (
    <section aria-labelledby="inbound-lines-heading" className="min-w-0 flex-1 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <PackagePlus className="size-4 shrink-0 text-indigo-600" />
          <h2 id="inbound-lines-heading" className="text-sm font-semibold tracking-tight">
            Hàng nhập kho
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-400">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 dark:border-slate-700 dark:bg-slate-900">
            {totals.lineCount} dòng
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 dark:border-slate-700 dark:bg-slate-900">
            Tổng SL:{" "}
            <strong className="font-semibold text-slate-800 dark:text-slate-100">{totals.qtySum}</strong>
          </span>
          {totals.hasPrice ? (
            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-950/40 dark:text-indigo-100">
              Tạm tính:{" "}
              <strong className="font-semibold">
                {totals.moneySum.toLocaleString("vi-VN")} ₫
              </strong>
            </span>
          ) : null}
        </div>
      </div>

      {fieldErrors.lines ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">{fieldErrors.lines}</p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <form
          onSubmit={onAddLine}
          className="border-b border-slate-100 bg-slate-50/60 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/50 md:px-5"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Thêm dòng mới
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
            <div className="md:col-span-5">
              <label htmlFor="line-product" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Sản phẩm <span className="text-rose-500">*</span>
              </label>
              <SearchableSelect
                id="line-product"
                value={lineProductId}
                onValueChange={(v) => {
                  setLineProductId(v);
                  setLineFormErrors((prev) => ({ ...prev, product: undefined }));
                }}
                options={productOptions}
                placeholder={productsErr ? "Lỗi tải" : productsLoading ? "Đang tải…" : "Chạm để chọn & tìm SP"}
                searchPlaceholder="Tên hoặc mã SKU…"
                emptyText="Không có sản phẩm — thử từ khóa khác"
                disabled={productsErr}
                loading={productsLoading}
                error={Boolean(lineFormErrors.product)}
                icon={<Package className="size-4" />}
                dialogTitle="Chọn sản phẩm"
                serverSearch
                searchQuery={productSearch}
                onSearchChange={setProductSearch}
              />
              {lineFormErrors.product ? (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{lineFormErrors.product}</p>
              ) : productsErr ? (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">Không tải được danh sách sản phẩm.</p>
              ) : null}
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Mã SKU</label>
              <Input
                readOnly
                value={selectedLineProduct?.sku ?? ""}
                placeholder="—"
                className="h-10 bg-slate-100 font-mono text-sm dark:bg-slate-900"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="line-qty" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Số lượng <span className="text-rose-500">*</span>
              </label>
              <Input
                id="line-qty"
                value={lineQtyStr}
                onChange={(e) => {
                  setLineQtyStr(e.target.value);
                  setLineFormErrors((prev) => ({ ...prev, qty: undefined }));
                }}
                inputMode="decimal"
                placeholder="VD: 10"
                aria-invalid={Boolean(lineFormErrors.qty)}
                className="h-10 border-slate-200 dark:border-slate-700"
              />
              {lineFormErrors.qty ? (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{lineFormErrors.qty}</p>
              ) : null}
            </div>
            <div className="md:col-span-2">
              <label htmlFor="line-price" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Đơn giá <span className="font-normal text-slate-400">(nếu có)</span>
              </label>
              <Input
                id="line-price"
                value={linePriceStr}
                onChange={(e) => setLinePriceStr(e.target.value)}
                inputMode="decimal"
                placeholder="Để trống nếu chưa có"
                className="h-10 border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="md:col-span-1">
              <Button
                type="submit"
                className="h-10 w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={productsErr}
              >
                <Plus className="mr-1.5 size-4" />
                Thêm
              </Button>
            </div>
          </div>
        </form>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100 hover:bg-transparent dark:border-slate-800">
                <TableHead className="w-11 text-xs font-semibold text-slate-500">#</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500">Sản phẩm</TableHead>
                <TableHead className="w-36 text-xs font-semibold text-slate-500">SKU</TableHead>
                <TableHead className="w-32 text-center text-xs font-semibold text-slate-500">Số lượng</TableHead>
                <TableHead className="w-36 text-center text-xs font-semibold text-slate-500">Đơn giá</TableHead>
                <TableHead className="w-14 text-right text-xs font-semibold text-slate-500" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
                      <Package className="size-12 text-slate-200 dark:text-slate-700" />
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Chưa có dòng hàng</p>
                      <p className="max-w-sm text-xs text-slate-500">
                        Chọn sản phẩm ở form trên, nhập số lượng, bấm Thêm.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                lines.map((row, index) => (
                  <TableRow
                    key={row.rowId}
                    className="border-slate-100 odd:bg-white even:bg-slate-50/70 dark:border-slate-800 dark:odd:bg-slate-900 dark:even:bg-slate-900/70"
                  >
                    <TableCell className="tabular-nums text-slate-500">{index + 1}</TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-white">{row.name}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-400">{row.sku}</TableCell>
                    <TableCell className="align-top">
                      <Input
                        inputMode="decimal"
                        value={row.qtyStr}
                        onChange={(e) => updateLineQty(row.rowId, e.target.value)}
                        aria-invalid={Boolean(rowErrors[row.rowId]?.qty)}
                        className="h-9 text-center"
                      />
                      {rowErrors[row.rowId]?.qty ? (
                        <p className="mt-1 text-center text-[11px] text-rose-600">{rowErrors[row.rowId].qty}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="align-top">
                      <Input
                        inputMode="decimal"
                        value={row.unitPriceStr}
                        onChange={(e) => updateLinePrice(row.rowId, e.target.value)}
                        placeholder="0"
                        aria-invalid={Boolean(rowErrors[row.rowId]?.price)}
                        className="h-9 text-right"
                      />
                      {rowErrors[row.rowId]?.price ? (
                        <p className="mt-1 text-right text-[11px] text-rose-600">{rowErrors[row.rowId].price}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
                        onClick={() => setRemoveTarget(row)}
                        aria-label={`Xóa dòng ${row.name}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 p-4 md:hidden">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Package className="size-10 text-slate-200 dark:text-slate-700" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Chưa có dòng hàng</p>
            </div>
          ) : (
            lines.map((row, index) => (
              <div
                key={row.rowId}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-900/50"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Dòng {index + 1}</p>
                    <p className="font-medium text-slate-900 dark:text-white">{row.name}</p>
                    <p className="font-mono text-xs text-slate-500">{row.sku}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-rose-600"
                    onClick={() => setRemoveTarget(row)}
                    aria-label="Xóa dòng"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Số lượng</label>
                    <Input
                      inputMode="decimal"
                      value={row.qtyStr}
                      onChange={(e) => updateLineQty(row.rowId, e.target.value)}
                      aria-invalid={Boolean(rowErrors[row.rowId]?.qty)}
                      className="h-9"
                    />
                    {rowErrors[row.rowId]?.qty ? (
                      <p className="mt-1 text-[11px] text-rose-600">{rowErrors[row.rowId].qty}</p>
                    ) : null}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Đơn giá</label>
                    <Input
                      inputMode="decimal"
                      value={row.unitPriceStr}
                      onChange={(e) => updateLinePrice(row.rowId, e.target.value)}
                      placeholder="0"
                      aria-invalid={Boolean(rowErrors[row.rowId]?.price)}
                      className="h-9"
                    />
                    {rowErrors[row.rowId]?.price ? (
                      <p className="mt-1 text-[11px] text-rose-600">{rowErrors[row.rowId].price}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
