"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { z } from "zod";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PoHeaderForm } from "@/components/features/PoHeaderForm";
import { PoLinesSection } from "@/components/features/PoLinesSection";
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
  const debouncedProductSearch = useDebouncedValue(productSearch.trim());

  const {
    data: suppliersRes,
    isError: suppliersErr,
    isFetching: suppliersLoading,
  } = useGetSuppliersQuery({
    page: 0,
    size: 50,
    sort: "createdAt",
    sortDir: "desc",
  });
  const { data: warehousesRes, isError: warehousesErr } =
    useGetWarehousesForPoQuery({});
  const {
    data: productsRes,
    isError: productsErr,
    isFetching: productsLoading,
  } = useGetProductsForPoQuery({
    ...(debouncedProductSearch ? { keyword: debouncedProductSearch } : {}),
  });

  // Separate large fetch for product name lookup (not affected by search keyword)
  const { data: allProductsRes } = useGetProductsForPoQuery({ size: 200 });

  const suppliers = useMemo(
    () =>
      (suppliersRes?.data?.content ?? []).map((s) => ({
        id: s.id,
        name: getSupplierDisplayName(s),
      })),
    [suppliersRes],
  );

  const supplierOptions = useMemo(
    () => suppliers.map((s) => ({ value: String(s.id), label: s.name })),
    [suppliers],
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
    [warehousesRes],
  );
  const products = useMemo(
    () =>
      (productsRes?.data?.content ?? []).map((p: Product) => ({
        id: String(p.id),
        sku: p.sku,
        name: p.name,
      })),
    [productsRes],
  );

  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        value: p.id,
        label: p.name,
        hint: p.sku,
      })),
    [products],
  );

  // Merged product name map: combines all products fetch + search results
  const productNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of allProductsRes?.data?.content ?? []) {
      map.set(String(p.id), p.name);
    }
    for (const p of products) {
      map.set(p.id, p.name);
    }
    return map;
  }, [allProductsRes, products]);

  const { data: poItemsRes, isFetching: itemsLoading } = useGetPoItemsQuery(
    { purchaseOrderId: purchaseOrderId! },
    { skip: !purchaseOrderId },
  );

  const lines = useMemo(() => poItemsRes?.data?.content ?? [], [poItemsRes]);

  const nextLineNumber = useMemo(() => {
    if (lines.length === 0) return 1;
    return Math.max(...lines.map((l: PoItem) => l.lineNumber)) + 1;
  }, [lines]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === lineProductId),
    [products, lineProductId],
  );

  const [createPo, { isLoading: savingHeader }] =
    useCreatePurchaseOrderMutation();
  const [createLine, { isLoading: savingLine }] = useCreatePoItemMutation();
  const [deleteLine, { isLoading: isDeletingLine }] = useDeletePoItemMutation();

  const headerLocked = !!purchaseOrderId;

  async function onSaveHeader(e: React.FormEvent) {
    e.preventDefault();
    setHeaderErrors({});
    const parsed = headerSchema.safeParse({
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
      toast.error(
        err.supplierId ?? err.warehouseId ?? err.orderDate ?? "Kiểm tra form",
      );
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
        supplierId: parsed.data.supplierId,
        warehouseId: parsed.data.warehouseId,
        orderDate: parsed.data.orderDate,
        ...(parsed.data.expectedDate?.trim()
          ? { expectedDate: parsed.data.expectedDate.trim() }
          : {}),
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
      toast.success(`Tạo đơn nhập thành công: ${po.poNumber}`);
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
    <div className="w-full space-y-5 pb-20">
      <PageHeader
        title="Tạo đơn nhập hàng"
        description="Điền thông tin đơn (Bước 1) rồi thêm từng dòng hàng (Bước 2)."
        actions={
          <Button
            render={<Link href="/purchase-orders" />}
            nativeButton={false}
            variant="outline"
            size="sm"
            className="rounded-xl gap-1.5 text-xs border-slate-200"
          >
            <ArrowLeft className="size-3.5" />
            Danh sách
          </Button>
        }
      />

      <PoHeaderForm
        supplierId={supplierId}
        setSupplierId={setSupplierId}
        warehouseId={warehouseId}
        setWarehouseId={setWarehouseId}
        orderDate={orderDate}
        setOrderDate={setOrderDate}
        expectedDate={expectedDate}
        setExpectedDate={setExpectedDate}
        totalAmountStr={totalAmountStr}
        setTotalAmountStr={setTotalAmountStr}
        headerErrors={headerErrors}
        headerLocked={headerLocked}
        savingHeader={savingHeader}
        savedPoNumber={savedPoNumber}
        savedStatus={savedStatus}
        purchaseOrderId={purchaseOrderId}
        suppliers={suppliers}
        supplierOptions={supplierOptions}
        warehouses={warehouses}
        suppliersErr={suppliersErr}
        suppliersLoading={suppliersLoading}
        warehousesErr={warehousesErr}
        onSubmit={onSaveHeader}
      />

      <PoLinesSection
        purchaseOrderId={purchaseOrderId}
        lines={lines}
        itemsLoading={itemsLoading}
        lineProductId={lineProductId}
        setLineProductId={setLineProductId}
        lineQty={lineQty}
        setLineQty={setLineQty}
        linePrice={linePrice}
        setLinePrice={setLinePrice}
        lineErrors={lineErrors}
        productOptions={productOptions}
        productsErr={productsErr}
        productsLoading={productsLoading}
        productSearch={productSearch}
        setProductSearch={setProductSearch}
        selectedProduct={selectedProduct}
        savingLine={savingLine}
        isDeletingLine={isDeletingLine}
        onAddLine={onAddLine}
        onDeleteLine={onDeleteLine}
        productNameMap={productNameMap}
      />

      {purchaseOrderId && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-6 py-4 shadow-sm dark:border-indigo-900/40 dark:bg-indigo-950/20">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Hoàn tất thêm dòng hàng?</p>
            <p className="text-xs text-slate-500 mt-0.5">Xem chi tiết đơn, phê duyệt và tạo phiếu nhập hàng từ đây.</p>
          </div>
          <Button
            render={<Link href={`/purchase-orders/${purchaseOrderId}`} />}
            nativeButton={false}
            size="sm"
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 gap-1.5 shrink-0"
          >
            Xem chi tiết & nhận hàng
            <ExternalLink className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
