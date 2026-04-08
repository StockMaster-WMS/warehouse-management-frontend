"use client";

import { useState } from "react";
import { FileSpreadsheet, Loader2, Package, Plus, PlusIcon, Trash2 } from "lucide-react";
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
import { PoExcelImportDialog } from "@/components/features/PoExcelImportDialog";
import type { PoItem } from "@/types/purchase-order";

export interface PoLinesSectionProps {
  purchaseOrderId: string | null;
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
}

export function PoLinesSection({
  purchaseOrderId,
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
}: PoLinesSectionProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${
        !purchaseOrderId ? "pointer-events-none opacity-50" : ""
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
          Dòng hàng (PO lines)
        </h3>
        {purchaseOrderId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setImportDialogOpen(true)}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Thêm SP bằng Excel
          </Button>
        )}
      </div>

      <div className="mb-6 overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-14">STT</TableHead>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">SL đặt</TableHead>
              <TableHead className="text-right">Đơn giá</TableHead>
              <TableHead className="w-28 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itemsLoading && lines.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-slate-500"
                >
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : lines.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-sm text-slate-500"
                >
                  Chưa có dòng. Thêm dòng bên dưới.
                </TableCell>
              </TableRow>
            ) : (
              lines.map((row: PoItem) => (
                <TableRow key={row.id}>
                  <TableCell>{row.lineNumber}</TableCell>
                  <TableCell className="max-w-60 truncate text-sm">
                    {row.productName ||
                      productNameMap.get(row.productId) ||
                      row.productId}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {row.productSku}
                  </TableCell>
                  <TableCell className="text-right">{row.orderedQty}</TableCell>
                  <TableCell className="text-right">
                    {row.unitPrice ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-rose-600"
                      disabled={isDeletingLine}
                      onClick={() => onDeleteLine(row)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <form
        onSubmit={onAddLine}
        className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 md:grid-cols-12 md:items-end dark:border-slate-800"
      >
        <div className="md:col-span-4">
          <label
            htmlFor="po-line-product"
            className="mb-1 block text-xs font-semibold text-slate-500"
          >
            Sản phẩm *
          </label>
          <SearchableSelect
            id="po-line-product"
            value={lineProductId}
            onValueChange={(v) => setLineProductId(v)}
            options={productOptions}
            placeholder={
              productsErr
                ? "Lỗi tải SP"
                : productsLoading
                  ? "Đang tải…"
                  : "Chạm để chọn & tìm SP"
            }
            searchPlaceholder="Tên hoặc mã SKU…"
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
            <p className="mt-1 text-xs text-amber-600">
              Không tải được danh sách sản phẩm.
            </p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-500">
            SKU
          </label>
          <Input
            readOnly
            value={selectedProduct?.sku ?? ""}
            className="bg-slate-50 font-mono text-sm dark:bg-slate-900"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-500">
            SL đặt *
          </label>
          <Input
            value={lineQty}
            onChange={(e) => setLineQty(e.target.value)}
            disabled={!purchaseOrderId}
            inputMode="decimal"
            className={lineErrors.orderedQtyStr ? "border-rose-400" : ""}
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-500">
            Đơn giá
          </label>
          <Input
            value={linePrice}
            onChange={(e) => setLinePrice(e.target.value)}
            disabled={!purchaseOrderId}
            inputMode="decimal"
          />
        </div>
        <div className="md:col-span-2">
          <Button
            type="submit"
            disabled={!purchaseOrderId || savingLine}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {savingLine ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Thêm dòng <PlusIcon/>
          </Button>
        </div>
      </form>

      {purchaseOrderId && (
        <PoExcelImportDialog
          purchaseOrderId={purchaseOrderId}
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
        />
      )}
    </div>
  );
}
