"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import { z } from "zod";
import {
  ArrowLeft,
  Loader2,
  PackageCheck,
  CheckCircle2,
  Ban,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
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
  useCancelPurchaseOrderMutation,
  useCompletePutawayTaskMutation,
  useConfirmPurchaseOrderMutation,
  useDeletePoItemMutation,
  useGetLocationsQuery,
  useGetPurchaseOrderDetailQuery,
  useGetStocksQuery,
  useReceivePoItemMutation,
} from "@/store/services/purchase-order.service";
import type { PoItem, PutawayTask } from "@/types/purchase-order";

const receiveSchema = z.object({
  qtyStr: z.string().min(1, "Nhập số lượng nhận"),
  suggestedLocationId: z.string().optional(),
});

const completeSchema = z.object({
  actualLocationId: z.string().min(1, "Chọn vị trí thực tế"),
});

function statusClass(status: string | null | undefined): string {
  switch (status) {
    case "DRAFT":
      return "bg-slate-100 text-slate-700";
    case "RECEIVING":
      return "bg-amber-100 text-amber-700";
    case "RECEIVED":
      return "bg-emerald-100 text-emerald-700";
    case "CANCELLED":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
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

  const [receiveOpen, setReceiveOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<PoItem | null>(null);
  const [qtyStr, setQtyStr] = useState("");
  const [suggestedLocationId, setSuggestedLocationId] = useState("");
  const [receiveErrors, setReceiveErrors] = useState<Record<string, string>>(
    {},
  );

  const [putawayOpen, setPutawayOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<PutawayTask | null>(null);
  const [actualLocationId, setActualLocationId] = useState("");
  const [putawayErrors, setPutawayErrors] = useState<Record<string, string>>(
    {},
  );

  const [receivePoItem, { isLoading: receiving }] = useReceivePoItemMutation();
  const [completePutawayTask, { isLoading: completingPutaway }] =
    useCompletePutawayTaskMutation();
  const [confirmPo, { isLoading: confirmingPo }] =
    useConfirmPurchaseOrderMutation();
  const [cancelPo, { isLoading: cancellingPo }] =
    useCancelPurchaseOrderMutation();
  const [deletePoItem, { isLoading: deletingItem }] = useDeletePoItemMutation();

  const detail = detailRes?.data;
  const po = detail?.purchaseOrder;
  const items = detail?.items ?? [];
  const tasks = detail?.putawayTasks ?? [];
  const progress = detail?.progress;

  const poStatus = po?.status ?? "";
  const canConfirm = poStatus === "DRAFT";
  const canReceive = poStatus === "RECEIVING";
  const canCancel = poStatus === "DRAFT" || poStatus === "RECEIVING";

  const maxReceivable = useMemo(() => {
    if (!activeItem) return 0;
    const ordered = Number(activeItem.orderedQty ?? 0);
    const received = Number(activeItem.receivedQty ?? 0);
    return Math.max(0, ordered - received);
  }, [activeItem]);

  const { data: locationsRes } = useGetLocationsQuery(
    { warehouseId: po?.warehouseId ?? "" },
    { skip: !po?.warehouseId },
  );
  const locationOptions = Array.isArray(locationsRes?.data)
    ? locationsRes.data
    : [];

  const taskProductId = useMemo(() => {
    if (!activeTask?.poItemId) return "";
    const found = items.find((x) => x.id === activeTask.poItemId);
    return found?.productId ?? "";
  }, [activeTask, items]);

  const { data: stocksRes } = useGetStocksQuery(
    {
      warehouseId: po?.warehouseId ?? "",
      ...(actualLocationId.trim()
        ? { locationId: actualLocationId.trim() }
        : {}),
      ...(taskProductId ? { productId: taskProductId } : {}),
    },
    {
      skip: !po?.warehouseId || !actualLocationId.trim() || !taskProductId,
    },
  );

  const stockPreview = stocksRes?.data?.content ?? [];

  function openReceive(item: PoItem) {
    setActiveItem(item);
    setQtyStr("");
    setSuggestedLocationId("");
    setReceiveErrors({});
    setReceiveOpen(true);
  }

  function openPutaway(task: PutawayTask) {
    setActiveTask(task);
    setActualLocationId(
      task.actualLocationId ?? task.suggestedLocationId ?? "",
    );
    setPutawayErrors({});
    setPutawayOpen(true);
  }

  async function handleConfirmPo() {
    if (!id || !canConfirm) return;
    try {
      const res = await confirmPo(id).unwrap();
      if (!res.success) {
        toast.error(res.message || "Confirm PO thất bại");
        return;
      }
      toast.success(res.message || "Đã confirm PO, trạng thái sang RECEIVING");
      refetch();
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  async function handleCancelPo() {
    if (!id || !canCancel) return;
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

  async function handleDeletePoItem(item: PoItem) {
    if (!id) return;
    try {
      const res = await deletePoItem({
        id: item.id,
        purchaseOrderId: id,
      }).unwrap();
      if (!res.success) {
        toast.error(res.message || "Xóa dòng thất bại");
        return;
      }
      toast.success(res.message || "Đã xóa dòng");
      refetch();
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  async function submitReceive(e: React.FormEvent) {
    e.preventDefault();
    if (!activeItem || !id) return;
    setReceiveErrors({});

    if (!canReceive) {
      toast.error(
        "PO chưa ở trạng thái RECEIVING. Hãy Confirm PO trước khi nhận hàng.",
      );
      return;
    }

    const parsed = receiveSchema.safeParse({
      qtyStr,
      suggestedLocationId: suggestedLocationId || undefined,
    });
    if (!parsed.success) {
      const err: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = String(issue.path[0] ?? "form");
        if (!err[k]) err[k] = issue.message;
      }
      setReceiveErrors(err);
      return;
    }

    const qty = Number(parsed.data.qtyStr.replace(",", "."));
    if (!(qty > 0) || Number.isNaN(qty)) {
      setReceiveErrors({ qtyStr: "Số lượng phải > 0" });
      return;
    }

    if (qty > maxReceivable) {
      setReceiveErrors({
        qtyStr: `Số lượng vượt phần còn lại (${maxReceivable}).`,
      });
      toast.warning(`Qty vượt ordered còn lại (${maxReceivable}).`);
      return;
    }

    try {
      const res = await receivePoItem({
        poItemId: activeItem.id,
        purchaseOrderId: id,
        body: {
          qty,
          ...(parsed.data.suggestedLocationId?.trim()
            ? { suggestedLocationId: parsed.data.suggestedLocationId.trim() }
            : {}),
        },
      }).unwrap();

      if (!res.success) {
        toast.error(
          (res as { message?: string }).message || "Nhận hàng thất bại",
        );
        return;
      }
      toast.success(
        (res as { message?: string }).message || "Đã ghi nhận hàng",
      );
      setReceiveOpen(false);
      setActiveItem(null);
      refetch();
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  async function submitCompletePutaway(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTask) return;
    setPutawayErrors({});

    if (
      !(activeTask.status === "PENDING" || activeTask.status === "IN_PROGRESS")
    ) {
      toast.error("Chỉ task PENDING/IN_PROGRESS mới được complete putaway.");
      return;
    }

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
          (res as { message?: string }).message || "Complete putaway thất bại",
        );
        return;
      }
      toast.success(
        (res as { message?: string }).message || "Đã complete putaway",
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
      <PageHeader
        title="Chi tiết đơn nhập"
        description={po ? `Mã PO: ${po.poNumber}` : "Đang tải..."}
        actions={
          <div className="flex items-center gap-2">
            <Button
              render={<Link href="/purchase-orders" />}
              nativeButton={false}
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {canConfirm ? (
              <Button
                onClick={handleConfirmPo}
                disabled={confirmingPo}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {confirmingPo ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Confirm PO
              </Button>
            ) : null}
            {canCancel ? (
              <Button
                variant="outline"
                onClick={handleCancelPo}
                disabled={cancellingPo}
              >
                {cancellingPo ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Ban className="mr-2 h-4 w-4" />
                )}
                Cancel PO
              </Button>
            ) : null}
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
          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-4">
            <div>
              <span className="text-slate-500">Trạng thái</span>
              <div className="mt-1">
                <Badge variant="secondary" className={statusClass(po.status)}>
                  {po.status ?? "-"}
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-slate-500">Ngày đặt</span>
              <p className="mt-1 font-medium">{po.orderDate}</p>
            </div>
            <div>
              <span className="text-slate-500">Kho nhận</span>
              <p className="mt-1 font-mono text-xs break-all">
                {po.warehouseId}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Nhà cung cấp</span>
              <p className="mt-1 font-mono text-xs break-all">
                {po.supplierId}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs text-slate-500">totalOrderedQty</p>
              <p className="mt-1 text-2xl font-bold">
                {progress?.totalOrderedQty ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs text-slate-500">totalReceivedQty</p>
              <p className="mt-1 text-2xl font-bold">
                {progress?.totalReceivedQty ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs text-slate-500">fullyReceived</p>
              <p className="mt-1 text-2xl font-bold">
                {progress?.fullyReceived ? "true" : "false"}
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
              <Table className="min-w-215 text-left">
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
                                disabled={!canReceive || remain <= 0}
                              >
                                <PackageCheck className="mr-1 h-3.5 w-3.5" />
                                Receive
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={deletingItem}
                                onClick={() => handleDeletePoItem(row)}
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                Xóa dòng
                              </Button>
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

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Putaway Tasks
              </h3>
            </div>
            <div className="overflow-x-auto">
              <Table className="min-w-245 text-left">
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
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Complete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitReceive}>
            <DialogHeader>
              <DialogTitle>Receive theo dòng</DialogTitle>
              {activeItem ? (
                <p className="text-xs text-slate-500">
                  Dòng {activeItem.lineNumber} - SKU {activeItem.productSku}
                </p>
              ) : null}
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div>
                <label className="text-xs font-semibold text-slate-500">
                  qty *
                </label>
                <Input
                  value={qtyStr}
                  onChange={(e) => setQtyStr(e.target.value)}
                  inputMode="decimal"
                  className={receiveErrors.qtyStr ? "border-rose-400" : ""}
                />
                {receiveErrors.qtyStr ? (
                  <p className="text-xs text-rose-600">
                    {receiveErrors.qtyStr}
                  </p>
                ) : null}
                {activeItem ? (
                  <p className="mt-1 text-xs text-amber-600">
                    Còn lại có thể nhận: {maxReceivable}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">
                  suggestedLocationId (optional)
                </label>
                <Input
                  value={suggestedLocationId}
                  onChange={(e) => setSuggestedLocationId(e.target.value)}
                  placeholder="UUID vị trí gợi ý"
                  className="font-mono text-xs"
                />
              </div>
              {!canReceive ? (
                <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <AlertTriangle className="mr-1 inline h-3 w-3" />
                  PO phải ở trạng thái RECEIVING mới receive được.
                </div>
              ) : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setReceiveOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={receiving}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {receiving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Xác nhận receive"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={putawayOpen} onOpenChange={setPutawayOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={submitCompletePutaway}>
            <DialogHeader>
              <DialogTitle>Complete Putaway</DialogTitle>
              {activeTask ? (
                <p className="text-xs text-slate-500">Task: {activeTask.id}</p>
              ) : null}
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div>
                <label className="text-xs font-semibold text-slate-500">
                  actualLocationId *
                </label>
                <Select
                  value={actualLocationId || "__empty__"}
                  onValueChange={(v) => {
                    const next = String(v ?? "");
                    setActualLocationId(next === "__empty__" ? "" : next);
                  }}
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
                {putawayErrors.actualLocationId ? (
                  <p className="text-xs text-rose-600">
                    {putawayErrors.actualLocationId}
                  </p>
                ) : null}
              </div>

              {stockPreview.length > 0 ? (
                <div className="rounded-md border border-slate-200 p-2">
                  <p className="mb-2 text-xs font-semibold text-slate-600">
                    Stock preview tại vị trí chọn
                  </p>
                  <div className="max-h-40 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-xs">locationId</TableHead>
                          <TableHead className="text-xs text-right">
                            qty
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockPreview.slice(0, 5).map((s, idx) => (
                          <TableRow key={`${s.id ?? "stock"}-${idx}`}>
                            <TableCell className="font-mono text-xs">
                              {s.locationId ?? "-"}
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              {s.qty ?? s.availableQty ?? 0}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : null}
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
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Complete"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
