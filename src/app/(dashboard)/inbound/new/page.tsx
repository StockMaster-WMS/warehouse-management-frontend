"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Save,
  PackagePlus,
  Plus,
  Trash2,
  Building2,
  Calendar,
  Truck,
  FileUp,
  Package,
  Warehouse,
  Boxes,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { Warehouse as WarehouseType } from "@/types/warehouse";
import type { Product } from "@/types/product";
import {
  useGetProductsForPoQuery,
  useGetWarehousesForPoQuery,
} from "@/store/services/purchase-order.service";
import { useGetSuppliersQuery } from "@/store/services/supplier.service";
import { getSupplierDisplayName } from "@/types/supplier";

type InboundLine = {
  rowId: string;
  productId: string;
  sku: string;
  name: string;
  qtyStr: string;
  unitPriceStr: string;
};

type FieldErrors = {
  supplier?: string;
  warehouse?: string;
  date?: string;
  lines?: string;
};

type LineFormErrors = {
  product?: string;
  qty?: string;
};

function todayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDecimal(str: string) {
  const n = Number(String(str).replace(",", ".").trim());
  return Number.isFinite(n) ? n : NaN;
}

export default function NewInboundPage() {
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [inboundDate, setInboundDate] = useState(todayIsoDate);
  const [note, setNote] = useState("");
  const [transportMode, setTransportMode] = useState("road");

  const [lines, setLines] = useState<InboundLine[]>([]);
  const [lineProductId, setLineProductId] = useState("");
  const [lineQtyStr, setLineQtyStr] = useState("1");
  const [linePriceStr, setLinePriceStr] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [lineFormErrors, setLineFormErrors] = useState<LineFormErrors>({});
  const [rowErrors, setRowErrors] = useState<Record<string, { qty?: string; price?: string }>>({});

  const [removeTarget, setRemoveTarget] = useState<InboundLine | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedProductSearch(productSearch.trim()), 350);
    return () => window.clearTimeout(t);
  }, [productSearch]);

  const { data: suppliersRes, isError: suppliersErr, isFetching: suppliersLoading } =
    useGetSuppliersQuery({
      page: 0,
      size: 500,
      sort: "createdAt",
      sortDir: "desc",
    });
  const { data: warehousesRes, isError: warehousesErr, isFetching: warehousesLoading } =
    useGetWarehousesForPoQuery({
      size: 500,
    });
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
        const w = raw as Partial<WarehouseType>;
        if (!w.id || !w.name) return [];
        return [{ id: String(w.id), name: String(w.name) }];
      }),
    [warehousesRes]
  );

  const selectedWarehouseName = useMemo(() => {
    if (!warehouseId) return undefined;
    return warehouses.find((w) => String(w.id) === String(warehouseId))?.name;
  }, [warehouseId, warehouses]);

  const transportLabel =
    transportMode === "sea" ? "Đường biển" : transportMode === "air" ? "Hàng không" : "Đường bộ";

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

  const selectedLineProduct = useMemo(
    () => products.find((p) => p.id === lineProductId),
    [products, lineProductId]
  );

  const totals = useMemo(() => {
    let qtySum = 0;
    let moneySum = 0;
    let hasPrice = false;
    for (const row of lines) {
      const q = parseDecimal(row.qtyStr);
      if (q > 0) qtySum += q;
      const p = parseDecimal(row.unitPriceStr);
      if (row.unitPriceStr.trim() !== "" && Number.isFinite(p)) {
        hasPrice = true;
        if (q > 0 && p >= 0) moneySum += q * p;
      }
    }
    return { lineCount: lines.length, qtySum, moneySum, hasPrice };
  }, [lines]);

  function validateHeader(): FieldErrors {
    const e: FieldErrors = {};
    if (!supplierId) e.supplier = "Chọn nhà cung cấp";
    if (!warehouseId) e.warehouse = "Chọn kho nhận";
    if (!inboundDate) e.date = "Chọn ngày nhập";
    if (lines.length === 0) e.lines = "Thêm ít nhất một dòng hàng";
    return e;
  }

  function validateRow(row: InboundLine): { qty?: string; price?: string } {
    const out: { qty?: string; price?: string } = {};
    const q = parseDecimal(row.qtyStr);
    if (!(q > 0) || Number.isNaN(q)) out.qty = "Số lượng phải lớn hơn 0";
    if (row.unitPriceStr.trim() !== "") {
      const p = parseDecimal(row.unitPriceStr);
      if (Number.isNaN(p) || p < 0) out.price = "Đơn giá không hợp lệ";
    }
    return out;
  }

  function addLine(e: React.FormEvent) {
    e.preventDefault();
    const le: LineFormErrors = {};
    if (!lineProductId) le.product = "Chọn sản phẩm";
    const qty = parseDecimal(lineQtyStr);
    if (!(qty > 0) || Number.isNaN(qty)) le.qty = "Nhập số lượng lớn hơn 0";
    setLineFormErrors(le);
    if (Object.keys(le).length) return;

    if (lines.some((l) => l.productId === lineProductId)) {
      toast.error("Sản phẩm đã có trong phiếu");
      return;
    }
    const p = selectedLineProduct;
    if (!p) {
      toast.error("Không tìm thấy sản phẩm");
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        rowId: crypto.randomUUID(),
        productId: p.id,
        sku: p.sku,
        name: p.name,
        qtyStr: String(qty),
        unitPriceStr: linePriceStr.trim(),
      },
    ]);
    setLineProductId("");
    setLineQtyStr("1");
    setLinePriceStr("");
    setLineFormErrors({});
    setFieldErrors((prev) => ({ ...prev, lines: undefined }));
    toast.success("Đã thêm dòng");
  }

  function confirmRemoveLine() {
    if (!removeTarget) return;
    setLines((prev) => prev.filter((l) => l.rowId !== removeTarget.rowId));
    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[removeTarget.rowId];
      return next;
    });
    toast.message("Đã xóa dòng", { description: "Có thể thêm lại bằng form phía trên." });
    setRemoveTarget(null);
  }

  function updateLineQty(rowId: string, qtyStr: string) {
    setLines((prev) => prev.map((l) => (l.rowId === rowId ? { ...l, qtyStr } : l)));
    setRowErrors((prev) => {
      const next = { ...prev };
      if (next[rowId]) next[rowId] = { ...next[rowId], qty: undefined };
      return next;
    });
  }

  function updateLinePrice(rowId: string, unitPriceStr: string) {
    setLines((prev) => prev.map((l) => (l.rowId === rowId ? { ...l, unitPriceStr } : l)));
    setRowErrors((prev) => {
      const next = { ...prev };
      if (next[rowId]) next[rowId] = { ...next[rowId], price: undefined };
      return next;
    });
  }

  async function handleSave() {
    const headerErr = validateHeader();
    const perRow: Record<string, { qty?: string; price?: string }> = {};
    for (const row of lines) {
      const re = validateRow(row);
      if (re.qty || re.price) perRow[row.rowId] = re;
    }
    setFieldErrors(headerErr);
    setRowErrors(perRow);

    if (Object.keys(headerErr).length || Object.keys(perRow).length) {
      toast.error("Kiểm tra lại thông tin", {
        description: "Các ô chưa đúng được đánh dấu bên dưới.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((r) => window.setTimeout(r, 500));
      toast.success("Đã lưu phiếu", {
        description: "Dữ liệu đã ghi nhận trên form. Kết nối máy chủ sẽ bật khi có API.",
      });
    } catch {
      toast.error("Không lưu được", { description: "Thử lại sau giây lát." });
    } finally {
      setIsSubmitting(false);
    }
  }

  const saveDisabled = isSubmitting || suppliersErr || warehousesErr;

  return (
    <div className="flex min-h-[calc(100svh-10rem)] flex-col gap-8 pb-28">
      <PageHeader
        title="Tạo phiếu nhập hàng"
        description="Điền thông tin chung, thêm từng dòng hàng rồi bấm Lưu phiếu."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              render={<Link href="/inbound" />}
              nativeButton={false}
              variant="ghost"
              size="icon-sm"
              className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Quay lại danh sách"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-slate-200 dark:border-slate-700"
              disabled
              title="Tính năng đang phát triển"
            >
              <FileUp className="mr-2 h-4 w-4" />
              Nhập từ file
            </Button>
          </div>
        }
      />

      {/* Vùng 1 — Thông tin chung */}
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
                className="min-h-[4.5rem] border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-950/50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Vùng 2 — Danh sách hàng nhập */}
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
            onSubmit={addLine}
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

          {/* Desktop bảng */}
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

          {/* Mobile: thẻ từng dòng */}
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

      {/* Vùng 3 — Thanh hành động cố định */}
      <div
        className="sticky bottom-0 z-30 -mx-4 mt-auto border-t border-slate-200/90 bg-[#F8FAFC]/95 px-4 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-[#F8FAFC]/85 dark:border-slate-800 dark:bg-slate-950/90 lg:-mx-8 lg:px-8"
        role="toolbar"
        aria-label="Thao tác phiếu nhập"
      >
        <div className="mx-auto flex w-full max-w-8xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            render={<Link href="/inbound" />}
            nativeButton={false}
            variant="outline"
            className="order-2 border-slate-200 sm:order-1 dark:border-slate-700"
            disabled={isSubmitting}
          >
            <ArrowLeft className="mr-2 size-4" />
            Quay lại / Huỷ
          </Button>
          <Button
            type="button"
            className="order-1 h-10 bg-indigo-600 px-6 hover:bg-indigo-700 sm:order-2 sm:min-w-[200px]"
            disabled={saveDisabled}
            onClick={handleSave}
          >
            {isSubmitting ? (
              <>Đang lưu…</>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Lưu phiếu
              </>
            )}
          </Button>
        </div>
      </div>

      <Dialog open={Boolean(removeTarget)} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <DialogContent className="max-w-sm" showCloseButton>
          <DialogHeader>
            <DialogTitle>Xóa dòng hàng?</DialogTitle>
            <DialogDescription>
              {removeTarget ? (
                <>
                  Sẽ bỏ <span className="font-medium text-foreground">{removeTarget.name}</span> khỏi phiếu. Thao tác
                  này chỉ áp dụng trên form (chưa gửi máy chủ).
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setRemoveTarget(null)}>
              Không
            </Button>
            <Button type="button" variant="destructive" onClick={confirmRemoveLine}>
              Xóa dòng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
