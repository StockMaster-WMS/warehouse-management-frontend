"use client";

import Link from "next/link";
import { use, useState } from "react";
import { z } from "zod";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Ban,
  Trash2,
  PackagePlus,
  ClipboardCheck,
  Building2,
  Warehouse,
  CalendarDays,
  Clock,
  MapPin,
  FileText,
  PackageCheck,
  AlertCircle,
  TrendingUp,
  ReceiptText,
  Activity,
  DollarSign,
  ShoppingCart,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { apiErrMessage } from "@/types/api";
import {
  useApprovePurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
  useCompletePutawayTaskMutation,
  useDeletePurchaseOrderMutation,
  useGetPurchaseOrderDetailQuery,
  useGetWarehousesForPoQuery,
} from "@/store/services/purchase-order.service";
import { useGetLocationsListQuery } from "@/store/services/location.service";
import { useGetSuppliersQuery } from "@/store/services/supplier.service";
import {
  useCreateInboundReceiptMutation,
  useGetInboundReceiptsByPoQuery,
} from "@/store/services/inbound.service";
import { ADMIN_MANAGER_ROLES } from "@/lib/access-control";
import { PermissionControl } from "@/components/permission-control";
import type { PutawayTask } from "@/types/purchase-order";
import type { InboundReceipt } from "@/types/inbound-receipt";

/* ── Status configs ────────────────────────────────────────────────── */
const PO_STATUS: Record<string, { label: string; cls: string; dotCls: string }> = {
  DRAFT: {
    label: "Nháp",
    cls: "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dotCls: "bg-slate-400",
  },
  APPROVED: {
    label: "Đã duyệt",
    cls: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900",
    dotCls: "bg-blue-500",
  },
  PARTIAL: {
    label: "Nhận một phần",
    cls: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900",
    dotCls: "bg-amber-500",
  },
  COMPLETED: {
    label: "Hoàn tất",
    cls: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900",
    dotCls: "bg-emerald-500",
  },
  CANCELLED: {
    label: "Đã hủy",
    cls: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900",
    dotCls: "bg-rose-500",
  },
};

const GRN_STATUS: Record<string, { label: string; cls: string }> = {
  RECEIVED: { label: "Đã nhận", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" },
  PUTAWAY_IN_PROGRESS: { label: "Đang lên kệ", cls: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900" },
  COMPLETED: { label: "Hoàn tất", cls: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900" },
  CANCELLED: { label: "Đã hủy", cls: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900" },
};

const PUTAWAY_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Chờ xếp kệ", cls: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900" },
  IN_PROGRESS: { label: "Đang xếp", cls: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900" },
  COMPLETED: { label: "Hoàn tất", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" },
  CANCELLED: { label: "Đã hủy", cls: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900" },
};

function StatusPill({ map, value, fallback }: {
  map: Record<string, { label: string; cls: string }>;
  value: string | null | undefined;
  fallback?: string;
}) {
  const cfg = map[value ?? ""];
  if (!cfg) return <span className="text-xs text-slate-400">{value ?? fallback ?? "—"}</span>;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold", cfg.cls)}>
      {cfg.label}
    </span>
  );
}

const completeSchema = z.object({
  actualLocationId: z.string().min(1, "Chọn vị trí thực tế"),
});

/* ── InfoRow helper ─────────────────────────────────────────────────── */
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3.5 py-3.5 border-b border-slate-50 last:border-0 dark:border-slate-800/60 group">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 text-slate-500 shadow-sm dark:from-slate-800 dark:to-slate-800/60 dark:text-slate-400 group-hover:from-indigo-50 group-hover:to-slate-50 group-hover:text-indigo-600 transition-all dark:group-hover:from-indigo-950/40 dark:group-hover:text-indigo-400">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <div className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{value}</div>
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-slate-200 dark:text-slate-700 shrink-0" />
    </div>
  );
}

export default function PurchaseOrderDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(paramsPromise);

  const {
    data: detailRes,
    isLoading: detailLoading,
    isError: detailError,
    refetch,
  } = useGetPurchaseOrderDetailQuery(id, { skip: !id });

  const { data: receiptsRes } = useGetInboundReceiptsByPoQuery(id, { skip: !id });

  /* ── GRN dialog state ── */
  const [grnOpen, setGrnOpen] = useState(false);
  const [grnLocationId, setGrnLocationId] = useState("");
  const [grnNote, setGrnNote] = useState("");
  const [grnLines, setGrnLines] = useState<{ poItemId: string; receivedQty: string; note: string }[]>([]);

  /* ── Putaway dialog state ── */
  const [putawayOpen, setPutawayOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<PutawayTask | null>(null);
  const [actualLocationId, setActualLocationId] = useState("");
  const [putawayErrors, setPutawayErrors] = useState<Record<string, string>>({});

  /* ── Mutations ── */
  const [approvePo, { isLoading: approvingPo }] = useApprovePurchaseOrderMutation();
  const [cancelPo, { isLoading: cancellingPo }] = useCancelPurchaseOrderMutation();
  const [deletePo, { isLoading: deletingPo }] = useDeletePurchaseOrderMutation();
  const [createGrn, { isLoading: creatingGrn }] = useCreateInboundReceiptMutation();
  const [completePutawayTask, { isLoading: completingPutaway }] = useCompletePutawayTaskMutation();

  const detail = detailRes?.data;
  const po = detail?.purchaseOrder;
  const items = detail?.items ?? [];
  const tasks = detail?.putawayTasks ?? [];
  const progress = detail?.progress;
  const receipts: InboundReceipt[] = receiptsRes?.data ?? [];

  const computedTotal = items.reduce((sum, row) => {
    return sum + Number(row.orderedQty ?? 0) * Number(row.unitPrice ?? 0);
  }, 0);
  const displayTotal =
    po?.totalAmount != null && po.totalAmount > 0
      ? po.totalAmount
      : computedTotal > 0 ? computedTotal : null;

  const poStatus = po?.status ?? "";
  const isDraft = poStatus === "DRAFT";
  const canApprove = isDraft && items.length > 0;
  const canReceive = poStatus === "APPROVED" || poStatus === "PARTIAL";
  const canCancel = poStatus === "DRAFT" || poStatus === "APPROVED" || poStatus === "PARTIAL";

  /* ── Warehouses & Suppliers ── */
  const { data: warehousesRes } = useGetWarehousesForPoQuery({ size: 200 });
  const warehouses = warehousesRes?.data?.content ?? [];
  const warehouseName =
    po?.warehouseName || warehouses.find((w) => w.id === po?.warehouseId)?.name || po?.warehouseId || "—";

  const { data: suppliersRes } = useGetSuppliersQuery({ page: 0, size: 200 });
  const suppliers = suppliersRes?.data?.content ?? [];
  const supplierName =
    po?.supplierName || suppliers.find((s) => s.id === po?.supplierId)?.name || po?.supplierId || "—";

  /* ── Locations ── */
  const selectedWhId = po?.warehouseId ?? "";
  const { data: whLocRes } = useGetLocationsListQuery(
    { warehouseId: selectedWhId, size: 100 },
    { skip: !selectedWhId }
  );
  const locationOptions = Array.isArray(whLocRes?.data) ? whLocRes.data : [];

  /* ── Open GRN dialog ── */
  function openGrn() {
    const lines = items
      .filter((item) => Number(item.orderedQty ?? 0) - Number(item.receivedQty ?? 0) > 0)
      .map((item) => ({ poItemId: item.id, receivedQty: "", note: "" }));
    setGrnLines(lines);
    setGrnLocationId("");
    setGrnNote("");
    setGrnOpen(true);
  }

  function updateGrnLine(poItemId: string, field: "receivedQty" | "note", value: string) {
    setGrnLines((prev) => prev.map((l) => l.poItemId === poItemId ? { ...l, [field]: value } : l));
  }

  /* ── Actions ── */
  async function handleApprove() {
    if (!id) return;
    try {
      const res = await approvePo(id).unwrap();
      if (!res.success) { toast.error(res.message || "Duyệt PO thất bại"); return; }
      toast.success(res.message || "Đã duyệt PO"); refetch();
    } catch (err) { toast.error(apiErrMessage(err)); }
  }

  async function handleCancel() {
    if (!id) return;
    try {
      const res = await cancelPo(id).unwrap();
      if (!res.success) { toast.error(res.message || "Hủy PO thất bại"); return; }
      toast.success(res.message || "Đã hủy PO"); refetch();
    } catch (err) { toast.error(apiErrMessage(err)); }
  }

  async function handleDelete() {
    if (!id) return;
    try {
      const res = await deletePo(id).unwrap();
      if (!res.success) { toast.error((res as { message?: string }).message || "Xóa thất bại"); return; }
      toast.success("Đã xóa PO");
      window.location.href = "/purchase-orders";
    } catch (err) { toast.error(apiErrMessage(err)); }
  }

  async function handleSubmitGrn(e: React.FormEvent) {
    e.preventDefault();
    const validLines = grnLines
      .map((l) => {
        const qty = Number(l.receivedQty.replace(",", "."));
        if (!qty || Number.isNaN(qty) || qty <= 0) return null;
        return { poItemId: l.poItemId, receivedQty: qty, ...(l.note.trim() ? { note: l.note.trim() } : {}) };
      })
      .filter(Boolean) as { poItemId: string; receivedQty: number; note?: string }[];

    if (validLines.length === 0) { toast.error("Nhập số lượng ít nhất 1 dòng hàng"); return; }

    for (const line of validLines) {
      const item = items.find((i) => i.id === line.poItemId);
      if (!item) continue;
      const remain = Number(item.orderedQty ?? 0) - Number(item.receivedQty ?? 0);
      if (line.receivedQty > remain) {
        toast.error(`${item.productSku}: nhập (${line.receivedQty}) > còn lại (${remain})`);
        return;
      }
    }

    if (!grnLocationId.trim()) { toast.error("Vui lòng chọn vị trí nhận hàng"); return; }

    try {
      const res = await createGrn({
        purchaseOrderId: id,
        locationId: grnLocationId.trim(),
        ...(grnNote.trim() ? { note: grnNote.trim() } : {}),
        items: validLines,
      }).unwrap();
      if (!res.success) { toast.error(res.message || "Tạo phiếu nhập kho thất bại"); return; }
      toast.success(`Đã tạo phiếu nhập kho: ${res.data?.receiptNumber ?? "OK"}`);
      setGrnOpen(false); refetch();
    } catch (err) { toast.error(apiErrMessage(err)); }
  }

  /* ── Putaway ── */
  function openPutaway(task: PutawayTask) {
    setActiveTask(task);
    setActualLocationId(task.actualLocationId ?? task.suggestedLocationId ?? "");
    setPutawayErrors({});
    setPutawayOpen(true);
  }

  async function submitCompletePutaway(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTask) return;
    setPutawayErrors({});
    const parsed = completeSchema.safeParse({ actualLocationId: actualLocationId.trim() });
    if (!parsed.success) {
      const err: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = String(issue.path[0] ?? "form");
        if (!err[k]) err[k] = issue.message;
      }
      setPutawayErrors(err);
      return;
    }
    try {
      const res = await completePutawayTask({
        id: activeTask.id,
        purchaseOrderId: id,
        body: { actualLocationId: parsed.data.actualLocationId },
      }).unwrap();
      if (!res.success) { toast.error((res as { message?: string }).message || "Hoàn tất putaway thất bại"); return; }
      toast.success((res as { message?: string }).message || "Đã hoàn tất putaway");
      setPutawayOpen(false); setActiveTask(null); refetch();
    } catch (err) { toast.error(apiErrMessage(err)); }
  }

  if (!id) return <p className="text-sm text-rose-600">Thiếu mã đơn.</p>;

  const poStatusCfg = PO_STATUS[poStatus];
  const progressPct = progress && progress.totalOrderedQty > 0
    ? Math.min(100, (progress.totalReceivedQty / progress.totalOrderedQty) * 100)
    : 0;

  return (
    <div className="space-y-5 pb-16">
      {/* ── Header ── */}
      <PageHeader
        title="Chi tiết đơn mua hàng"
        description={po ? `Mã PO: ${po.poNumber}` : "Đang tải…"}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              render={<Link href="/purchase-orders" />}
              nativeButton={false}
              variant="outline"
              size="sm"
              className="rounded-xl gap-1.5 text-xs border-slate-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Danh sách
            </Button>

            {canReceive && (
              <Button
                onClick={openGrn}
                size="sm"
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-sm gap-1.5"
              >
                <PackagePlus className="h-4 w-4" />
                Nhập hàng
              </Button>
            )}

            {isDraft && canApprove && (
              <Button
                onClick={handleApprove}
                disabled={approvingPo}
                size="sm"
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-sm gap-1.5"
              >
                {approvingPo ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
                Duyệt PO
              </Button>
            )}

            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={cancellingPo}
                className="rounded-xl gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-400 dark:hover:bg-amber-950/20"
              >
                {cancellingPo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                Hủy PO
              </Button>
            )}

            <PermissionControl allowedRoles={ADMIN_MANAGER_ROLES}>
              {isDraft && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deletingPo}
                  className="rounded-xl gap-1.5 border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/20"
                >
                  {deletingPo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Xóa PO
                </Button>
              )}
            </PermissionControl>
          </div>
        }
      />

      {/* ── Loading / Error ── */}
      {detailLoading ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <Skeleton className="h-3 w-16 mb-2 rounded" />
                <Skeleton className="h-6 w-20 rounded" />
              </div>
            ))}
          </div>
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      ) : detailError || !po || !detail ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white py-16 text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <AlertCircle className="h-8 w-8 text-rose-400" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Không tải được đơn nhập hàng</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl">Thử lại</Button>
        </div>
      ) : (
        <>
          {/* ── Summary Strip ── */}
          <div className="grid gap-3 md:grid-cols-4">
            {/* Status card */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/80 p-5 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/80">
              <div className="absolute right-3 top-3 opacity-[0.07]">
                <ShoppingCart className="h-14 w-14 text-slate-600 dark:text-slate-300" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Trạng thái đơn</p>
              {poStatusCfg ? (
                <>
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm", poStatusCfg.cls)}>
                    <span className={cn("h-2 w-2 rounded-full animate-pulse", poStatusCfg.dotCls)} />
                    {poStatusCfg.label}
                  </span>
                  <p className="mt-2.5 text-xs text-slate-400 font-mono truncate">{po.poNumber}</p>
                </>
              ) : <span className="text-sm text-slate-500">{poStatus}</span>}
            </div>

            {/* Order Date */}
            <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/60 p-5 shadow-sm dark:border-indigo-900/40 dark:from-indigo-950/30 dark:to-slate-900">
              <div className="absolute right-3 top-3 opacity-10">
                <CalendarDays className="h-14 w-14 text-indigo-600" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 dark:text-indigo-500 mb-1">Ngày đặt hàng</p>
              <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-200 tabular-nums leading-tight">
                {po.orderDate?.split("-").slice(1).join("/") ?? "—"}
              </p>
              <p className="text-xs text-indigo-400 font-semibold">{po.orderDate?.split("-")[0]}</p>
              {po.expectedDate && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-lg bg-indigo-100/70 px-2 py-1 text-xs text-indigo-600 font-semibold dark:bg-indigo-900/30 dark:text-indigo-400">
                  <Clock className="h-3 w-3" />
                  Dự kiến: {po.expectedDate}
                </div>
              )}
            </div>

            {/* Progress */}
            <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50/40 p-5 shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/30 dark:to-slate-900">
              <div className="absolute right-3 top-3 opacity-10">
                <Activity className="h-14 w-14 text-emerald-600" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 dark:text-emerald-600 mb-1">Tiến độ nhập</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black tabular-nums text-emerald-700 dark:text-emerald-300">
                  {progress?.totalReceivedQty ?? 0}
                </span>
                <span className="text-emerald-400 text-sm font-medium">/ {progress?.totalOrderedQty ?? 0}</span>
              </div>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    progressPct >= 100 ? "bg-emerald-500" : progressPct > 0 ? "bg-emerald-400" : "bg-emerald-200"
                  )}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-emerald-500 font-semibold mt-1">{Math.round(progressPct)}% hoàn thành</p>
            </div>

            {/* Total */}
            <div className="relative overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-purple-50/40 p-5 shadow-sm dark:border-violet-900/40 dark:from-violet-950/30 dark:to-slate-900">
              <div className="absolute right-3 top-3 opacity-10">
                <DollarSign className="h-14 w-14 text-violet-600" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500 dark:text-violet-600 mb-1">Tổng tiền đơn</p>
              {displayTotal != null ? (
                <>
                  <p className="text-2xl font-black tabular-nums text-violet-900 dark:text-violet-200 leading-tight">
                    {displayTotal.toLocaleString("vi-VN")}
                  </p>
                  <p className="text-sm text-violet-400 font-bold">VNĐ</p>
                </>
              ) : (
                <p className="text-2xl font-black text-violet-300 dark:text-violet-700">—</p>
              )}
            </div>
          </div>

          {/* ── Tabs ── */}
          <Tabs defaultValue="info" className="space-y-0">
            <TabsList className="flex h-auto w-full rounded-t-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-0">
              <TabsTrigger
                value="info"
                className="relative flex-1 rounded-none first:rounded-tl-2xl px-5 py-3.5 text-xs font-semibold text-slate-500 transition-all data-[state=active]:text-indigo-700 data-[state=active]:bg-indigo-50/50 data-[state=active]:shadow-none dark:text-slate-400 dark:data-[state=active]:text-indigo-400 dark:data-[state=active]:bg-indigo-950/20 border-b-2 border-transparent data-[state=active]:border-indigo-600"
              >
                <FileText className="h-3.5 w-3.5 mr-1.5 inline-block" />
                Thông tin PO
              </TabsTrigger>
              <TabsTrigger
                value="items"
                className="relative flex-1 rounded-none px-5 py-3.5 text-xs font-semibold text-slate-500 transition-all data-[state=active]:text-indigo-700 data-[state=active]:bg-indigo-50/50 data-[state=active]:shadow-none dark:text-slate-400 dark:data-[state=active]:text-indigo-400 dark:data-[state=active]:bg-indigo-950/20 border-b-2 border-transparent data-[state=active]:border-indigo-600"
              >
                <ShoppingCart className="h-3.5 w-3.5 mr-1.5 inline-block" />
                Dòng hàng
                <span className="ml-1.5 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] text-indigo-700 font-bold dark:bg-indigo-900/40 dark:text-indigo-400">{items.length}</span>
              </TabsTrigger>
              <TabsTrigger
                value="receipts"
                className="relative flex-1 rounded-none px-5 py-3.5 text-xs font-semibold text-slate-500 transition-all data-[state=active]:text-indigo-700 data-[state=active]:bg-indigo-50/50 data-[state=active]:shadow-none dark:text-slate-400 dark:data-[state=active]:text-indigo-400 dark:data-[state=active]:bg-indigo-950/20 border-b-2 border-transparent data-[state=active]:border-indigo-600"
              >
                <ReceiptText className="h-3.5 w-3.5 mr-1.5 inline-block" />
                Phiếu nhập
                <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 font-bold dark:bg-slate-700 dark:text-slate-400">{receipts.length}</span>
              </TabsTrigger>
              <TabsTrigger
                value="putaway"
                className="relative flex-1 rounded-none last:rounded-tr-2xl px-5 py-3.5 text-xs font-semibold text-slate-500 transition-all data-[state=active]:text-indigo-700 data-[state=active]:bg-indigo-50/50 data-[state=active]:shadow-none dark:text-slate-400 dark:data-[state=active]:text-indigo-400 dark:data-[state=active]:bg-indigo-950/20 border-b-2 border-transparent data-[state=active]:border-indigo-600"
              >
                <TrendingUp className="h-3.5 w-3.5 mr-1.5 inline-block" />
                Sắp xếp kho
                <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 font-bold dark:bg-slate-700 dark:text-slate-400">{tasks.length}</span>
              </TabsTrigger>
            </TabsList>

            {/* ── Tab 1: PO Info ── */}
            <TabsContent value="info" className="mt-0">
              <div className="rounded-b-2xl border border-t-0 border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-50 dark:divide-slate-800/60">
                  <div className="px-6 py-3">
                    <InfoRow
                      icon={<FileText className="h-3.5 w-3.5" />}
                      label="Mã đơn nhập hàng"
                      value={<span className="font-mono font-bold text-indigo-700 dark:text-indigo-400">{po.poNumber}</span>}
                    />
                    <InfoRow
                      icon={<Building2 className="h-3.5 w-3.5" />}
                      label="Nhà cung cấp"
                      value={supplierName}
                    />
                    <InfoRow
                      icon={<Warehouse className="h-3.5 w-3.5" />}
                      label="Kho nhận hàng"
                      value={warehouseName}
                    />
                  </div>
                  <div className="px-6 py-3">
                    <InfoRow
                      icon={<CalendarDays className="h-3.5 w-3.5" />}
                      label="Ngày dự kiến nhận"
                      value={po.expectedDate
                        ? <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2 py-0.5 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-semibold text-xs">{po.expectedDate}</span>
                        : <span className="text-slate-400">Chưa xác định</span>}
                    />
                    <InfoRow
                      icon={<Clock className="h-3.5 w-3.5" />}
                      label="Ngày tạo đơn"
                      value={po.createdAt ? new Date(po.createdAt).toLocaleString("vi-VN") : "—"}
                    />
                    <InfoRow
                      icon={<Activity className="h-3.5 w-3.5" />}
                      label="Cập nhật lần cuối"
                      value={po.updatedAt ? new Date(po.updatedAt).toLocaleString("vi-VN") : "—"}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab 2: PO Items ── */}
            <TabsContent value="items" className="mt-0">
              <div className="overflow-hidden rounded-b-2xl border border-t-0 border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                      <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                        <TableHead className="py-3.5 pl-5 pr-3 w-12 text-[11px] font-bold uppercase tracking-wider text-slate-400">#</TableHead>
                        <TableHead className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">SKU / Tên SP</TableHead>
                        <TableHead className="px-3 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">SL đặt</TableHead>
                        <TableHead className="px-3 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Đã nhận</TableHead>
                        <TableHead className="px-3 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Còn lại</TableHead>
                        <TableHead className="px-3 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Đơn giá</TableHead>
                        <TableHead className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Tiến độ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-12 text-center text-sm text-slate-400">
                            Chưa có dòng hàng nào.
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((row, idx) => {
                          const ordered = Number(row.orderedQty ?? 0);
                          const received = Number(row.receivedQty ?? 0);
                          const remain = Math.max(0, ordered - received);
                          const pct = ordered > 0 ? Math.min(100, (received / ordered) * 100) : 0;
                          return (
                            <TableRow
                              key={row.id}
                              className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 dark:border-slate-800/60 dark:hover:bg-slate-800/30"
                            >
                              <TableCell className="py-3.5 pl-5 pr-3 text-xs font-bold text-slate-400">{idx + 1}</TableCell>
                              <TableCell className="px-3 py-3.5">
                                <span className="font-mono text-xs font-semibold text-indigo-700 dark:text-indigo-400 block">{row.productSku}</span>
                                {row.productName && <span className="text-xs text-slate-500 dark:text-slate-400">{row.productName}</span>}
                              </TableCell>
                              <TableCell className="px-3 py-3.5 text-right tabular-nums text-sm text-slate-600 dark:text-slate-400">{ordered}</TableCell>
                              <TableCell className="px-3 py-3.5 text-right tabular-nums text-sm text-slate-600 dark:text-slate-400">{received}</TableCell>
                              <TableCell className="px-3 py-3.5 text-right">
                                <span className={cn("text-sm font-bold tabular-nums", remain === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-200")}>
                                  {remain}
                                </span>
                              </TableCell>
                              <TableCell className="px-3 py-3.5 text-right text-sm tabular-nums text-slate-600 dark:text-slate-400">
                                {row.unitPrice != null ? `₫${row.unitPrice.toLocaleString("vi-VN")}` : "—"}
                              </TableCell>
                              <TableCell className="px-3 py-3.5">
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                    <div
                                      className={cn("h-full rounded-full transition-all", pct >= 100 ? "bg-emerald-500" : pct > 0 ? "bg-indigo-500" : "bg-slate-300")}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-slate-400 tabular-nums">{Math.round(pct)}%</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab 3: Inbound Receipts ── */}
            <TabsContent value="receipts" className="mt-0">
              <div className="overflow-hidden rounded-b-2xl border border-t-0 border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                {receipts.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-14 text-center">
                    <FileText className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500">Chưa có phiếu nhập kho nào cho PO này.</p>
                    {canReceive && (
                      <Button size="sm" onClick={openGrn} className="rounded-xl gap-1.5 bg-indigo-600 hover:bg-indigo-700">
                        <PackagePlus className="h-4 w-4" />
                        Tạo phiếu nhập
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                        <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                          <TableHead className="py-3.5 pl-5 pr-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Mã phiếu GRN</TableHead>
                          <TableHead className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Ngày nhập</TableHead>
                          <TableHead className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</TableHead>
                          <TableHead className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Ghi chú</TableHead>
                          <TableHead className="px-3 py-3.5 pr-5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Ngày tạo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {receipts.map((r) => (
                          <TableRow key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 dark:border-slate-800/60 dark:hover:bg-slate-800/30">
                            <TableCell className="py-3.5 pl-5 pr-3">
                              <span className="font-mono text-xs font-semibold text-indigo-700 dark:text-indigo-400">{r.receiptNumber}</span>
                            </TableCell>
                            <TableCell className="px-3 py-3.5 text-sm text-slate-600 dark:text-slate-400">{r.receivedDate ?? "—"}</TableCell>
                            <TableCell className="px-3 py-3.5">
                              <StatusPill map={GRN_STATUS} value={r.status} />
                            </TableCell>
                            <TableCell className="max-w-48 truncate px-3 py-3.5 text-sm text-slate-600 dark:text-slate-400">{r.note ?? "—"}</TableCell>
                            <TableCell className="px-3 py-3.5 pr-5 text-right text-xs text-slate-500">
                              {r.createdAt ? new Date(r.createdAt).toLocaleString("vi-VN") : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── Tab 4: Putaway Tasks ── */}
            <TabsContent value="putaway" className="mt-0">
              <div className="overflow-hidden rounded-b-2xl border border-t-0 border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                {tasks.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-14 text-center">
                    <MapPin className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500">Chưa có tác vụ sắp xếp kho nào.</p>
                    <p className="text-xs text-slate-400">Tạo phiếu nhập hàng để hệ thống tự động sinh putaway task.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                        <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                          <TableHead className="py-3.5 pl-5 pr-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Task ID</TableHead>
                          <TableHead className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</TableHead>
                          <TableHead className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Vị trí gợi ý</TableHead>
                          <TableHead className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Vị trí thực tế</TableHead>
                          <TableHead className="py-3.5 pl-3 pr-5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tasks.map((task) => {
                          const canComplete = task.status === "PENDING" || task.status === "IN_PROGRESS";
                          const getSuggested = locationOptions.find((l) => l.id === task.suggestedLocationId);
                          const getActual = locationOptions.find((l) => l.id === task.actualLocationId);
                          return (
                            <TableRow
                              key={task.id}
                              className={cn(
                                "border-b border-slate-50 last:border-0 dark:border-slate-800/60",
                                task.status === "COMPLETED" ? "opacity-60" : "hover:bg-slate-50/60 dark:hover:bg-slate-800/30",
                              )}
                            >
                              <TableCell className="py-3.5 pl-5 pr-3">
                                <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                                  PUT-{task.id.slice(0, 8).toUpperCase()}
                                </span>
                              </TableCell>
                              <TableCell className="px-3 py-3.5">
                                <StatusPill map={PUTAWAY_STATUS} value={task.status} />
                              </TableCell>
                              <TableCell className="px-3 py-3.5">
                                {task.suggestedLocationId ? (
                                  <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                                    <MapPin className="h-3 w-3 text-slate-400" />
                                    {getSuggested?.code ?? task.suggestedLocationId.slice(0, 8)}
                                  </span>
                                ) : <span className="text-slate-400 text-xs">—</span>}
                              </TableCell>
                              <TableCell className="px-3 py-3.5">
                                {task.actualLocationId ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {getActual?.code ?? task.actualLocationId.slice(0, 8)}
                                  </span>
                                ) : <span className="text-slate-400 text-xs">—</span>}
                              </TableCell>
                              <TableCell className="py-3.5 pl-3 pr-5 text-right">
                                <Button
                                  type="button"
                                  size="sm"
                                  className={cn(
                                    "h-8 rounded-lg gap-1 px-2.5 text-xs",
                                    canComplete ? "bg-indigo-600 hover:bg-indigo-700" : "opacity-40 cursor-not-allowed bg-slate-300 dark:bg-slate-700",
                                  )}
                                  onClick={() => canComplete && openPutaway(task)}
                                  disabled={!canComplete}
                                >
                                  <PackageCheck className="h-3.5 w-3.5" />
                                  Hoàn tất
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* ── GRN Dialog ── */}
      <Dialog open={grnOpen} onOpenChange={setGrnOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl rounded-2xl">
          <form onSubmit={handleSubmitGrn}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PackagePlus className="h-5 w-5 text-indigo-600" />
                Tạo phiếu nhập kho (GRN)
              </DialogTitle>
              <DialogDescription>
                Nhập số lượng thực nhận cho từng dòng hàng. Dòng nào bỏ trống hoặc = 0 sẽ bị bỏ qua.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* Lines table */}
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <Table>
                  <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                    <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                      <TableHead className="py-3 pl-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">SKU</TableHead>
                      <TableHead className="px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Đặt</TableHead>
                      <TableHead className="px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Đã nhận</TableHead>
                      <TableHead className="px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Còn lại</TableHead>
                      <TableHead className="px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400 text-indigo-600 dark:text-indigo-400">Nhập lần này ★</TableHead>
                      <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Ghi chú</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grnLines.map((line) => {
                      const item = items.find((i) => i.id === line.poItemId);
                      if (!item) return null;
                      const ordered = Number(item.orderedQty ?? 0);
                      const received = Number(item.receivedQty ?? 0);
                      const remain = Math.max(0, ordered - received);
                      const entered = Number(line.receivedQty.replace(",", "."));
                      const isOver = entered > 0 && !Number.isNaN(entered) && entered > remain;
                      return (
                        <TableRow key={line.poItemId} className={cn("border-b border-slate-50 last:border-0 dark:border-slate-800/60", isOver && "bg-rose-50/30 dark:bg-rose-950/10")}>
                          <TableCell className="py-3 pl-4">
                            <span className="font-mono text-xs font-semibold text-indigo-700 dark:text-indigo-400">{item.productSku}</span>
                          </TableCell>
                          <TableCell className="px-3 py-3 text-right text-sm tabular-nums text-slate-600 dark:text-slate-400">{ordered}</TableCell>
                          <TableCell className="px-3 py-3 text-right text-sm tabular-nums text-slate-600 dark:text-slate-400">{received}</TableCell>
                          <TableCell className="px-3 py-3 text-right text-sm font-bold tabular-nums text-slate-800 dark:text-slate-200">{remain}</TableCell>
                          <TableCell className="px-3 py-3 text-right">
                            <Input
                              value={line.receivedQty}
                              onChange={(e) => updateGrnLine(line.poItemId, "receivedQty", e.target.value)}
                              inputMode="decimal"
                              placeholder={`≤ ${remain}`}
                              className={cn("w-24 text-right h-8 rounded-lg text-sm font-semibold", isOver && "border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-600 dark:bg-rose-950/20")}
                            />
                          </TableCell>
                          <TableCell className="px-3 py-3">
                            <Input
                              value={line.note}
                              onChange={(e) => updateGrnLine(line.poItemId, "note", e.target.value)}
                              placeholder="Ghi chú…"
                              className="w-32 h-8 rounded-lg text-xs"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Location + Note */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Vị trí nhận hàng <span className="text-rose-500">*</span>
                  </label>
                  {locationOptions.length === 0 ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                      Kho này chưa có vị trí nào. Vui lòng tạo vị trí trước.
                    </p>
                  ) : (
                    <Select
                      value={grnLocationId || "__empty__"}
                      onValueChange={(v) => setGrnLocationId(!v || v === "__empty__" ? "" : v)}
                    >
                      <SelectTrigger className="rounded-xl h-10">
                        <span className="truncate text-sm">
                          {grnLocationId
                            ? (locationOptions.find((l) => l.id === grnLocationId)?.code ??
                              locationOptions.find((l) => l.id === grnLocationId)?.name ??
                              grnLocationId)
                            : "Chọn vị trí nhận hàng…"}
                        </span>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {locationOptions.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id} className="rounded-lg">
                            {loc.code ?? loc.name ?? loc.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Ghi chú phiếu nhập <span className="text-slate-400 font-normal text-xs">(tuỳ chọn)</span>
                  </label>
                  <Textarea
                    value={grnNote}
                    onChange={(e) => setGrnNote(e.target.value)}
                    placeholder="Ghi chú chung về lô hàng…"
                    rows={2}
                    className="rounded-xl text-sm resize-none"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setGrnOpen(false)} className="rounded-xl">Hủy</Button>
              <Button type="submit" size="sm" disabled={creatingGrn} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 gap-1.5">
                {creatingGrn ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
                Tạo phiếu nhập
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Putaway Dialog ── */}
      <Dialog open={putawayOpen} onOpenChange={setPutawayOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <form onSubmit={submitCompletePutaway}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-indigo-600" />
                Hoàn tất Putaway
              </DialogTitle>
              {activeTask && (
                <DialogDescription>
                  Task <span className="font-mono font-semibold">PUT-{activeTask.id.slice(0, 8).toUpperCase()}</span> — xác nhận vị trí đặt hàng thực tế
                </DialogDescription>
              )}
            </DialogHeader>

            <div className="py-4">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Vị trí thực tế <span className="text-rose-500">*</span>
              </label>
              <Select
                value={actualLocationId || "__empty__"}
                onValueChange={(v) => setActualLocationId(!v || v === "__empty__" ? "" : v)}
              >
                <SelectTrigger className={cn("rounded-xl h-10", putawayErrors.actualLocationId && "border-rose-400")}>
                  <span className="truncate text-sm">
                    {actualLocationId
                      ? (locationOptions.find((l) => l.id === actualLocationId)?.code ??
                        locationOptions.find((l) => l.id === actualLocationId)?.name ??
                        actualLocationId)
                      : "Chọn vị trí thực tế…"}
                  </span>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="__empty__" className="rounded-lg text-slate-400">Chọn vị trí…</SelectItem>
                  {locationOptions.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id} className="rounded-lg">
                      {loc.code ?? loc.name ?? loc.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {putawayErrors.actualLocationId && (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{putawayErrors.actualLocationId}</p>
              )}
              <p className="mt-2 text-xs text-slate-400">Chọn vị trí kệ mà sản phẩm đã được đặt vào thực tế.</p>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setPutawayOpen(false)} className="rounded-xl">Hủy</Button>
              <Button type="submit" size="sm" disabled={completingPutaway} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 gap-1.5">
                {completingPutaway ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Xác nhận hoàn tất
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
