"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ClipboardList, Loader2, PackagePlus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { apiErrMessage } from "@/types/api";
import type { Product } from "@/types/product";
import type { SalesOrder } from "@/types/sales-order";
import type { SoItem } from "@/types/so-item";
import { useCreateSoItemMutation, useDeleteSoItemMutation } from "@/store/services/so-item.service";
import { useGetStocksQuery } from "@/store/services/stock.service";
import {
  formatLotLine,
  parsePositiveNumber,
  soLineSchema,
  stockRowLocationLabel,
} from "./OrderDetailUtils";
import { OrderLineEditDialog } from "./OrderLineEditDialog";

type OrderLinesSectionProps = {
  salesOrder: SalesOrder;
  soItems: SoItem[];
  products: Product[];
  itemsFetching: boolean;
};

export function OrderLinesSection({ salesOrder, soItems, products, itemsFetching }: OrderLinesSectionProps) {
  const [createSoItem, { isLoading: creatingLine }] = useCreateSoItemMutation();
  const [deleteSoItem, { isLoading: deletingLine }] = useDeleteSoItemMutation();

  const [lineProductId, setLineProductId] = useState("");
  const [lineQtyStr, setLineQtyStr] = useState("1");
  const [linePriceStr, setLinePriceStr] = useState("");
  const [autoAllocatePicking, setAutoAllocatePicking] = useState(true);
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});
  const [editingLine, setEditingLine] = useState<SoItem | null>(null);

  const productsById = useMemo(() => new Map(products.map((p) => [String(p.id), p as Product])), [products]);

  const status = salesOrder.status;
  const allowLineMutation = status === "PENDING";

  const nextLineNumber = useMemo(() => {
    if (soItems.length === 0) return 1;
    return Math.max(...soItems.map((l) => l.lineNumber)) + 1;
  }, [soItems]);

  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        value: String(p.id),
        label: String(p.name ?? p.id),
        hint: (p as Product).sku ? String((p as Product).sku) : undefined,
      })),
    [products]
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
      page: 0,
      size: 100,
    },
    { skip: !canQueryLineStock }
  );
  const lineStockRows = useMemo(() => {
    const rows = lineStocksRes?.data?.content ?? [];
    return [...rows].sort((a, b) => Number(b.qtyAvailable ?? 0) - Number(a.qtyAvailable ?? 0));
  }, [lineStocksRes]);
  const lineStockTotalAvailable = useMemo(
    () => lineStockRows.reduce((s, r) => s + Number(r.qtyAvailable ?? 0), 0),
    [lineStockRows]
  );
  const lineOrderQty = useMemo(() => parsePositiveNumber(lineQtyStr), [lineQtyStr]);

  const canQueryProductStockHint = Boolean(lineProductId.trim());
  const { data: productStocksRes, isFetching: productStocksLoading } = useGetStocksQuery(
    { productId: lineProductId.trim() || "—", page: 0, size: 100 },
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
    return [...map.values()].sort((a, b) => b.totalAvail - a.totalAvail);
  }, [productStocksRes]);

  const newOrderWarehousePrefillId = useMemo(() => {
    const wid = salesOrder.warehouseId;
    if (!wid) return null;
    const other = stockHintByWarehouse.find((h) => h.warehouseId !== wid);
    return other?.warehouseId ?? null;
  }, [salesOrder, stockHintByWarehouse]);

  async function onAddLine(e: React.FormEvent) {
    e.preventDefault();
    if (!allowLineMutation) {
      toast.error("Chỉ được thêm/xóa dòng khi đơn đang PENDING.");
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
      for (const issue of parsed.error.issues) err[String(issue.path[0] ?? "form")] = issue.message;
      setLineErrors(err);
      toast.error("Kiểm tra dòng hàng");
      return;
    }

    const qty = parsePositiveNumber(parsed.data.orderedQtyStr);
    if (qty == null) {
      setLineErrors({ orderedQtyStr: "Số lượng phải > 0" });
      toast.error("Số lượng không hợp lệ");
      return;
    }

    const prod = productsById.get(parsed.data.productId);
    if (!prod) {
      toast.error("Chọn sản phẩm hợp lệ");
      return;
    }

    let unitPrice: number | undefined;
    if (parsed.data.unitPriceStr?.trim()) {
      const p = Number(parsed.data.unitPriceStr.replace(",", "."));
      if (Number.isFinite(p) && p >= 0) unitPrice = p;
    }

    try {
      const res = await createSoItem({
        salesOrderId: salesOrder.id,
        lineNumber: nextLineNumber,
        productId: String(prod.id),
        productSku: String(prod.sku ?? ""),
        orderedQty: qty,
        autoAllocatePicking,
        ...(unitPrice != null ? { unitPrice } : {}),
      }).unwrap();
      if (!res.success) {
        toast.error(res.message || "Thêm dòng thất bại");
        return;
      }
      toast.success(
        autoAllocatePicking ? "Đã thêm dòng và phân bổ picking theo tồn" : "Đã thêm dòng (picking thêm tay sau nếu cần)"
      );
      setLineProductId("");
      setLineQtyStr("");
      setLinePriceStr("");
    } catch (err) {
      const msg = apiErrMessage(err);
      const hint =
        /khả dụng|tồn|picking/i.test(msg) && autoAllocatePicking
          ? " — Gợi ý: đối chiếu «Tồn tại kho đơn» với màn tồn kho; hoặc tắt tự phân bổ."
          : "";
      toast.error(msg + hint);
    }
  }

  async function onDeleteLine(item: SoItem) {
    if (!allowLineMutation) {
      toast.error("Chỉ được xóa dòng khi đơn đang PENDING.");
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
            <CardDescription>Thêm / xóa khi đơn PENDING.</CardDescription>
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
                  setLineErrors((prev) => ({ ...prev, productId: "" }));
                }}
                options={productOptions}
                dialogTitle="Chọn sản phẩm"
                placeholder="Chọn hoặc gõ để tìm..."
                searchPlaceholder="Tìm theo tên / SKU…"
                emptyText="Không tìm thấy sản phẩm phù hợp"
                disabled={!allowLineMutation}
                error={Boolean(lineErrors.productId)}
              />
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

          <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-md border border-border bg-background px-3 py-2">
            <Checkbox
              checked={autoAllocatePicking}
              onCheckedChange={(v) => setAutoAllocatePicking(v === true)}
              disabled={!allowLineMutation}
              className="mt-0.5"
              aria-label="Tự phân bổ picking từ tồn kho"
            />
            <span className="text-xs leading-snug text-foreground">
              <span className="font-semibold">Tự phân bổ picking từ tồn</span>
            </span>
          </label>

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
                    <span className="font-semibold">Không có tồn</span> cho SP này tại kho đơn — tự phân bổ có thể lỗi.
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
                  {autoAllocatePicking && lineOrderQty != null && lineOrderQty > lineStockTotalAvailable ? (
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
            <Button type="submit" size="sm" disabled={!allowLineMutation || creatingLine}>
              {creatingLine ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Thêm dòng (#{nextLineNumber})
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
