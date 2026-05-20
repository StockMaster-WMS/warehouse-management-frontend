"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ClipboardList, Loader2, PackagePlus, Pencil, Trash2 } from "lucide-react";
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
import { useGetStocksQuery } from "@/store/services/stock.service";
import {
  formatLotLine,
  parsePositiveNumber,
  soLineSchema,
  stockRowLocationLabel,
} from "./OrderDetailUtils";
import { OrderLineEditDialog } from "./OrderLineEditDialog";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGetProductsQuery } from "@/store/services/product.service";

type OrderLinesSectionProps = {
  salesOrder: SalesOrder;
  soItems: SoItem[];
  products: Product[];
  itemsFetching: boolean;
};

export function OrderLinesSection({ salesOrder, soItems, products, itemsFetching }: OrderLinesSectionProps) {
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
    status: "ACTIVE",
  });
  const selectableProducts = useMemo(
    () => selectableProductsRes?.data?.content ?? [],
    [selectableProductsRes],
  );

  const productsById = useMemo(() => {
    const entries = [...products, ...selectableProducts]
      .map((p) => [String(p.id), p as Product] as const);

    if (selectedLineProduct) {
      entries.push([String(selectedLineProduct.id), selectedLineProduct]);
    }

    return new Map(entries);
  }, [products, selectableProducts, selectedLineProduct]);

  const status = salesOrder.status;
  const allowLineMutation = status === "DRAFT" || status === "PENDING";

  const nextLineNumber = useMemo(() => {
    if (soItems.length === 0) return 1;
    return Math.max(...soItems.map((l) => l.lineNumber)) + 1;
  }, [soItems]);

  const productOptions = useMemo(
    () =>
      [
        ...(selectedLineProduct && !selectableProducts.some((p) => p.id === selectedLineProduct.id)
          ? [selectedLineProduct]
          : []),
        ...selectableProducts,
      ].map((p) => ({
        value: String(p.id),
        label: `${p.sku ? `${p.sku} · ` : ""}${p.name ?? p.id}`,
        hint: (p as Product).sku ? String((p as Product).sku) : undefined,
      })),
    [selectableProducts, selectedLineProduct]
  );

  const canQueryLineStock = Boolean(salesOrder.warehouseId && lineProductId.trim());
  const {
    data: lineStocksRes,
    isFetching: lineStocksLoading,
    isError: lineStocksError,
    error: lineStocksErr,
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
  const lineOrderQty = useMemo(() => parsePositiveNumber(lineQtyStr), [lineQtyStr]);

  const canQueryProductStockHint = Boolean(lineProductId.trim());
  const { data: productStocksRes, isFetching: productStocksLoading } = useGetStocksQuery(
    {
      productId: lineProductId.trim() || "—",
      expand: "location,warehouse,product",
      page: 0,
      size: 100,
      sort: "updatedAt",
      sortDir: "desc",
    },
    { skip: !canQueryProductStockHint }
  );
  const stockHintByWarehouse = useMemo(() => {
    const rows = productStocksRes?.data?.content ?? [];
    const map = new Map<string, { warehouseId: string; label: string; totalAvail: number }>();
    for (const r of rows) {
      const wid = String(r.warehouseId ?? "").trim();
      if (!wid) continue;
      const add = Number(r.qtyAvailable ?? 0);
      const name = r.warehouse?.name?.trim();
      const code = r.warehouse?.code?.trim();
      const label = [code, name].filter(Boolean).join(" · ") || wid;
      const prev = map.get(wid);
      if (prev) prev.totalAvail += add;
      else map.set(wid, { warehouseId: wid, label, totalAvail: add });
    }
    return Array.from(map.values()).toSorted((a, b) => b.totalAvail - a.totalAvail);
  }, [productStocksRes]);

  const newOrderWarehousePrefillId = useMemo(() => {
    const wid = salesOrder.warehouseId;
    if (!wid) return null;
    const other = stockHintByWarehouse.find((h) => h.warehouseId !== wid);
    return other?.warehouseId ?? null;
  }, [salesOrder, stockHintByWarehouse]);

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
        <form onSubmit={onAddLine} className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="mb-2 flex items-center gap-2">
            <PackagePlus className="h-4 w-4 text-primary" />
            <p className="text-xs font-bold uppercase text-muted-foreground">Thêm dòng</p>
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
                    : selectableProductsLoading
                      ? "Đang tải sản phẩm..."
                      : "Chọn hoặc gõ để tìm..."
                }
                searchPlaceholder="Tìm theo tên / mã hàng…"
                emptyText="Không tìm thấy sản phẩm đang hoạt động phù hợp"
                disabled={!allowLineMutation || selectableProductsError}
                loading={selectableProductsLoading}
                error={Boolean(lineErrors.productId)}
                serverSearch
                searchQuery={productSearch}
                onSearchChange={setProductSearch}
              />
              {selectableProductsError ? <p className="text-xs text-amber-600">Không tải được danh sách sản phẩm.</p> : null}
              {lineErrors.productId ? <p className="text-xs text-rose-600">{lineErrors.productId}</p> : null}
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

          {canQueryLineStock ? (
            <div className="mt-3 rounded-md border border-border bg-card px-3 py-2">
              <p className="text-[11px] font-bold uppercase text-muted-foreground">Tồn tại kho đơn</p>
              {lineStocksLoading ? (
                <p className="mt-2 text-xs text-slate-400">Đang tải…</p>
              ) : lineStocksError ? (
                <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">
                  {apiErrMessage(lineStocksErr, "Không tải được tồn.")}
                </p>
              ) : lineStockRows.length === 0 ? (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-amber-900 dark:text-amber-100/90">
                    <span className="font-semibold">Không có tồn</span> cho SP này tại kho đơn.
                  </p>
                  {productStocksLoading ? (
                    <p className="text-[11px] text-slate-500">Đang tìm tồn các kho khác…</p>
                  ) : stockHintByWarehouse.length > 0 ? (
                    <div className="rounded-md border border-indigo-200/80 bg-indigo-50/90 px-3 py-2 text-[11px] text-indigo-950 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-100">
                      <p className="font-semibold">Tồn ở kho khác:</p>
                      <ul className="mt-1 list-inside list-disc space-y-1">
                        {stockHintByWarehouse.map((h) => (
                          <li key={h.warehouseId}>
                            <span className="font-medium">{h.label}</span> —{" "}
                            <span className="tabular-nums font-semibold">{h.totalAvail}</span>
                            {h.warehouseId === salesOrder.warehouseId ? (
                              <span className="ml-1 text-rose-600 dark:text-rose-300">(trùng kho đơn — kiểm tra backend)</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 border-t border-indigo-200/60 pt-2 dark:border-indigo-500/20">
                        <Link
                          href={
                            newOrderWarehousePrefillId
                              ? `/orders/new?warehouseId=${encodeURIComponent(newOrderWarehousePrefillId)}`
                              : "/orders/new"
                          }
                          className="font-medium text-indigo-700 underline underline-offset-2 dark:text-indigo-300"
                        >
                          Tạo đơn mới
                        </Link>{" "}
                        nếu cần đúng kho.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-800/95 dark:text-amber-200/90">Không thấy tồn ở kho nào.</p>
                  )}
                </div>
              ) : (
                <>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                    Khả dụng:{" "}
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{lineStockTotalAvailable}</span>
                  </p>
                  {lineOrderQty != null && lineOrderQty > lineStockTotalAvailable ? (
                    <p className="mt-2 rounded-md bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                      Đặt ({lineOrderQty}) &gt; khả dụng ({lineStockTotalAvailable}) — có thể bị từ chối.
                    </p>
                  ) : null}
                  <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-[11px] text-slate-600 dark:text-slate-400">
                    {lineStockRows.map((r) => (
                      <li
                        key={r.id}
                        className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 border-b border-slate-100 pb-1 last:border-0 dark:border-slate-800"
                      >
                        <span className="min-w-0 text-slate-700 dark:text-slate-200">
                          <span className="font-mono font-semibold">{stockRowLocationLabel(r)}</span>
                          <span className="ml-1.5 text-slate-500">
                            · Lô: <span className="font-mono">{formatLotLine(r.lotNumber)}</span>
                          </span>
                        </span>
                        <span className="shrink-0 tabular-nums">
                          <span className="font-semibold">{r.qtyAvailable}</span> kd
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : (
            <p className="mt-3 text-[11px] text-slate-400">Chọn sản phẩm để xem tồn tại kho đơn.</p>
          )}

          <div className="mt-3 flex justify-end">
            <Button type="submit" size="sm" disabled={!allowLineMutation || creatingLine || creatingLineAndPicking || updatingLine}>
              {creatingLine || creatingLineAndPicking || updatingLine ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Thêm dòng
            </Button>
          </div>
        </form>

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
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}
