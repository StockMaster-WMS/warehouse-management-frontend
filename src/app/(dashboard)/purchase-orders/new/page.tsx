"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Building2, Loader2, Package, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { Warehouse } from "@/types/warehouse";
import type { Product } from "@/types/product";
import { apiErrMessage } from "@/types/api";
import {
  useCreatePoItemMutation,
  useCreatePurchaseOrderMutation,
  useDeletePoItemMutation,
  useGetPoItemsQuery,
  useGetProductsForPoQuery,
  useGetWarehousesForPoQuery,
} from "@/store/services/purchase-order.service";
import { useGetSuppliersQuery } from "@/store/services/supplier.service";
import { getSupplierDisplayName } from "@/types/supplier";
import type { PoItem } from "@/types/purchase-order";

const headerSchema = z.object({
  poNumber: z.string().trim().min(1, "Nhập mã PO").max(30, "Tối đa 30 ký tự"),
  supplierId: z.string().min(1, "Chọn nhà cung cấp"),
  warehouseId: z.string().min(1, "Chọn kho"),
  orderDate: z.string().min(1, "Chọn ngày đặt"),
  expectedDate: z.string().optional(),
  totalAmountStr: z.string().optional(),
});

const lineSchema = z.object({
  productId: z.string().min(1, "Chọn sản phẩm"),
  orderedQtyStr: z.string().min(1, "Nhập số lượng"),
  unitPriceStr: z.string().optional(),
});

export default function NewPurchaseOrderPage() {
  const [poNumber, setPoNumber] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [totalAmountStr, setTotalAmountStr] = useState("");
  const [headerErrors, setHeaderErrors] = useState<Record<string, string>>({});

  const [purchaseOrderId, setPurchaseOrderId] = useState<string | null>(null);
  const [savedPoNumber, setSavedPoNumber] = useState<string | null>(null);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);

  const [lineProductId, setLineProductId] = useState("");
  const [lineQty, setLineQty] = useState("");
  const [linePrice, setLinePrice] = useState("");
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});
  const [productSearch, setProductSearch] = useState("");
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedProductSearch(productSearch.trim()), 350);
    return () => window.clearTimeout(t);
  }, [productSearch]);

  const { data: suppliersRes, isError: suppliersErr, isFetching: suppliersLoading } = useGetSuppliersQuery({
    page: 0,
    size: 500,
    sort: "createdAt",
    sortDir: "desc",
  });
  const { data: warehousesRes, isError: warehousesErr } = useGetWarehousesForPoQuery({ size: 500 });
  const {
    data: productsRes,
    isError: productsErr,
    isFetching: productsLoading,
  } = useGetProductsForPoQuery({
    size: 300,
    ...(debouncedProductSearch ? { keyword: debouncedProductSearch } : {}),
  });

  const suppliers = useMemo(
    () =>
      (suppliersRes?.data?.content ?? []).map((s) => ({
        id: s.id,
        name: getSupplierDisplayName(s),
      })),
    [suppliersRes]
  );

  const supplierOptions = useMemo(
    () => suppliers.map((s) => ({ value: String(s.id), label: s.name })),
    [suppliers]
  );
  const warehouses = useMemo(
    () =>
      (warehousesRes?.data?.content ?? []).flatMap((raw) => {
        const w = raw as Partial<Warehouse>;
        if (!w.id || !w.name) return [];
        return [
          {
            id: String(w.id),
            name: String(w.name),
            code: w.code,
            isActive: w.isActive ?? true,
          } as Warehouse,
        ];
      }),
    [warehousesRes]
  );
  const products = useMemo(
    () =>
      (productsRes?.data?.content ?? []).map((p: Product) => ({
        id: String(p.id),
        sku: p.sku,
        name: p.name,
      })),
    [productsRes]
  );

  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        value: p.id,
        label: p.name,
        hint: p.sku,
      })),
    [products]
  );

  const { data: poItemsRes, isFetching: itemsLoading } = useGetPoItemsQuery(
    { purchaseOrderId: purchaseOrderId! },
    { skip: !purchaseOrderId }
  );

  const lines = useMemo(() => poItemsRes?.data?.content ?? [], [poItemsRes]);

  const nextLineNumber = useMemo(() => {
    if (lines.length === 0) return 1;
    return Math.max(...lines.map((l: PoItem) => l.lineNumber)) + 1;
  }, [lines]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === lineProductId),
    [products, lineProductId]
  );

  const [createPo, { isLoading: savingHeader }] = useCreatePurchaseOrderMutation();
  const [createLine, { isLoading: savingLine }] = useCreatePoItemMutation();
  const [deleteLine, { isLoading: isDeletingLine }] = useDeletePoItemMutation();

  const headerLocked = !!purchaseOrderId;

  async function onSaveHeader(e: React.FormEvent) {
    e.preventDefault();
    setHeaderErrors({});
    const parsed = headerSchema.safeParse({
      poNumber,
      supplierId,
      warehouseId,
      orderDate,
      expectedDate: expectedDate || undefined,
      totalAmountStr,
    });
    if (!parsed.success) {
      const err: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = String(issue.path[0] ?? "form");
        if (!err[k]) err[k] = issue.message;
      }
      setHeaderErrors(err);
      toast.error(err.poNumber ?? err.supplierId ?? err.warehouseId ?? err.orderDate ?? "Kiểm tra form");
      return;
    }

    let totalAmount: number | undefined;
    if (parsed.data.totalAmountStr?.trim()) {
      const n = Number(parsed.data.totalAmountStr.replace(",", "."));
      if (Number.isNaN(n)) {
        setHeaderErrors({ totalAmountStr: "Số tiền không hợp lệ" });
        toast.error("Tổng tiền không hợp lệ");
        return;
      }
      totalAmount = n;
    }

    try {
      const res = await createPo({
        poNumber: parsed.data.poNumber,
        supplierId: parsed.data.supplierId,
        warehouseId: parsed.data.warehouseId,
        orderDate: parsed.data.orderDate,
        ...(parsed.data.expectedDate?.trim() ? { expectedDate: parsed.data.expectedDate.trim() } : {}),
        ...(totalAmount != null ? { totalAmount } : {}),
      }).unwrap();

      if (!res.success) {
        toast.error(res.message || "Tạo đơn thất bại");
        return;
      }
      const po = res.data;
      setPurchaseOrderId(po.id);
      setSavedPoNumber(po.poNumber);
      setSavedStatus(po.status ?? "DRAFT");
      toast.success(res.message || "Đã lưu đơn nhập");
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  async function onAddLine(e: React.FormEvent) {
    e.preventDefault();
    if (!purchaseOrderId) {
      toast.error("Lưu đơn nhập trước khi thêm dòng");
      return;
    }
    setLineErrors({});
    const parsed = lineSchema.safeParse({
      productId: lineProductId,
      orderedQtyStr: lineQty,
      unitPriceStr: linePrice,
    });
    if (!parsed.success) {
      const err: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = String(issue.path[0] ?? "form");
        if (!err[k]) err[k] = issue.message;
      }
      setLineErrors(err);
      toast.error("Kiểm tra dòng hàng");
      return;
    }

    const qty = Number(parsed.data.orderedQtyStr.replace(",", "."));
    if (!(qty > 0) || Number.isNaN(qty)) {
      setLineErrors({ orderedQtyStr: "Số lượng phải > 0" });
      toast.error("Số lượng phải > 0");
      return;
    }

    const usedNumbers = new Set(lines.map((l: PoItem) => l.lineNumber));
    let lineNumber = nextLineNumber;
    while (usedNumbers.has(lineNumber)) lineNumber += 1;

    if (!selectedProduct) {
      toast.error("Chọn sản phẩm hợp lệ");
      return;
    }

    let unitPrice: number | undefined;
    if (parsed.data.unitPriceStr?.trim()) {
      const p = Number(parsed.data.unitPriceStr.replace(",", "."));
      if (!Number.isNaN(p)) unitPrice = p;
    }

    try {
      const res = await createLine({
        purchaseOrderId,
        lineNumber,
        productId: selectedProduct.id,
        productSku: selectedProduct.sku,
        orderedQty: qty,
        receivedQty: 0,
        ...(unitPrice != null ? { unitPrice } : {}),
      }).unwrap();

      if (!res.success) {
        toast.error(res.message || "Thêm dòng thất bại");
        return;
      }
      toast.success(res.message || "Đã thêm dòng");
      setLineProductId("");
      setLineQty("");
      setLinePrice("");
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  async function onDeleteLine(item: PoItem) {
    if (!purchaseOrderId) return;
    try {
      const res = await deleteLine({ id: item.id, purchaseOrderId }).unwrap();
      if (!res.success) {
        toast.error((res as { message?: string }).message || "Xóa thất bại");
        return;
      }
      toast.success("Đã xóa dòng");
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  return (
    <div className="w-full space-y-6 pb-20">
      <PageHeader
        title="Tạo đơn nhập hàng"
        description="Bước 1: Lưu header đơn. Bước 2: Thêm từng dòng hàng (POST /api/po-items)."
        actions={
          <Button
            render={<Link href="/purchase-orders" />}
            nativeButton={false}
            variant="ghost"
            size="icon-sm"
            className="rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />

      <form
        onSubmit={onSaveHeader}
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
              <p className="text-xs text-amber-600">TODO: kiểm tra GET /api/warehouses trên gateway.</p>
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

      <div
        className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${
          !purchaseOrderId ? "pointer-events-none opacity-50" : ""
        }`}
      >
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
          Dòng hàng (PO lines)
        </h3>

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
                  <TableCell colSpan={6} className="py-8 text-center text-slate-500">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : lines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-slate-500">
                    Chưa có dòng. Thêm dòng bên dưới.
                  </TableCell>
                </TableRow>
              ) : (
                lines.map((row: PoItem) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.lineNumber}</TableCell>
                    <TableCell className="max-w-[200px] truncate font-mono text-xs">{row.productId}</TableCell>
                    <TableCell className="font-mono text-sm">{row.productSku}</TableCell>
                    <TableCell className="text-right">{row.orderedQty}</TableCell>
                    <TableCell className="text-right">{row.unitPrice ?? "—"}</TableCell>
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

        <form onSubmit={onAddLine} className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 md:grid-cols-12 md:items-end dark:border-slate-800">
          <div className="md:col-span-4">
            <label htmlFor="po-line-product" className="mb-1 block text-xs font-semibold text-slate-500">
              Sản phẩm *
            </label>
            <SearchableSelect
              id="po-line-product"
              value={lineProductId}
              onValueChange={(v) => setLineProductId(v)}
              options={productOptions}
              placeholder={
                productsErr ? "Lỗi tải SP" : productsLoading ? "Đang tải…" : "Chạm để chọn & tìm SP"
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
            {productsErr && <p className="mt-1 text-xs text-amber-600">Không tải được danh sách sản phẩm.</p>}
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-500">SKU</label>
            <Input readOnly value={selectedProduct?.sku ?? ""} className="bg-slate-50 font-mono text-sm dark:bg-slate-900" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-500">SL đặt *</label>
            <Input
              value={lineQty}
              onChange={(e) => setLineQty(e.target.value)}
              disabled={!purchaseOrderId}
              inputMode="decimal"
              className={lineErrors.orderedQtyStr ? "border-rose-400" : ""}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Đơn giá</label>
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
              {savingLine ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Thêm dòng
            </Button>
          </div>
        </form>
      </div>

      {purchaseOrderId && (
        <div className="text-center">
          <Button render={<Link href={`/purchase-orders/${purchaseOrderId}`} />} nativeButton={false} variant="outline">
            Xem chi tiết & nhận hàng
          </Button>
        </div>
      )}
    </div>
  );
}
