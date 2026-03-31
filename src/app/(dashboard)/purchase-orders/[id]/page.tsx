"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
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
} from "@/store/services/purchase-order.service";
import {
  useCreateInboundReceiptMutation,
  useGetInboundReceiptsByPoQuery,
} from "@/store/services/inbound.service";
import type { PoItem, PutawayTask } from "@/types/purchase-order";
import type { InboundReceipt } from "@/types/inbound-receipt";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Nháp",
  APPROVED: "Đã duyệt",
  PARTIAL: "Nhận một phần",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

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

  const poStatus = po?.status ?? "";
  const isDraft = poStatus === "DRAFT";
  const canApprove = isDraft && items.length > 0;
  const canReceive = poStatus === "APPROVED" || poStatus === "PARTIAL";
  const canCancel =
    poStatus === "DRAFT" || poStatus === "APPROVED" || poStatus === "PARTIAL";
  const canDelete = isDraft;

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

    // Validate qty not exceeding remaining
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

            {/* DRAFT actions */}
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

            {/* APPROVED / PARTIAL actions */}
            {canReceive && (
              <Button
                onClick={openGrn}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <PackagePlus className="mr-2 h-4 w-4" />
                Nhập hàng
              </Button>
            )}

            {/* Cancel (DRAFT / APPROVED / PARTIAL) */}
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
                {po.totalAmount != null
                  ? po.totalAmount.toLocaleString("vi-VN") + " ₫"
                  : "—"}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                PO Items
              </h3>
            </div>
            <div className="overflow-x-auto">
              <Table className="min-w-[860px] text-left">
                <TableHeader className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 text-xs font-semibold text-slate-500 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
                  <TableRow>
                    <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Dòng</TableHead>
                    <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">SKU</TableHead>
                    <TableHead className="px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">orderedQty</TableHead>
                    <TableHead className="px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">receivedQty</TableHead>
                    <TableHead className="w-56 px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-10 text-center text-slate-500"
                      >
                        Chưa có dòng hàng.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((row) => {
                      const remain = Math.max(
                        0,
                        Number(row.orderedQty ?? 0) -
                          Number(row.receivedQty ?? 0),
                      );
                      return (
                        <TableRow key={row.id} className="group transition-colors odd:bg-white even:bg-slate-50/40 hover:bg-indigo-50/40 dark:odd:bg-slate-900 dark:even:bg-slate-900/70 dark:hover:bg-slate-800/70">
                          <TableCell className="px-3 py-3">{row.lineNumber}</TableCell>
                          <TableCell className="px-3 py-3 font-mono text-sm">
                            {row.productSku}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-right">
                            {row.orderedQty}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-right">
                            {row.receivedQty ?? 0}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openReceive(row)}
                                disabled={!canReceive || remain <= 0}                              >
                                {task.status}
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
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Putaway Tasks
              </h3>
            </div>
            <div className="overflow-x-auto">
              <Table className="min-w-[980px] text-left">
                <TableHeader className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 text-xs font-semibold text-slate-500 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
                  <TableRow>
                    <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Task</TableHead>
                    <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">poItemId</TableHead>
                    <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">status</TableHead>
                    <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">suggestedLocationId</TableHead>
                    <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">actualLocationId</TableHead>
                    <TableHead className="w-40 px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tasks.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-slate-500"
                      >
                        Chưa có putaway task.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tasks.map((task) => (
                      <TableRow key={task.id} className="group transition-colors odd:bg-white even:bg-slate-50/40 hover:bg-indigo-50/40 dark:odd:bg-slate-900 dark:even:bg-slate-900/70 dark:hover:bg-slate-800/70">
                        <TableCell className="px-3 py-3 font-mono text-xs">
                          {task.id}
                        </TableCell>
                        <TableCell className="px-3 py-3 font-mono text-xs">
                          {task.poItemId ?? "-"}
                        </TableCell>
                        <TableCell className="px-3 py-3">{task.status}</TableCell>
                        <TableCell className="px-3 py-3 font-mono text-xs">
                          {task.suggestedLocationId ?? "-"}
                        </TableCell>
                        <TableCell className="px-3 py-3 font-mono text-xs">
                          {task.actualLocationId ?? "-"}
                        </TableCell>
                        <TableCell className="px-3 py-3 text-right">
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
                        <SelectValue placeholder="Chọn vị trí" />
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
