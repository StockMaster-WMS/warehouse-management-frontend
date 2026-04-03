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
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
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
  SelectValue,
} from "@/components/ui/select";
import { apiErrMessage } from "@/types/api";
import {
  useApprovePurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
  useCompletePutawayTaskMutation,
  useDeletePurchaseOrderMutation,
  useGetLocationsQuery,
  useGetPurchaseOrderDetailQuery,
  useGetWarehousesForPoQuery,
} from "@/store/services/purchase-order.service";
import { useGetSuppliersQuery } from "@/store/services/supplier.service";
import {
  useCreateInboundReceiptMutation,
  useGetInboundReceiptsByPoQuery,
} from "@/store/services/inbound.service";
import type { PutawayTask } from "@/types/purchase-order";
import type { InboundReceipt } from "@/types/inbound-receipt";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Nháp",
  APPROVED: "Đã duyệt",
  PARTIAL: "Nhận một phần",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

const GRN_STATUS_LABEL: Record<string, string> = {
  RECEIVED: "Đã nhận",
  PENDING: "Chờ xử lý",
  CANCELLED: "Đã hủy",
};

const PUTAWAY_STATUS_LABEL: Record<string, string> = {
  PENDING: "Chờ xếp kệ",
  IN_PROGRESS: "Đang xếp",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

function putawayStatusClass(status: string): string {
  switch (status) {
    case "PENDING":
      return "bg-amber-100 text-amber-700";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-700";
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700";
    case "CANCELLED":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function grnStatusClass(status: string): string {
  switch (status) {
    case "RECEIVED":
      return "bg-emerald-100 text-emerald-700";
    case "PENDING":
      return "bg-amber-100 text-amber-700";
    case "CANCELLED":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function statusClass(status: string | null | undefined): string {
  switch (status) {
    case "DRAFT":
      return "bg-slate-100 text-slate-700";
    case "APPROVED":
      return "bg-blue-100 text-blue-700";
    case "PARTIAL":
      return "bg-amber-100 text-amber-700";
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700";
    case "CANCELLED":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

const completeSchema = z.object({
  actualLocationId: z.string().min(1, "Chọn vị trí thực tế"),
});

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

  const { data: receiptsRes } = useGetInboundReceiptsByPoQuery(id, {
    skip: !id,
  });

  /* ── GRN dialog state ── */
  const [grnOpen, setGrnOpen] = useState(false);
  const [grnLocationId, setGrnLocationId] = useState("");
  const [grnNote, setGrnNote] = useState("");
  const [grnLines, setGrnLines] = useState<
    { poItemId: string; receivedQty: string; note: string }[]
  >([]);

  /* ── Putaway dialog state ── */
  const [putawayOpen, setPutawayOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<PutawayTask | null>(null);
  const [actualLocationId, setActualLocationId] = useState("");
  const [putawayErrors, setPutawayErrors] = useState<Record<string, string>>(
    {},
  );

  /* ── Mutations ── */
  const [approvePo, { isLoading: approvingPo }] =
    useApprovePurchaseOrderMutation();
  const [cancelPo, { isLoading: cancellingPo }] =
    useCancelPurchaseOrderMutation();
  const [deletePo, { isLoading: deletingPo }] =
    useDeletePurchaseOrderMutation();
  const [createGrn, { isLoading: creatingGrn }] =
    useCreateInboundReceiptMutation();
  const [completePutawayTask, { isLoading: completingPutaway }] =
    useCompletePutawayTaskMutation();

  const detail = detailRes?.data;
  const po = detail?.purchaseOrder;
  const items = detail?.items ?? [];
  const tasks = detail?.putawayTasks ?? [];
  const progress = detail?.progress;
  const receipts: InboundReceipt[] = receiptsRes?.data ?? [];

  const computedTotal = items.reduce((sum, row) => {
    const qty = Number(row.orderedQty ?? 0);
    const price = Number(row.unitPrice ?? 0);
    return sum + qty * price;
  }, 0);
  const displayTotal =
    po?.totalAmount != null && po.totalAmount > 0
      ? po.totalAmount
      : computedTotal > 0
        ? computedTotal
        : null;

  const poStatus = po?.status ?? "";
  const isDraft = poStatus === "DRAFT";
  const canApprove = isDraft && items.length > 0;
  const canReceive = poStatus === "APPROVED" || poStatus === "PARTIAL";
  const canCancel =
    poStatus === "DRAFT" || poStatus === "APPROVED" || poStatus === "PARTIAL";

  /* ── Warehouses & Suppliers ── */
  const { data: warehousesRes } = useGetWarehousesForPoQuery({ size: 200 });
  const warehouses = warehousesRes?.data?.content ?? [];
  const warehouseName =
    po?.warehouseName ||
    warehouses.find((w) => w.id === po?.warehouseId)?.name ||
    po?.warehouseId ||
    "—";

  const { data: suppliersRes } = useGetSuppliersQuery({ page: 0, size: 200 });
  const suppliers = suppliersRes?.data?.content ?? [];
  const supplierName =
    po?.supplierName ||
    suppliers.find((s) => s.id === po?.supplierId)?.name ||
    po?.supplierId ||
    "—";

  /* ── Locations ── */
  const { data: whLocRes } = useGetLocationsQuery(
    { warehouseId: po?.warehouseId ?? "" },
    { skip: !po?.warehouseId },
  );
  const locationOptions = Array.isArray(whLocRes?.data) ? whLocRes.data : [];

  /* ── Open GRN dialog ── */
  function openGrn() {
    const lines = items
      .filter((item) => {
        const remain =
          Number(item.orderedQty ?? 0) - Number(item.receivedQty ?? 0);
        return remain > 0;
      })
      .map((item) => ({
        poItemId: item.id,
        receivedQty: "",
        note: "",
      }));
    setGrnLines(lines);
    setGrnLocationId("");
    setGrnNote("");
    setGrnOpen(true);
  }

  function updateGrnLine(
    poItemId: string,
    field: "receivedQty" | "note",
    value: string,
  ) {
    setGrnLines((prev) =>
      prev.map((l) => (l.poItemId === poItemId ? { ...l, [field]: value } : l)),
    );
  }

  /* ── Actions ── */
  async function handleApprove() {
    if (!id) return;
    try {
      const res = await approvePo(id).unwrap();
      if (!res.success) {
        toast.error(res.message || "Duyệt PO thất bại");
        return;
      }
      toast.success(res.message || "Đã duyệt PO → APPROVED");
      refetch();
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  async function handleCancel() {
    if (!id) return;
    try {
      const res = await cancelPo(id).unwrap();
      if (!res.success) {
        toast.error(res.message || "Hủy PO thất bại");
        return;
      }
      toast.success(res.message || "Đã hủy PO");
      refetch();
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  async function handleDelete() {
    if (!id) return;
    try {
      const res = await deletePo(id).unwrap();
      if (!res.success) {
        toast.error((res as { message?: string }).message || "Xóa thất bại");
        return;
      }
      toast.success("Đã xóa PO");
      window.location.href = "/purchase-orders";
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  async function handleSubmitGrn(e: React.FormEvent) {
    e.preventDefault();
    const validLines = grnLines
      .map((l) => {
        const qty = Number(l.receivedQty.replace(",", "."));
        if (!qty || Number.isNaN(qty) || qty <= 0) return null;
        return {
          poItemId: l.poItemId,
          receivedQty: qty,
          ...(l.note.trim() ? { note: l.note.trim() } : {}),
        };
      })
      .filter(Boolean) as {
      poItemId: string;
      receivedQty: number;
      note?: string;
    }[];

    if (validLines.length === 0) {
      toast.error("Nhập số lượng ít nhất 1 dòng hàng");
      return;
    }

    for (const line of validLines) {
      const item = items.find((i) => i.id === line.poItemId);
      if (!item) continue;
      const remain =
        Number(item.orderedQty ?? 0) - Number(item.receivedQty ?? 0);
      if (line.receivedQty > remain) {
        toast.error(
          `Dòng ${item.productSku}: số lượng nhập (${line.receivedQty}) vượt quá còn lại (${remain})`,
        );
        return;
      }
    }

    if (!grnLocationId.trim()) {
      toast.error("Vui lòng chọn vị trí nhận hàng");
      return;
    }

    try {
      const res = await createGrn({
        purchaseOrderId: id,
        locationId: grnLocationId.trim(),
        ...(grnNote.trim() ? { note: grnNote.trim() } : {}),
        items: validLines,
      }).unwrap();

      if (!res.success) {
        toast.error(res.message || "Tạo phiếu nhập kho thất bại");
        return;
      }
      toast.success(
        `Đã tạo phiếu nhập kho: ${res.data?.receiptNumber ?? "OK"}`,
      );
      setGrnOpen(false);
      refetch();
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  /* ── Putaway ── */
  function openPutaway(task: PutawayTask) {
    setActiveTask(task);
    setActualLocationId(
      task.actualLocationId ?? task.suggestedLocationId ?? "",
    );
    setPutawayErrors({});
    setPutawayOpen(true);
  }

  async function submitCompletePutaway(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTask) return;
    setPutawayErrors({});
    const parsed = completeSchema.safeParse({
      actualLocationId: actualLocationId.trim(),
    });
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
        body: { actualLocationId: parsed.data.actualLocationId },
      }).unwrap();
      if (!res.success) {
        toast.error(
          (res as { message?: string }).message || "Hoàn tất putaway thất bại",
        );
        return;
      }
      toast.success(
        (res as { message?: string }).message || "Đã hoàn tất putaway",
      );
      setPutawayOpen(false);
      setActiveTask(null);
      refetch();
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  if (!id) return <p className="text-sm text-rose-600">Thiếu mã đơn.</p>;

  return (
    <div className="space-y-6 pb-16">
      {/* ── Header + Actions ── */}
      <PageHeader
        title="Chi tiết đơn mua hàng"
        description={po ? `Mã PO: ${po.poNumber}` : "Đang tải..."}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              render={<Link href="/purchase-orders" />}
              nativeButton={false}
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            {isDraft && canApprove && (
              <Button
                onClick={handleApprove}
                disabled={approvingPo}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {approvingPo && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Duyệt PO
              </Button>
            )}
            {isDraft && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deletingPo}
              >
                {deletingPo && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa PO
              </Button>
            )}

            {canReceive && (
              <Button
                onClick={openGrn}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <PackagePlus className="mr-2 h-4 w-4" />
                Nhập hàng
              </Button>
            )}

            {canCancel && (
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={cancellingPo}
              >
                {cancellingPo && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Ban className="mr-2 h-4 w-4" />
                Hủy PO
              </Button>
            )}
          </div>
        }
      />

      {detailLoading ? (
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Đang tải chi tiết đơn...
        </div>
      ) : detailError || !po || !detail ? (
        <p className="text-sm text-rose-600">
          Không tải được đơn (GET /api/purchase-orders/{"{id}"}/detail).
        </p>
      ) : (
        <>
          {/* ── Summary cards ── */}
          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-4">
            <div>
              <span className="text-slate-500">Trạng thái</span>
              <div className="mt-1">
                <Badge variant="secondary" className={statusClass(po.status)}>
                  {STATUS_LABEL[po.status ?? ""] ?? po.status ?? "—"}
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-slate-500">Ngày đặt</span>
              <p className="mt-1 font-medium">{po.orderDate}</p>
            </div>
            <div>
              <span className="text-slate-500">Tiến độ nhập</span>
              <p className="mt-1 font-medium">
                {progress?.totalReceivedQty ?? 0} /{" "}
                {progress?.totalOrderedQty ?? 0}
              </p>
              {progress && progress.totalOrderedQty > 0 && (
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{
                      width: `${Math.min(100, (progress.totalReceivedQty / progress.totalOrderedQty) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
            <div>
              <span className="text-slate-500">Tổng tiền</span>
              <p className="mt-1 font-medium">
                {displayTotal != null
                  ? displayTotal.toLocaleString("vi-VN") + " ₫"
                  : "—"}
              </p>
            </div>
          </div>

          {/* ── Tabs ── */}
          <Tabs defaultValue="info" className="space-y-4">
            <TabsList>
              <TabsTrigger value="info">Thông tin PO</TabsTrigger>
              <TabsTrigger value="items">
                Dòng hàng ({items.length})
              </TabsTrigger>
              <TabsTrigger value="receipts">
                Phiếu nhập ({receipts.length})
              </TabsTrigger>
              <TabsTrigger value="putaway">
                Putaway ({tasks.length})
              </TabsTrigger>
            </TabsList>

            {/* ── Tab 1: PO Info ── */}
            <TabsContent value="info">
              <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500">
                    Mã PO
                  </label>
                  <p className="mt-1 font-mono font-medium">{po.poNumber}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">
                    Nhà cung cấp
                  </label>
                  <p className="mt-1 font-medium">{supplierName}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">
                    Kho nhận
                  </label>
                  <p className="mt-1 font-medium">{warehouseName}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">
                    Ngày dự kiến
                  </label>
                  <p className="mt-1">{po.expectedDate ?? "—"}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">
                    Ngày tạo
                  </label>
                  <p className="mt-1 text-xs">
                    {po.createdAt
                      ? new Date(po.createdAt).toLocaleString("vi-VN")
                      : "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">
                    Cập nhật lần cuối
                  </label>
                  <p className="mt-1 text-xs">
                    {po.updatedAt
                      ? new Date(po.updatedAt).toLocaleString("vi-VN")
                      : "—"}
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab 2: PO Items ── */}
            <TabsContent value="items">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Dòng</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">SL đặt</TableHead>
                        <TableHead className="text-right">Đã nhận</TableHead>
                        <TableHead className="text-right">Còn lại</TableHead>
                        <TableHead className="text-right">Đơn giá</TableHead>
                        <TableHead>Tiến độ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="py-10 text-center text-slate-500"
                          >
                            Chưa có dòng hàng.
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((row) => {
                          const ordered = Number(row.orderedQty ?? 0);
                          const received = Number(row.receivedQty ?? 0);
                          const remain = Math.max(0, ordered - received);
                          const pct =
                            ordered > 0
                              ? Math.min(100, (received / ordered) * 100)
                              : 0;
                          return (
                            <TableRow key={row.id}>
                              <TableCell>{row.lineNumber}</TableCell>
                              <TableCell className="font-mono text-sm">
                                {row.productSku}
                              </TableCell>
                              <TableCell className="text-right">
                                {ordered}
                              </TableCell>
                              <TableCell className="text-right">
                                {received}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {remain}
                              </TableCell>
                              <TableCell className="text-right">
                                {row.unitPrice != null
                                  ? row.unitPrice.toLocaleString("vi-VN")
                                  : "—"}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        pct >= 100
                                          ? "bg-emerald-500"
                                          : pct > 0
                                            ? "bg-amber-500"
                                            : "bg-slate-300"
                                      }`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-slate-500">
                                    {Math.round(pct)}%
                                  </span>
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
            <TabsContent value="receipts">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Mã phiếu</TableHead>
                        <TableHead>Ngày nhập</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Ghi chú</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receipts.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="py-10 text-center text-slate-500"
                          >
                            Chưa có phiếu nhập kho nào cho PO này.
                          </TableCell>
                        </TableRow>
                      ) : (
                        receipts.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono font-medium">
                              {r.receiptNumber}
                            </TableCell>
                            <TableCell>{r.receivedDate ?? "—"}</TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`font-normal ${grnStatusClass(r.status ?? "")}`}
                              >
                                {GRN_STATUS_LABEL[r.status ?? ""] ??
                                  r.status ??
                                  "—"}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-50 truncate">
                              {r.note ?? "—"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {r.createdAt
                                ? new Date(r.createdAt).toLocaleString("vi-VN")
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab 4: Putaway Tasks ── */}
            <TabsContent value="putaway">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Task ID</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Vị trí gợi ý</TableHead>
                        <TableHead>Vị trí thực tế</TableHead>
                        <TableHead className="w-40 text-right">
                          Thao tác
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="py-10 text-center text-slate-500"
                          >
                            Chưa có putaway task.
                          </TableCell>
                        </TableRow>
                      ) : (
                        tasks.map((task) => (
                          <TableRow key={task.id}>
                            <TableCell className="max-w-36 truncate font-mono text-xs">
                              PUT-{task.id.slice(0, 8).toUpperCase()}…
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`font-normal ${putawayStatusClass(task.status)}`}
                              >
                                {PUTAWAY_STATUS_LABEL[task.status] ??
                                  task.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {task.suggestedLocationId
                                ? (locationOptions.find(
                                    (l) => l.id === task.suggestedLocationId,
                                  )?.code ??
                                  task.suggestedLocationId.slice(0, 8))
                                : "—"}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {task.actualLocationId
                                ? (locationOptions.find(
                                    (l) => l.id === task.actualLocationId,
                                  )?.code ?? task.actualLocationId.slice(0, 8))
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => openPutaway(task)}
                                disabled={
                                  !(
                                    task.status === "PENDING" ||
                                    task.status === "IN_PROGRESS"
                                  )
                                }
                              >
                                <CheckCircle2 className="mr-1 h-4 w-4" />
                                Hoàn tất
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* ── GRN Dialog ── */}
      <Dialog open={grnOpen} onOpenChange={setGrnOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <form onSubmit={handleSubmitGrn}>
            <DialogHeader>
              <DialogTitle>Tạo phiếu nhập kho (GRN)</DialogTitle>
              <p className="text-xs text-slate-500">
                Nhập số lượng thực nhận cho từng dòng hàng. Dòng nào bỏ trống
                hoặc = 0 sẽ bị bỏ qua.
              </p>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Đặt</TableHead>
                    <TableHead className="text-right">Đã nhận</TableHead>
                    <TableHead className="text-right">Còn lại</TableHead>
                    <TableHead className="text-right">Nhập lần này</TableHead>
                    <TableHead>Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grnLines.map((line) => {
                    const item = items.find((i) => i.id === line.poItemId);
                    if (!item) return null;
                    const ordered = Number(item.orderedQty ?? 0);
                    const received = Number(item.receivedQty ?? 0);
                    const remain = Math.max(0, ordered - received);
                    return (
                      <TableRow key={line.poItemId}>
                        <TableCell className="font-mono text-sm">
                          {item.productSku}
                        </TableCell>
                        <TableCell className="text-right">{ordered}</TableCell>
                        <TableCell className="text-right">{received}</TableCell>
                        <TableCell className="text-right font-medium">
                          {remain}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            value={line.receivedQty}
                            onChange={(e) =>
                              updateGrnLine(
                                line.poItemId,
                                "receivedQty",
                                e.target.value,
                              )
                            }
                            inputMode="decimal"
                            placeholder={`Tối đa ${remain}`}
                            className="w-24 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={line.note}
                            onChange={(e) =>
                              updateGrnLine(
                                line.poItemId,
                                "note",
                                e.target.value,
                              )
                            }
                            placeholder="Ghi chú"
                            className="w-32"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500">
                    Vị trí nhận hàng <span className="text-rose-500">*</span>
                  </label>
                  {locationOptions.length === 0 ? (
                    <p className="mt-1 text-xs text-amber-600">
                      Kho này chưa có vị trí nào. Vui lòng tạo vị trí cho kho
                      trước khi nhập hàng.
                    </p>
                  ) : (
                    <Select
                      value={grnLocationId || "__empty__"}
                      onValueChange={(v) =>
                        setGrnLocationId(!v || v === "__empty__" ? "" : v)
                      }
                    >
                      <SelectTrigger>
                        <span className="flex flex-1 text-left">
                          {grnLocationId
                            ? (locationOptions.find(
                                (l) => l.id === grnLocationId,
                              )?.code ??
                              locationOptions.find(
                                (l) => l.id === grnLocationId,
                              )?.name ??
                              grnLocationId)
                            : "Chọn vị trí"}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {locationOptions.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.code ?? loc.name ?? loc.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">
                    Ghi chú phiếu nhập
                  </label>
                  <Textarea
                    value={grnNote}
                    onChange={(e) => setGrnNote(e.target.value)}
                    placeholder="Ghi chú chung (tuỳ chọn)"
                    rows={2}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setGrnOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={creatingGrn}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {creatingGrn ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Tạo phiếu nhập
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Putaway Dialog ── */}
      <Dialog open={putawayOpen} onOpenChange={setPutawayOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitCompletePutaway}>
            <DialogHeader>
              <DialogTitle>Hoàn tất Putaway</DialogTitle>
              {activeTask ? (
                <p className="text-xs text-slate-500">
                  Task: {activeTask.id.slice(0, 8)}…
                </p>
              ) : null}
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div>
                <label className="text-xs font-semibold text-slate-500">
                  Vị trí thực tế *
                </label>
                <Select
                  value={actualLocationId || "__empty__"}
                  onValueChange={(v) =>
                    setActualLocationId(!v || v === "__empty__" ? "" : v)
                  }
                >
                  <SelectTrigger
                    className={
                      putawayErrors.actualLocationId ? "border-rose-400" : ""
                    }
                  >
                    <SelectValue placeholder="Chọn vị trí thực tế" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">Chọn vị trí</SelectItem>
                    {locationOptions.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.code ?? loc.name ?? loc.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {putawayErrors.actualLocationId && (
                  <p className="text-xs text-rose-600">
                    {putawayErrors.actualLocationId}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPutawayOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={completingPutaway}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {completingPutaway ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Hoàn tất"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
