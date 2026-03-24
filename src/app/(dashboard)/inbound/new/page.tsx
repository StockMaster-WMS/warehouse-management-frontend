"use client";

import { useMemo, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  ArrowLeft,
  Save,
  FileUp,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Warehouse as WarehouseType } from "@/types/warehouse";
import type { Product } from "@/types/product";
import {
  useGetProductsForPoQuery,
  useGetWarehousesForPoQuery,
} from "@/store/services/purchase-order.service";
import { useGetSuppliersQuery } from "@/store/services/supplier.service";
import { getSupplierDisplayName } from "@/types/supplier";
import type { InboundLine, FieldErrors, LineFormErrors } from "@/types/inbound";
import { InboundGeneralForm } from "@/components/features/InboundGeneralForm";
import { InboundLinesTable } from "@/components/features/InboundLinesTable";

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
  const debouncedProductSearch = useDebouncedValue(productSearch.trim());

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [lineFormErrors, setLineFormErrors] = useState<LineFormErrors>({});
  const [rowErrors, setRowErrors] = useState<Record<string, { qty?: string; price?: string }>>({});

  const [removeTarget, setRemoveTarget] = useState<InboundLine | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);



  const { data: suppliersRes, isError: suppliersErr, isFetching: suppliersLoading } =
    useGetSuppliersQuery({
      page: 0,
      size: 50,
      sort: "createdAt",
      sortDir: "desc",
    });
  const { data: warehousesRes, isError: warehousesErr, isFetching: warehousesLoading } =
    useGetWarehousesForPoQuery({});
  const {
    data: productsRes,
    isError: productsErr,
    isFetching: productsLoading,
  } = useGetProductsForPoQuery({
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

      <InboundGeneralForm
        supplierId={supplierId}
        setSupplierId={setSupplierId}
        warehouseId={warehouseId}
        setWarehouseId={setWarehouseId}
        inboundDate={inboundDate}
        setInboundDate={setInboundDate}
        note={note}
        setNote={setNote}
        transportMode={transportMode}
        setTransportMode={setTransportMode}
        fieldErrors={fieldErrors}
        setFieldErrors={setFieldErrors}
        supplierOptions={supplierOptions}
        warehouses={warehouses}
        selectedWarehouseName={selectedWarehouseName}
        suppliersErr={suppliersErr}
        suppliersLoading={suppliersLoading}
        warehousesErr={warehousesErr}
        warehousesLoading={warehousesLoading}
        transportLabel={transportLabel}
      />

      <InboundLinesTable
        lines={lines}
        onAddLine={addLine}
        lineProductId={lineProductId}
        setLineProductId={setLineProductId}
        lineQtyStr={lineQtyStr}
        setLineQtyStr={setLineQtyStr}
        linePriceStr={linePriceStr}
        setLinePriceStr={setLinePriceStr}
        lineFormErrors={lineFormErrors}
        setLineFormErrors={setLineFormErrors}
        rowErrors={rowErrors}
        updateLineQty={updateLineQty}
        updateLinePrice={updateLinePrice}
        setRemoveTarget={setRemoveTarget}
        productOptions={productOptions}
        selectedLineProduct={selectedLineProduct}
        productsErr={productsErr}
        productsLoading={productsLoading}
        productSearch={productSearch}
        setProductSearch={setProductSearch}
        totals={totals}
        fieldErrors={fieldErrors}
      />

      {/* Action bar */}
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
