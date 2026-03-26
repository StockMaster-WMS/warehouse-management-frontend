"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  PackagePlus,
  Play,
  Box,
  Truck,
  Trash2,
  Loader2,
  ChevronDown,
  Package,
  MapPin,
  User,
  AlertCircle,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { apiErrMessage } from "@/types/api";
import { formatShippingShort, salesOrderStatusColor, salesOrderStatusLabel } from "@/types/sales-order";
import type { Product } from "@/types/product";
import type { SoItem } from "@/types/so-item";
import type { PickingItem, PickingItemStatus } from "@/types/picking-item";

import {
  useGetSalesOrderByIdQuery,
  useStartPickingMutation,
  useMarkPackedMutation,
  useMarkShippedMutation,
} from "@/store/services/order.service";
import { useGetSoItemsQuery, useCreateSoItemMutation, useDeleteSoItemMutation } from "@/store/services/so-item.service";
import { useGetProductsQuery } from "@/store/services/product.service";
import {
  useGetPickingItemsQuery,
  useCreatePickingItemMutation,
  useUpdatePickingItemMutation,
} from "@/store/services/picking-item.service";

const soLineSchema = z.object({
  productId: z.string().min(1, "Chọn sản phẩm"),
  orderedQtyStr: z.string().min(1, "Nhập số lượng"),
  unitPriceStr: z.string().optional(),
});

const pickingCreateSchema = z.object({
  locationId: z.string().min(1, "Nhập locationId"),
  qtyToPickStr: z.string().min(1, "Nhập qtyToPick"),
  status: z.enum(["PENDING", "PICKED"]),
  qtyPickedStr: z.string().optional(),
});

function parsePositiveNumber(raw: string): number | null {
  const n = Number(String(raw ?? "").trim().replace(",", "."));
  if (!Number.isFinite(n) || !(n > 0)) return null;
  return n;
}

function parseNonNegativeNumber(raw: string): number | null {
  const n = Number(String(raw ?? "").trim().replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function computePickedSummary(soItem: SoItem, picks: PickingItem[]) {
  const totalToPick = picks.reduce((s, p) => s + (p.qtyToPick ?? 0), 0);
  const totalPicked = picks.reduce((s, p) => s + (p.qtyPicked ?? 0), 0);
  const allPicked = picks.length > 0 && picks.every((p) => p.status === "PICKED" && (p.qtyPicked ?? 0) === p.qtyToPick);
  const enoughForLine = totalPicked >= soItem.orderedQty;
  return { totalToPick, totalPicked, allPicked, enoughForLine };
}

function SoItemPickingBlock({
  soItem,
  salesOrderStatus,
  productsById,
}: {
  soItem: SoItem;
  salesOrderStatus: string;
  productsById: Map<string, Product>;
}) {
  const { data: picksRes, isFetching } = useGetPickingItemsQuery({ soItemId: soItem.id });
  const picks = useMemo(() => picksRes?.data?.content ?? [], [picksRes]);

  const [createPicking, { isLoading: creatingPick }] = useCreatePickingItemMutation();
  const [updatePicking, { isLoading: updatingPick }] = useUpdatePickingItemMutation();

  const [locationId, setLocationId] = useState("");
  const [qtyToPickStr, setQtyToPickStr] = useState("");
  const [pickStatus, setPickStatus] = useState<PickingItemStatus>("PENDING");
  const [qtyPickedStr, setQtyPickedStr] = useState("");
  const [pickErrors, setPickErrors] = useState<Record<string, string>>({});
  const [recentLocations, setRecentLocations] = useState<string[]>([]);

  const recentKey = useMemo(() => `recentLocations:soItem:${soItem.id}`, [soItem.id]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(recentKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
        setRecentLocations(parsed.slice(0, 8));
      }
    } catch {
      // ignore
    }
  }, [recentKey]);

  function rememberLocation(loc: string) {
    const v = String(loc || "").trim().toUpperCase();
    if (!v) return;
    setRecentLocations((prev) => {
      const next = [v, ...prev.filter((x) => x !== v)].slice(0, 8);
      try {
        localStorage.setItem(recentKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  const allowPickingMutation = salesOrderStatus === "PENDING" || salesOrderStatus === "PICKING";
  const summary = useMemo(() => computePickedSummary(soItem, picks), [soItem, picks]);
  const product = productsById.get(soItem.productId);

  useEffect(() => {
    if (pickStatus === "PICKED") {
      const q = qtyToPickStr.trim();
      if (q) setQtyPickedStr(q);
    } else if (pickStatus === "PENDING") {
      setQtyPickedStr("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickStatus]);

  async function onCreatePick(e: React.FormEvent) {
    e.preventDefault();
    if (!allowPickingMutation) {
      toast.error("Không thể tạo picking khi đơn đã PACKED/SHIPPED.");
      return;
    }
    setPickErrors({});
    const parsed = pickingCreateSchema.safeParse({
      locationId,
      qtyToPickStr,
      status: pickStatus,
      qtyPickedStr: qtyPickedStr || undefined,
    });
    if (!parsed.success) {
      const err: Record<string, string> = {};
      for (const issue of parsed.error.issues) err[String(issue.path[0] ?? "form")] = issue.message;
      setPickErrors(err);
      toast.error("Kiểm tra picking item");
      return;
    }

    const qtyToPick = parsePositiveNumber(parsed.data.qtyToPickStr);
    if (qtyToPick == null) {
      setPickErrors({ qtyToPickStr: "qtyToPick phải > 0" });
      toast.error("qtyToPick không hợp lệ");
      return;
    }

    const qtyPicked =
      parsed.data.qtyPickedStr?.trim() ? parseNonNegativeNumber(parsed.data.qtyPickedStr) : 0;
    if (qtyPicked == null) {
      setPickErrors({ qtyPickedStr: "qtyPicked phải >= 0" });
      toast.error("qtyPicked không hợp lệ");
      return;
    }
    if (qtyPicked > qtyToPick) {
      setPickErrors({ qtyPickedStr: "qtyPicked không được vượt qtyToPick" });
      toast.error("qtyPicked không hợp lệ");
      return;
    }
    if (parsed.data.status === "PICKED" && qtyPicked !== qtyToPick) {
      setPickErrors({ qtyPickedStr: "Nếu PICKED thì qtyPicked phải = qtyToPick" });
      toast.error("Nếu PICKED thì qtyPicked phải = qtyToPick");
      return;
    }

    try {
      const res = await createPicking({
        soItemId: soItem.id,
        productId: soItem.productId,
        locationId: parsed.data.locationId.trim().toUpperCase(),
        qtyToPick,
        status: parsed.data.status,
        qtyPicked,
      }).unwrap();
      if (!res.success) {
        toast.error(res.message || "Tạo picking thất bại");
        return;
      }
      toast.success(res.message || "Đã tạo picking");
      rememberLocation(parsed.data.locationId);
      setLocationId("");
      setQtyToPickStr("");
      setPickStatus("PENDING");
      setQtyPickedStr("");
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  async function onQuickMarkPicked(p: PickingItem) {
    if (!allowPickingMutation) {
      toast.error("Không thể cập nhật picking khi đơn đã PACKED/SHIPPED.");
      return;
    }
    try {
      const res = await updatePicking({ id: p.id, soItemId: p.soItemId, qtyPicked: p.qtyToPick, status: "PICKED" }).unwrap();
      if (!res.success) toast.error(res.message || "Cập nhật thất bại");
      else toast.success("Đã cập nhật PICKED");
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  return (
    <details className="group rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            Line #{soItem.lineNumber} · {product?.name ?? "Sản phẩm"}{" "}
            <span className="text-xs font-mono text-slate-400">({soItem.productSku})</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Ordered <span className="font-semibold tabular-nums">{soItem.orderedQty}</span> · Picked{" "}
            <span className={`font-semibold tabular-nums ${summary.enoughForLine ? "text-emerald-600" : "text-amber-600"}`}>
              {summary.totalPicked}
            </span>{" "}
            / <span className="tabular-nums">{summary.totalToPick}</span>
            {isFetching ? <span className="ml-2 text-[11px] text-slate-400">Đang cập nhật…</span> : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${summary.allPicked ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
            {summary.allPicked ? "Đã PICKED" : "Chưa xong"}
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400 transition group-open:rotate-180" />
        </div>
      </summary>

      <div className="border-t border-slate-100 p-4 dark:border-slate-800">
        <div className="space-y-3">
        {picks.length === 0 ? (
          <p className="text-xs text-slate-500">Chưa có picking items.</p>
        ) : (
          <div className="space-y-2">
            {picks.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/40">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Location: <span className="font-mono">{p.locationId}</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    qtyToPick: <span className="tabular-nums font-semibold">{p.qtyToPick}</span> · qtyPicked:{" "}
                    <span className="tabular-nums font-semibold">{p.qtyPicked ?? 0}</span> · status:{" "}
                    <span className="font-mono">{p.status}</span>
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!allowPickingMutation || updatingPick || p.status === "PICKED"}
                  onClick={() => onQuickMarkPicked(p)}
                >
                  {updatingPick ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Mark PICKED
                </Button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={onCreatePick} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <PackagePlus className="h-4 w-4 text-indigo-600" />
            <p className="text-xs font-bold uppercase text-slate-500">Tạo picking item</p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-slate-500">locationId *</label>
              {recentLocations.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {recentLocations.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocationId(loc)}
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-mono text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              ) : null}
              <Input
                value={locationId}
                onChange={(e) => {
                  const v = e.target.value;
                  setLocationId(v.toUpperCase());
                  setPickErrors((prev) => ({ ...prev, locationId: "" }));
                }}
                onBlur={() => setLocationId((v) => v.trim().toUpperCase())}
                placeholder="LOC-001"
              />
              {pickErrors.locationId ? <p className="text-xs text-rose-600">{pickErrors.locationId}</p> : null}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-slate-500">qtyToPick *</label>
              <Input
                value={qtyToPickStr}
                onChange={(e) => {
                  const v = e.target.value;
                  setQtyToPickStr(v);
                  setPickErrors((prev) => ({ ...prev, qtyToPickStr: "" }));
                  if (pickStatus === "PICKED") setQtyPickedStr(v);
                }}
                placeholder="10"
                inputMode="decimal"
              />
              {pickErrors.qtyToPickStr ? <p className="text-xs text-rose-600">{pickErrors.qtyToPickStr}</p> : null}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-slate-500">status *</label>
              <Select value={pickStatus} onValueChange={(v) => setPickStatus(v as PickingItemStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">PENDING</SelectItem>
                  <SelectItem value="PICKED">PICKED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-slate-500">qtyPicked</label>
              <Input
                value={qtyPickedStr}
                onChange={(e) => {
                  setQtyPickedStr(e.target.value);
                  setPickErrors((prev) => ({ ...prev, qtyPickedStr: "" }));
                }}
                placeholder={pickStatus === "PICKED" ? qtyToPickStr || "0" : "0"}
                inputMode="decimal"
              />
              {pickErrors.qtyPickedStr ? <p className="text-xs text-rose-600">{pickErrors.qtyPickedStr}</p> : null}
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <Button type="submit" size="sm" disabled={!allowPickingMutation || creatingPick}>
              {creatingPick ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Tạo picking
            </Button>
          </div>
        </form>
        </div>
      </div>
    </details>
  );
}

export default function SalesOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const salesOrderId = String(params.id);

  const { data: soRes, isLoading, isError, error, refetch, isFetching } = useGetSalesOrderByIdQuery(salesOrderId);
  const so = soRes?.data;

  const { data: itemsRes, isFetching: itemsFetching } = useGetSoItemsQuery(
    { salesOrderId },
    { skip: !so }
  );
  const soItems = useMemo(() => itemsRes?.data?.content ?? [], [itemsRes]);

  const { data: productsRes } = useGetProductsQuery({ page: 0, size: 200, sort: "updatedAt" });
  const products = useMemo(() => productsRes?.data?.content ?? [], [productsRes]);
  const productsById = useMemo(() => new Map(products.map((p) => [String(p.id), p as Product])), [products]);

  const [createSoItem, { isLoading: creatingLine }] = useCreateSoItemMutation();
  const [deleteSoItem, { isLoading: deletingLine }] = useDeleteSoItemMutation();

  const [startPicking, { isLoading: starting }] = useStartPickingMutation();
  const [markPacked, { isLoading: packing }] = useMarkPackedMutation();
  const [markShipped, { isLoading: shipping }] = useMarkShippedMutation();

  const [lineProductId, setLineProductId] = useState("");
  const [lineQtyStr, setLineQtyStr] = useState("1");
  const [linePriceStr, setLinePriceStr] = useState("");
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});

  const status = so?.status ?? "PENDING";
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

  async function onAddLine(e: React.FormEvent) {
    e.preventDefault();
    if (!so) return;
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
        salesOrderId: so.id,
        lineNumber: nextLineNumber,
        productId: String(prod.id),
        productSku: String(prod.sku ?? ""),
        orderedQty: qty,
        ...(unitPrice != null ? { unitPrice } : {}),
      }).unwrap();
      if (!res.success) {
        toast.error(res.message || "Thêm dòng thất bại");
        return;
      }
      toast.success("Đã thêm dòng");
      setLineProductId("");
      setLineQtyStr("");
      setLinePriceStr("");
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  async function onDeleteLine(item: SoItem) {
    if (!so) return;
    if (!allowLineMutation) {
      toast.error("Chỉ được xóa dòng khi đơn đang PENDING.");
      return;
    }
    try {
      const res = await deleteSoItem({ id: item.id, salesOrderId: so.id }).unwrap();
      if (!res.success) {
        toast.error(res.message || "Xóa dòng thất bại");
        return;
      }
      toast.success("Đã xóa dòng");
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  async function onStartPicking() {
    if (!so) return;
    if (soItems.length === 0) {
      toast.error("Thêm ít nhất 1 dòng hàng trước khi bắt đầu lấy hàng.");
      return;
    }
    try {
      const res = await startPicking({ salesOrderId: so.id }).unwrap();
      if (!res.success) toast.error(res.message || "Không thể bắt đầu lấy hàng");
      else toast.success("Đã chuyển sang PICKING");
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  async function onMarkPacked() {
    if (!so) return;
    if (soItems.length === 0) {
      toast.error("Không thể đóng gói khi đơn chưa có dòng hàng.");
      return;
    }
    if (so.status === "PICKING") {
      const ok = window.confirm(
        "Đơn đang ở trạng thái PICKING. Bạn chỉ nên đóng gói khi đã lấy đủ hàng (PICKED). Bạn chắc chắn muốn tiếp tục?"
      );
      if (!ok) return;
    }
    try {
      const res = await markPacked({ salesOrderId: so.id }).unwrap();
      if (!res.success) toast.error(res.message || "Đóng gói thất bại");
      else toast.success("Đã đóng gói");
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  async function onMarkShipped() {
    if (!so) return;
    if (soItems.length === 0) {
      toast.error("Không thể xuất kho khi đơn chưa có dòng hàng.");
      return;
    }
    const ok = window.confirm("Xác nhận xuất kho / bàn giao đơn này?");
    if (!ok) return;
    try {
      const res = await markShipped({ salesOrderId: so.id }).unwrap();
      if (!res.success) toast.error(res.message || "Xuất kho thất bại");
      else toast.success("Đã xuất kho");
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chi tiết đơn xuất"
        description="Quy trình: PENDING → PICKING → PICKED → PACKED → SHIPPED"
        actions={
          <Button
            render={<Link href="/orders" />}
            nativeButton={false}
            variant="ghost"
            size="icon-sm"
            className="rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <Skeleton className="h-5 w-48" />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ) : isError || !so ? (
        <EmptyState
          icon={AlertCircle}
          title="Không thể tải đơn xuất"
          description={apiErrMessage(error, "Không tải được dữ liệu đơn.")}
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Thử lại
            </Button>
          }
          className="py-10"
        />
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Sales order</p>
                <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                  {so.soNumber || `SO-${so.id.slice(0, 8)}`}
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="font-semibold">{so.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{formatShippingShort(so.shippingAddress)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <Package className="h-4 w-4 text-slate-400" />
                    <span>{soItems.length} dòng hàng</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:w-[360px]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Trạng thái</span>
                  <div className="flex items-center gap-2">
                    {isFetching ? <span className="text-[11px] text-slate-400">Đang cập nhật…</span> : null}
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${salesOrderStatusColor(so.status)}`}>
                      {salesOrderStatusLabel(so.status)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
                  <Button
                    type="button"
                    onClick={onStartPicking}
                    disabled={starting || so.status !== "PENDING" || soItems.length === 0}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    {starting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                    Bắt đầu lấy hàng
                  </Button>
                  <Button
                    type="button"
                    onClick={onMarkPacked}
                    disabled={packing || (so.status !== "PICKING" && so.status !== "PICKED")}
                    variant="outline"
                    className="w-full"
                  >
                    {packing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Box className="mr-2 h-4 w-4" />}
                    Đóng gói
                  </Button>
                  <Button
                    type="button"
                    onClick={onMarkShipped}
                    disabled={shipping || so.status !== "PACKED"}
                    variant="outline"
                    className="w-full"
                  >
                    {shipping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}
                    Xuất kho
                  </Button>
                </div>

                <p className="text-[11px] text-slate-500">
                  - SO items chỉ sửa khi <span className="font-mono">PENDING</span>.{" "}
                  - Picking chỉ sửa khi <span className="font-mono">PENDING/PICKING</span>.{" "}
                  - Khi <span className="font-mono">PICKED</span> có thể chuyển sang đóng gói.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-4 border-b pb-4 dark:border-slate-800">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Dòng hàng (SO items)</p>
                <p className="mt-1 text-xs text-slate-500">Chỉ thao tác khi đơn ở PENDING.</p>
              </div>
              <span className="text-xs text-slate-500">Tổng: {soItems.length}</span>
            </div>

            <div className="mt-4 space-y-4">
              <form onSubmit={onAddLine} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <PackagePlus className="h-4 w-4 text-indigo-600" />
                  <p className="text-xs font-bold uppercase text-slate-500">Thêm dòng hàng</p>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[11px] font-bold uppercase text-slate-500">Sản phẩm *</label>
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
                    <label className="text-[11px] font-bold uppercase text-slate-500">Số lượng *</label>
                    <Input value={lineQtyStr} onChange={(e) => setLineQtyStr(e.target.value)} disabled={!allowLineMutation} placeholder="1" />
                    {lineErrors.orderedQtyStr ? <p className="text-xs text-rose-600">{lineErrors.orderedQtyStr}</p> : null}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-500">Đơn giá</label>
                    <Input value={linePriceStr} onChange={(e) => setLinePriceStr(e.target.value)} disabled={!allowLineMutation} placeholder="0" />
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <Button type="submit" size="sm" disabled={!allowLineMutation || creatingLine}>
                    {creatingLine ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Thêm dòng (#{nextLineNumber})
                  </Button>
                </div>
              </form>

              {itemsFetching ? <p className="text-xs text-slate-400">Đang tải dòng hàng…</p> : null}

              {soItems.length === 0 ? (
                <p className="text-sm text-slate-500">Chưa có dòng hàng.</p>
              ) : (
                <div className="space-y-3">
                  {soItems.map((l) => (
                    <div key={l.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          Line #{l.lineNumber} · {productsById.get(l.productId)?.name ?? "Sản phẩm"}{" "}
                          <span className="text-xs font-mono text-slate-400">({l.productSku})</span>
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          orderedQty: <span className="tabular-nums font-semibold">{l.orderedQty}</span>
                          {l.unitPrice != null ? (
                            <>
                              {" "}· unitPrice: <span className="tabular-nums font-semibold">{l.unitPrice}</span>
                            </>
                          ) : null}
                        </p>
                      </div>
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
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Picking</p>
              <p className="mt-1 text-xs text-slate-500">
                Mỗi dòng hàng có thể có nhiều picking items (chia theo vị trí/lô). Nhấn vào từng dòng để mở chi tiết.
              </p>
            </div>

            {soItems.length === 0 ? (
              <p className="text-sm text-slate-500">Thêm dòng hàng trước.</p>
            ) : (
              <div className="space-y-4">
                {soItems.map((l) => (
                  <SoItemPickingBlock
                    key={`pick-${l.id}`}
                    soItem={l}
                    salesOrderStatus={so.status}
                    productsById={productsById}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

