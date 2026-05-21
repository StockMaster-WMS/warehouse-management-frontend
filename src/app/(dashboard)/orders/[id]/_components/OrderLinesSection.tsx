"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { ClipboardList, FileDown, FileUp, Loader2, PackagePlus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { apiErrMessage } from "@/types/api";
import type { Product } from "@/types/product";
import type { SalesOrder } from "@/types/sales-order";
import type { SoItem } from "@/types/so-item";
import { useCreateSoItemMutation, useDeleteSoItemMutation, useUpdateSoItemMutation } from "@/store/services/so-item.service";
import { useGetStockListQuery, useGetStocksQuery } from "@/store/services/stock.service";
import {
  parsePositiveNumber,
  soLineSchema,
} from "./OrderDetailUtils";
import { OrderLineEditDialog } from "./OrderLineEditDialog";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGetProductsQuery } from "@/store/services/product.service";
import { downloadAoAAsXlsx, readXlsxFirstSheetMatrix } from "@/lib/xlsx-utils";

type OrderLinesSectionProps = {
  salesOrder: SalesOrder;
  soItems: SoItem[];
  products: Product[];
  itemsFetching: boolean;
  canManageOrder?: boolean;
};

export function OrderLinesSection({ salesOrder, soItems, products, itemsFetching, canManageOrder = false }: OrderLinesSectionProps) {
  const [createSoItem, { isLoading: creatingLine }] = useCreateSoItemMutation();
  const [updateSoItem, { isLoading: updatingLine }] = useUpdateSoItemMutation();
  const [deleteSoItem, { isLoading: deletingLine }] = useDeleteSoItemMutation();
  const [creatingLineAndPicking, setCreatingLineAndPicking] = useState(false);

  const [lineProductId, setLineProductId] = useState("");
  const [lineQtyStr, setLineQtyStr] = useState("1");
  const [linePriceStr, setLinePriceStr] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedLineProduct, setSelectedLineProduct] = useState<Product | null>(null);
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});
  const [editingLine, setEditingLine] = useState<SoItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debouncedProductKeyword = useDebouncedValue(productSearch.trim());

  const {
    data: selectableProductsRes,
    isFetching: selectableProductsLoading,
    isError: selectableProductsError,
  } = useGetProductsQuery({
    page: 0,
    size: 50,
    sort: "name",
    keyword: debouncedProductKeyword || undefined,
    warehouseId: salesOrder.warehouseId,
    status: "ACTIVE",
  });
  const selectableProducts = useMemo(
    () => selectableProductsRes?.data?.content ?? [],
    [selectableProductsRes],
  );
  const {
    data: selectableStockRes,
    isFetching: selectableStockLoading,
    isError: selectableStockError,
  } = useGetStockListQuery({
    page: 0,
    size: 100,
    sort: "updatedAt",
    sortDir: "desc",
    warehouseId: salesOrder.warehouseId,
    keyword: debouncedProductKeyword || undefined,
    expand: "product",
  }, {
    skip: !salesOrder.warehouseId,
  });
  const selectableStockRows = useMemo(
    () => selectableStockRes?.data?.content ?? [],
    [selectableStockRes],
  );
  const { data: importProductsRes, isFetching: importProductsLoading } = useGetProductsQuery({
    page: 0,
    size: 1000,
    sort: "name",
    warehouseId: salesOrder.warehouseId,
    status: "ACTIVE",
  });
  const importProducts = useMemo(
    () => importProductsRes?.data?.content ?? [],
    [importProductsRes],
  );

  const stockOptionProducts = useMemo(() => {
    const map = new Map<string, Product>();
    for (const stock of selectableStockRows) {
      const productId = String(stock.productId ?? "").trim();
      if (!productId || map.has(productId)) continue;
      const productRef = stock.product;
      map.set(productId, {
        id: productId,
        sku: productRef?.sku ?? stock.productSku ?? productId,
        barcodeEan13: null,
        name: productRef?.name ?? stock.productName ?? `Sản phẩm ${productId}`,
        categoryId: "",
        primarySupplierId: null,
        baseUnit: "",
        weightKg: null,
        volumeCm3: null,
        minStockQty: productRef?.minQty ?? 0,
        qtyOnHand: Number(stock.qtyOnHand ?? 0),
        qtyAvailable: Number(stock.qtyAvailable ?? 0),
        isLotTracked: false,
        isExpiryTracked: false,
        isFrozen: false,
        isFragile: false,
        isHazmat: false,
        isHeavy: false,
        status: "ACTIVE",
        createdAt: "",
        updatedAt: stock.updatedAt ?? "",
        createdBy: "",
      });
    }
    return Array.from(map.values());
  }, [selectableStockRows]);

  const productsById = useMemo(() => {
    const entries = [...products, ...selectableProducts, ...stockOptionProducts]
      .map((p) => [String(p.id), p as Product] as const);

    if (selectedLineProduct) {
      entries.push([String(selectedLineProduct.id), selectedLineProduct]);
    }

    return new Map(entries);
  }, [products, selectableProducts, stockOptionProducts, selectedLineProduct]);

  const status = salesOrder.status;
  const allowLineMutation = canManageOrder && (status === "DRAFT" || status === "PENDING");

  const nextLineNumber = useMemo(() => {
    if (soItems.length === 0) return 1;
    return Math.max(...soItems.map((l) => l.lineNumber)) + 1;
  }, [soItems]);

  const productOptions = useMemo(() => {
    const aggregate = new Map<string, {
      product: Product;
      qtyOnHand: number;
      qtyAvailable: number;
    }>();

    for (const stock of selectableStockRows) {
      const productId = String(stock.productId ?? "").trim();
      if (!productId) continue;
      const product = productsById.get(productId) ?? stockOptionProducts.find((p) => p.id === productId);
      if (!product) continue;
      const current = aggregate.get(productId);
      if (current) {
        current.qtyOnHand += Number(stock.qtyOnHand ?? 0);
        current.qtyAvailable += Number(stock.qtyAvailable ?? 0);
      } else {
        aggregate.set(productId, {
          product,
          qtyOnHand: Number(stock.qtyOnHand ?? 0),
          qtyAvailable: Number(stock.qtyAvailable ?? 0),
        });
      }
    }

    const rows = Array.from(aggregate.values()).toSorted((a, b) => b.qtyAvailable - a.qtyAvailable);
    if (selectedLineProduct && !rows.some((row) => row.product.id === selectedLineProduct.id)) {
      rows.unshift({
        product: selectedLineProduct,
        qtyOnHand: Number(selectedLineProduct.qtyOnHand ?? selectedLineProduct.currentStock ?? 0),
        qtyAvailable: Number(selectedLineProduct.qtyAvailable ?? selectedLineProduct.availableStock ?? 0),
      });
    }

    return rows.map(({ product, qtyOnHand, qtyAvailable }) => ({
      value: String(product.id),
      label: `${product.sku ? `${product.sku} · ` : ""}${product.name ?? product.id}`,
      hint: `Tồn: ${qtyOnHand.toLocaleString("vi-VN")} · Khả dụng: ${qtyAvailable.toLocaleString("vi-VN")}`,
    }));
  }, [productsById, selectableStockRows, selectedLineProduct, stockOptionProducts]);

  const canQueryLineStock = Boolean(salesOrder.warehouseId && lineProductId.trim());
  const {
    data: lineStocksRes,
    isFetching: lineStocksLoading,
    isError: lineStocksError,
  } = useGetStocksQuery(
    {
      productId: lineProductId.trim() || "—",
      warehouseId: salesOrder.warehouseId,
      expand: "location,warehouse,product",
      page: 0,
      size: 100,
      sort: "updatedAt",
      sortDir: "desc",
    },
    { skip: !canQueryLineStock }
  );
  const lineStockRows = useMemo(() => {
    const rows = lineStocksRes?.data?.content ?? [];
    return rows.toSorted((a, b) => Number(b.qtyAvailable ?? 0) - Number(a.qtyAvailable ?? 0));
  }, [lineStocksRes]);
  const lineStockTotalAvailable = useMemo(
    () => lineStockRows.reduce((s, r) => s + Number(r.qtyAvailable ?? 0), 0),
    [lineStockRows]
  );
  const lineStockTotalOnHand = useMemo(
    () => lineStockRows.reduce((s, r) => s + Number(r.qtyOnHand ?? 0), 0),
    [lineStockRows]
  );

  async function createLineForProduct(productId: string) {
    if (!allowLineMutation) {
      toast.error("Chỉ được thêm/xóa dòng khi đơn đang NHÁP hoặc SẴN SÀNG.");
      return;
    }

    const qty = parsePositiveNumber(lineQtyStr);
    if (qty == null) {
      setLineErrors({ orderedQtyStr: "Số lượng phải > 0" });
      toast.error("Số lượng không hợp lệ");
      return;
    }

    const prod = productsById.get(productId);
    if (!prod) {
      toast.error("Chọn sản phẩm hợp lệ");
      return;
    }

    const grouped = new Map<string, { row: (typeof lineStockRows)[number]; avail: number }>();
    for (const r of lineStockRows) {
      const avail = Number(r.qtyAvailable ?? 0);
      if (avail <= 0) continue;
      const lot = String(r.lotNumber ?? "").trim().toUpperCase();
      const key = `${r.locationId}__${lot}`;
      const prev = grouped.get(key);
      if (prev) prev.avail += avail;
      else grouped.set(key, { row: r, avail });
    }

    const availableRows = Array.from(grouped.values()).toSorted((a, b) => b.avail - a.avail);

    const totalAvail = availableRows.reduce((s, x) => s + x.avail, 0);
    if (totalAvail < qty) {
      toast.error("Không đủ tồn kho");
      return;
    }

    let unitPrice: number | undefined;
    if (linePriceStr.trim()) {
      const p = Number(linePriceStr.replace(",", "."));
      if (Number.isFinite(p) && p >= 0) unitPrice = p;
    }

    const existing = soItems.find((i) => String(i.productId) === String(prod.id));
    if (existing) {
      // Merge: Update existing item
      const updateRes = await updateSoItem({
        id: existing.id,
        body: {
          salesOrderId: salesOrder.id,
          lineNumber: existing.lineNumber,
          productId: String(prod.id),
          productSku: String(prod.sku ?? ""),
          orderedQty: (existing.orderedQty || 0) + qty,
          unitPrice: unitPrice ?? (existing.unitPrice || undefined),
        },
      }).unwrap();

      if (!updateRes.success || !updateRes.data) {
        throw new Error(updateRes.message || "Cập nhật dòng thất bại");
      }
    } else {
      // Create new line
      const lineNumber = nextLineNumber;
      const soItemRes = await createSoItem({
        salesOrderId: salesOrder.id,
        lineNumber,
        productId: String(prod.id),
        productSku: String(prod.sku ?? ""),
        orderedQty: qty,
        ...(unitPrice != null ? { unitPrice } : {}),
      }).unwrap();

      if (!soItemRes.success || !soItemRes.data) {
        throw new Error(soItemRes.message || "Thêm dòng thất bại");
      }
    }

    toast.success(
      salesOrder.status === "DRAFT"
        ? "Đã thêm dòng hàng. Lệnh lấy hàng sẽ được tạo sau khi xác nhận và bắt đầu lấy hàng."
        : "Đã thêm dòng hàng. Bấm Bắt đầu lấy hàng để chuyển đơn sang bước lấy hàng.",
    );
    setLineProductId("");
    setSelectedLineProduct(null);
    setProductSearch("");
    setLineQtyStr("1");
    setLinePriceStr("");
    setLineErrors({});
  }

  async function onAddLine(e: React.FormEvent) {
    e.preventDefault();
    if (!allowLineMutation) {
      toast.error("Chỉ được thêm/xóa dòng khi đơn đang NHÁP hoặc SẴN SÀNG.");
      return;
    }
    setLineErrors({});
    const parsed = soLineSchema.safeParse({
      productId: lineProductId,
      orderedQtyStr: lineQtyStr,
      unitPriceStr: linePriceStr || undefined,
    });
    if (!parsed.success) {
      const err: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const fieldName = issue.path[0]?.toString() ?? "form";
        err[fieldName] = issue.message;
      }
      setLineErrors(err);
      toast.error("Kiểm tra dòng hàng");
      return;
    }

    try {
      setCreatingLineAndPicking(true);
      await createLineForProduct(parsed.data.productId);
    } catch (err) {
      toast.error("Không thể ghi nhận sản phẩm: " + apiErrMessage(err));
    } finally {
      setCreatingLineAndPicking(false);
    }
  }

  async function onDeleteLine(item: SoItem) {
    if (!allowLineMutation) {
      toast.error("Chỉ được xóa dòng khi đơn đang NHÁP hoặc SẴN SÀNG.");
      return;
    }
    try {
      const res = await deleteSoItem({ id: item.id, salesOrderId: salesOrder.id }).unwrap();
      if (!res.success) {
        toast.error(res.message || "Xóa dòng thất bại");
        return;
      }
      toast.success("Đã xóa dòng");
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  function findImportProduct(raw: string) {
    const key = raw.trim().toLowerCase();
    if (!key) return null;
    return importProducts.find((p) =>
      String(p.id).toLowerCase() === key ||
      String(p.sku ?? "").toLowerCase() === key ||
      String(p.name ?? "").trim().toLowerCase() === key
    ) ?? null;
  }

  async function onDownloadImportTemplate() {
    await downloadAoAAsXlsx(
      "sales-order-lines-template.xlsx",
      "Lines",
      [
        ["productSku", "orderedQty", "unitPrice"],
        ["SKU-001", 5, 120000],
      ],
    );
  }

  async function onImportLinesFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!allowLineMutation) {
      toast.error("Chỉ được nhập dòng khi đơn đang NHÁP hoặc SẴN SÀNG.");
      return;
    }
    if (!salesOrder.warehouseId) {
      toast.error("Đơn xuất chưa có kho, không thể lọc sản phẩm theo tồn kho.");
      return;
    }
    if (importProductsLoading) {
      toast.error("Đang tải danh sách sản phẩm theo kho, thử lại sau vài giây.");
      return;
    }

    try {
      const matrix = await readXlsxFirstSheetMatrix(await file.arrayBuffer());
      const [headers = [], ...rows] = matrix;
      const headerMap = new Map(headers.map((h, index) => [h.trim().toLowerCase(), index]));
      const productCol = headerMap.get("productsku") ?? headerMap.get("sku") ?? headerMap.get("productid") ?? headerMap.get("product");
      const qtyCol = headerMap.get("orderedqty") ?? headerMap.get("qty") ?? headerMap.get("quantity") ?? headerMap.get("soluong");
      const priceCol = headerMap.get("unitprice") ?? headerMap.get("price") ?? headerMap.get("dongia");

      if (productCol == null || qtyCol == null) {
        toast.error("File cần có cột productSku/sku và orderedQty/qty.");
        return;
      }

      const existingByProductId = new Map(soItems.map((item) => [String(item.productId), item]));
      let nextNumber = soItems.length === 0 ? 1 : Math.max(...soItems.map((item) => item.lineNumber)) + 1;
      let successCount = 0;
      const issues: string[] = [];

      for (const [rowIndex, row] of rows.entries()) {
        if (!row.some((cell) => cell.trim())) continue;
        const excelLine = rowIndex + 2;
        const product = findImportProduct(row[productCol] ?? "");
        const qty = parsePositiveNumber(row[qtyCol] ?? "");
        const rawPrice = priceCol != null ? row[priceCol] ?? "" : "";
        const parsedPrice = rawPrice.trim() ? Number(rawPrice.replace(",", ".")) : undefined;
        const unitPrice = typeof parsedPrice === "number" && Number.isFinite(parsedPrice) && parsedPrice >= 0
          ? parsedPrice
          : undefined;

        if (!product) {
          issues.push(`Dòng ${excelLine}: không tìm thấy sản phẩm trong kho đã chọn.`);
          continue;
        }
        if (qty == null) {
          issues.push(`Dòng ${excelLine}: số lượng không hợp lệ.`);
          continue;
        }

        const existing = existingByProductId.get(String(product.id));
        if (existing) {
          await updateSoItem({
            id: existing.id,
            body: {
              salesOrderId: salesOrder.id,
              lineNumber: existing.lineNumber,
              productId: String(product.id),
              productSku: String(product.sku ?? ""),
              orderedQty: Number(existing.orderedQty || 0) + qty,
              unitPrice: unitPrice ?? existing.unitPrice ?? undefined,
            },
          }).unwrap();
          existing.orderedQty = Number(existing.orderedQty || 0) + qty;
        } else {
          const res = await createSoItem({
            salesOrderId: salesOrder.id,
            lineNumber: nextNumber,
            productId: String(product.id),
            productSku: String(product.sku ?? ""),
            orderedQty: qty,
            ...(unitPrice != null ? { unitPrice } : {}),
          }).unwrap();
          if (res.data) {
            existingByProductId.set(String(product.id), res.data);
          }
          nextNumber += 1;
        }
        successCount += 1;
      }

      if (successCount > 0) {
        toast.success(`Đã nhập ${successCount} dòng hàng từ file.`);
      }
      if (issues.length > 0) {
        toast.warning(`${issues.length} dòng chưa nhập được. ${issues.slice(0, 2).join(" ")}`);
      }
      if (successCount === 0 && issues.length === 0) {
        toast.error("File không có dòng dữ liệu.");
      }
    } catch (err) {
      toast.error(apiErrMessage(err, "Không đọc được file nhập dòng hàng."));
    }
  }

  return (
    <>
    <OrderLineEditDialog open={editingLine != null} onOpenChange={(o) => !o && setEditingLine(null)} line={editingLine} />
    <Card className="gap-0 py-0 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-3 pt-5">
        <div className="flex min-w-0 gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-primary/5">
            <ClipboardList className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Dòng hàng</CardTitle>
            <CardDescription>Thêm / xóa dòng khi đơn ở trạng thái NHÁP hoặc SẴN SÀNG.</CardDescription>
          </div>
        </div>
        <Badge variant="secondary" className="rounded-md tabular-nums">
          {soItems.length}
        </Badge>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-4 pb-5 pt-4">
        {canManageOrder ? (
        <form onSubmit={onAddLine} className="rounded-lg border border-border bg-muted/30 p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={onImportLinesFile}
          />
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PackagePlus className="h-4 w-4 text-primary" />
              <p className="text-xs font-bold uppercase text-muted-foreground">Thêm dòng</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onDownloadImportTemplate}>
                <FileDown className="mr-1.5 h-3.5 w-3.5" />
                Mẫu file
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={!allowLineMutation || importProductsLoading}
              >
                <FileUp className="mr-1.5 h-3.5 w-3.5" />
                Nhập file
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-bold uppercase text-muted-foreground">Sản phẩm *</label>
              <SearchableSelect
                value={lineProductId}
                onValueChange={(v) => {
                  setLineProductId(v);
                  setSelectedLineProduct(productsById.get(v) ?? null);
                  setLineErrors((prev) => ({ ...prev, productId: "" }));
                }}
                options={productOptions}
                dialogTitle="Chọn sản phẩm"
                placeholder={
                  selectableProductsError
                    ? "Lỗi tải sản phẩm"
                    : selectableProductsLoading || selectableStockLoading
                      ? "Đang tải sản phẩm..."
                      : "Chọn hoặc gõ để tìm..."
                }
                searchPlaceholder="Tìm theo tên / mã hàng…"
                emptyText="Không tìm thấy sản phẩm có tồn trong kho này"
                disabled={!allowLineMutation || selectableProductsError || selectableStockError}
                loading={selectableProductsLoading || selectableStockLoading}
                error={Boolean(lineErrors.productId)}
                serverSearch
                searchQuery={productSearch}
                onSearchChange={setProductSearch}
              />
              {selectableProductsError || selectableStockError ? <p className="text-xs text-amber-600">Không tải được danh sách sản phẩm/tồn kho.</p> : null}
              {lineErrors.productId ? <p className="text-xs text-rose-600">{lineErrors.productId}</p> : null}
              {lineProductId ? (
                <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900">
                  {lineStocksLoading ? (
                    <span className="text-slate-500">Đang tải tồn kho của sản phẩm trong kho này...</span>
                  ) : lineStocksError ? (
                    <span className="text-rose-600">Không tải được tồn kho của sản phẩm.</span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="text-slate-500">Tồn trong kho này:</span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                        {lineStockTotalOnHand.toLocaleString("vi-VN")}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-500">Khả dụng:</span>
                      <span className={lineStockTotalAvailable > 0 ? "font-semibold tabular-nums text-emerald-600 dark:text-emerald-400" : "font-semibold tabular-nums text-rose-600 dark:text-rose-400"}>
                        {lineStockTotalAvailable.toLocaleString("vi-VN")}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Danh sách sản phẩm đã lọc theo kho xuất của đơn.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-muted-foreground">Số lượng *</label>
              <Input
                value={lineQtyStr}
                onChange={(e) => setLineQtyStr(e.target.value)}
                disabled={!allowLineMutation}
                placeholder="1"
              />
              {lineErrors.orderedQtyStr ? <p className="text-xs text-rose-600">{lineErrors.orderedQtyStr}</p> : null}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-muted-foreground">Đơn giá</label>
              <Input
                value={linePriceStr}
                onChange={(e) => setLinePriceStr(e.target.value)}
                disabled={!allowLineMutation}
                placeholder="0"
              />
            </div>
          </div>



          <div className="mt-3 flex justify-end">
            <Button type="submit" size="sm" disabled={!allowLineMutation || creatingLine || creatingLineAndPicking || updatingLine}>
              {creatingLine || creatingLineAndPicking || updatingLine ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Thêm dòng
            </Button>
          </div>
        </form>
        ) : null}

        {itemsFetching ? <p className="text-xs text-slate-400">Đang tải dòng…</p> : null}

        {soItems.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có dòng hàng.</p>
        ) : (
          <div className="space-y-2">
            {soItems.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">
                    Line #{l.lineNumber} · {productsById.get(l.productId)?.name ?? "Sản phẩm"}{" "}
                    <span className="text-xs font-mono text-muted-foreground">({l.productSku})</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    SL: <span className="tabular-nums font-semibold">{l.orderedQty}</span>
                    {l.unitPrice != null ? (
                      <>
                        {" "}
                        · Giá: <span className="tabular-nums font-semibold">{l.unitPrice}</span>
                      </>
                    ) : null}
                  </p>
                </div>
                {canManageOrder ? (
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!allowLineMutation}
                      onClick={() => setEditingLine(l)}
                    >
                      <Pencil className="mr-1.5 h-4 w-4" />
                      Sửa
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-rose-600"
                      disabled={!allowLineMutation || deletingLine}
                      onClick={() => onDeleteLine(l)}
                    >
                      {deletingLine ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                      Xóa
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}
