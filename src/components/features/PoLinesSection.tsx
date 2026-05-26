"use client";

import { useState } from "react";
import { FileSpreadsheet, Loader2, Package, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PoExcelImportDialog } from "@/components/features/PoExcelImportDialog";
import { cn } from "@/lib/utils";
import type { PoItem } from "@/types/purchase-order";

export interface PoLinesSectionProps {
  purchaseOrderId: string | null;
  canImportExcel?: boolean;
  lines: PoItem[];
  itemsLoading: boolean;
  lineProductId: string;
  setLineProductId: (v: string) => void;
  lineQty: string;
  setLineQty: (v: string) => void;
  linePrice: string;
  setLinePrice: (v: string) => void;
  lineErrors: Record<string, string>;
  productOptions: { value: string; label: string; hint?: string }[];
  productsErr: boolean;
  productsLoading: boolean;
  productSearch: string;
  setProductSearch: (v: string) => void;
  selectedProduct: { id: string; sku: string; name: string } | undefined;
  savingLine: boolean;
  isDeletingLine: boolean;
  onAddLine: (e: React.FormEvent) => void;
  onDeleteLine: (item: PoItem) => void;
  productNameMap: Map<string, string>;
  embedded?: boolean;
}

export function PoLinesSection({
  purchaseOrderId,
  canImportExcel,
  lines,
  itemsLoading,
  lineProductId,
  setLineProductId,
  lineQty,
  setLineQty,
  linePrice,
  setLinePrice,
  lineErrors,
  productOptions,
  productsErr,
  productsLoading,
  productSearch,
  setProductSearch,
  selectedProduct,
  savingLine,
  isDeletingLine,
  onAddLine,
  onDeleteLine,
  productNameMap,
  embedded = false,
}: PoLinesSectionProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const locked = !purchaseOrderId;
  const importEnabled = Boolean(purchaseOrderId && (canImportExcel ?? true));

  return (
    <div className={cn(
      embedded
        ? "overflow-hidden border-t border-border"
        : "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden",
      locked && "opacity-60 pointer-events-none"
    )}>
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "flex size-8 items-center justify-center rounded-full",
            locked
              ? "bg-slate-100 dark:bg-slate-800"
              : "bg-indigo-100 dark:bg-indigo-900/40",
          )}>
            <span className={cn(
              "text-sm font-bold",
              locked ? "text-slate-400" : "text-indigo-700 dark:text-indigo-400",
            )}>2</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Dòng hàng đơn nhập
            </h3>
            <p className="text-xs text-slate-400">
              {locked ? "Lưu đơn ở bước 1 để thêm dòng hàng" : `${lines.length} dòng`}
            </p>
          </div>
          {!locked && lines.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900">
              {lines.length} dòng
            </Badge>
          )}
        </div>
        {purchaseOrderId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setImportDialogOpen(true)}
            disabled={!importEnabled}
            title={importEnabled ? "Nhập từ Excel" : "Chỉ import khi đơn nhập ở trạng thái Nháp"}
            className="rounded-xl gap-1.5 text-xs border-slate-200"
          >
            <FileSpreadsheet className="size-3.5" />
            Nhập từ Excel
          </Button>
        )}
      </div>

      {/* Lines Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
            <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
              <TableHead className="w-14 py-3 pl-5 pr-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">STT</TableHead>
              <TableHead className="p-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Sản phẩm</TableHead>
              <TableHead className="p-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Mã hàng</TableHead>
              <TableHead className="p-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">SL đặt</TableHead>
              <TableHead className="p-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Đơn giá</TableHead>
              <TableHead className="w-14 py-3 pl-3 pr-5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itemsLoading && lines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin text-indigo-500" />
                  <p className="mt-2 text-xs text-slate-400">Đang tải dòng hàng…</p>
                </TableCell>
              </TableRow>
            ) : lines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center">
                  <Package className="mx-auto size-8 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có dòng hàng nào</p>
                  <p className="text-xs text-slate-400 mt-0.5">Thêm từng dòng bên dưới hoặc nhập từ Excel</p>
                </TableCell>
              </TableRow>
            ) : (
              lines.map((row: PoItem, idx) => (
                <TableRow
                  key={row.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 dark:border-slate-800/60 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <TableCell className="py-3 pl-5 pr-2 text-xs font-bold text-slate-400">{idx + 1}</TableCell>
                  <TableCell className="max-w-60 truncate p-3 text-sm text-slate-700 dark:text-slate-300">
                    {row.productName || productNameMap.get(row.productId) || row.productId}
                  </TableCell>
                  <TableCell className="p-3">
                    <span className="font-mono text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                      {row.productSku}
                    </span>
                  </TableCell>
                  <TableCell className="p-3 text-right font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                    {row.orderedQty}
                  </TableCell>
                  <TableCell className="p-3 text-right text-sm tabular-nums text-slate-600 dark:text-slate-400">
                    {row.unitPrice != null ? `₫${row.unitPrice.toLocaleString()}` : "—"}
                  </TableCell>
                  <TableCell className="p-3 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-rose-700 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg"
                      disabled={isDeletingLine}
                      onClick={() => onDeleteLine(row)}
                      aria-label="Xóa dòng hàng"
                      title="Xóa dòng hàng"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Line Form */}
      <div className={cn(
        "border-t border-slate-100 px-5 py-4 dark:border-slate-800",
        embedded ? "bg-muted/25" : "bg-slate-50/50 dark:bg-slate-800/20",
      )}>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Thêm dòng hàng</p>
        <form
          onSubmit={onAddLine}
          className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end"
        >
          {/* Product */}
          <div className="md:col-span-4">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Sản phẩm <span className="text-rose-500">*</span>
            </label>
            <SearchableSelect
              id="po-line-product"
              value={lineProductId}
              onValueChange={(v) => setLineProductId(v)}
              options={productOptions}
              placeholder={
                productsErr ? "Lỗi tải SP"
                  : productsLoading ? "Đang tải…"
                  : "Chọn sản phẩm"
              }
              searchPlaceholder="Tên hoặc mã hàng…"
              emptyText="Không có sản phẩm — thử từ khóa khác"
              disabled={!purchaseOrderId || productsErr}
              loading={productsLoading}
              error={Boolean(lineErrors.productId)}
              icon={<Package className="size-4" />}
              dialogTitle="Chọn sản phẩm"
              serverSearch
              searchQuery={productSearch}
              onSearchChange={setProductSearch}
            />
            {productsErr && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">Không tải được danh sách sản phẩm.</p>
            )}
          </div>

          {/* Mã hàng (read-only preview) */}
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">Mã hàng</label>
            <Input
              readOnly
              value={selectedProduct?.sku ?? ""}
              placeholder="—"
              className="rounded-xl h-10 bg-slate-100/60 font-mono text-xs dark:bg-slate-900/60"
            />
          </div>

          {/* Qty */}
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
              SL đặt <span className="text-rose-500">*</span>
            </label>
            <Input
              value={lineQty}
              onChange={(e) => setLineQty(e.target.value)}
              disabled={!purchaseOrderId}
              inputMode="decimal"
              placeholder="0"
              className={cn("rounded-xl h-10 text-right", lineErrors.orderedQtyStr && "border-rose-400")}
            />
          </div>

          {/* Price */}
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">Đơn giá</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">₫</span>
              <Input
                value={linePrice}
                onChange={(e) => setLinePrice(e.target.value)}
                disabled={!purchaseOrderId}
                inputMode="decimal"
                placeholder="0"
                className="pl-6 rounded-xl h-10 text-right"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="md:col-span-2">
            <Button
              type="submit"
              disabled={!purchaseOrderId || savingLine}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 h-10 gap-1.5"
            >
              {savingLine
                ? <Loader2 className="size-4 animate-spin" />
                : <Plus className="size-4" />}
              Thêm dòng
            </Button>
          </div>
        </form>
      </div>

      {purchaseOrderId && importEnabled && (
        <PoExcelImportDialog
          purchaseOrderId={purchaseOrderId}
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
        />
      )}
    </div>
  );
}
