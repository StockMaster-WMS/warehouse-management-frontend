"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiErrMessage } from "@/types/api";
import {
  useCompletePutawayTaskMutation,
  useGetPutawayTasksQuery,
  usePatchPutawayTaskMutation,
} from "@/store/services/purchase-order.service";
import type { PutawayTask } from "@/types/purchase-order";

const completeSchema = z.object({
  actualLocationId: z.string().min(1, "Nhập UUID vị trí thực tế"),
});

export default function PutawayPage() {
  const [poItemFilter, setPoItemFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const queryArgs = useMemo(
    () => ({
      ...(poItemFilter.trim() ? { poItemId: poItemFilter.trim() } : {}),
      ...(statusFilter.trim() ? { status: statusFilter.trim() } : {}),
    }),
    [poItemFilter, statusFilter]
  );

  const { data, isLoading, isError, error, refetch } = useGetPutawayTasksQuery(queryArgs);

  const tasks = data?.data?.content ?? [];

  const [completeOpen, setCompleteOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<PutawayTask | null>(null);
  const [actualLocationId, setActualLocationId] = useState("");
  const [completeErrors, setCompleteErrors] = useState<Record<string, string>>({});

  const [editOpen, setEditOpen] = useState(false);
  const [editSuggested, setEditSuggested] = useState("");
  const [editStatus, setEditStatus] = useState<string>("PENDING");

  const [completeTask, { isLoading: completing }] = useCompletePutawayTaskMutation();
  const [patchTask, { isLoading: patching }] = usePatchPutawayTaskMutation();

  function openComplete(t: PutawayTask) {
    setActiveTask(t);
    setActualLocationId(t.actualLocationId ?? "");
    setCompleteErrors({});
    setCompleteOpen(true);
  }

  function openEdit(t: PutawayTask) {
    setActiveTask(t);
    setEditSuggested(t.suggestedLocationId ?? "");
    setEditStatus(typeof t.status === "string" ? t.status : "PENDING");
    setEditOpen(true);
  }

  async function submitComplete(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTask) return;
    setCompleteErrors({});
    const parsed = completeSchema.safeParse({ actualLocationId: actualLocationId.trim() });
    if (!parsed.success) {
      const err: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = String(issue.path[0] ?? "form");
        if (!err[k]) err[k] = issue.message;
      }
      setCompleteErrors(err);
      return;
    }
    try {
      const res = await completeTask({
        id: activeTask.id,
        body: { actualLocationId: parsed.data.actualLocationId },
      }).unwrap();
      if (!res.success) {
        toast.error((res as { message?: string }).message || "Hoàn tất thất bại");
        return;
      }
      toast.success((res as { message?: string }).message || "Đã hoàn tất putaway");
      setCompleteOpen(false);
      refetch();
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTask) return;
    try {
      const res = await patchTask({
        id: activeTask.id,
        body: {
          status: editStatus as PutawayTask["status"],
          ...(editSuggested.trim() ? { suggestedLocationId: editSuggested.trim() } : { suggestedLocationId: null }),
        },
      }).unwrap();
      if (!res.success) {
        toast.error(res.message || "Cập nhật thất bại");
        return;
      }
      toast.success(res.message || "Đã cập nhật task");
      setEditOpen(false);
      refetch();
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Putaway"
        description="Danh sách task putaway từ gateway — lọc theo dòng PO hoặc trạng thái."
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-end">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold text-slate-500">poItemId (UUID)</label>
          <Input
            value={poItemFilter}
            onChange={(e) => setPoItemFilter(e.target.value)}
            placeholder="Lọc theo dòng PO…"
            className="font-mono text-xs"
          />
        </div>
        <div className="w-full md:w-56 space-y-1">
          <label className="text-xs font-semibold text-slate-500">Trạng thái</label>
          <Select
            value={statusFilter || "__all__"}
            onValueChange={(v) => setStatusFilter(!v || v === "__all__" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tất cả</SelectItem>
              <SelectItem value="PENDING">PENDING</SelectItem>
              <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
              <SelectItem value="CANCELLED">CANCELLED</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="button" variant="secondary" onClick={() => refetch()}>
          Làm mới
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Đang tải…
          </div>
        ) : isError ? (
          <div className="p-6 text-sm text-rose-600">
            Lỗi GET /api/putaway-tasks. {apiErrMessage(error)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-slate-500">
            <MapPin className="h-10 w-10 opacity-30" />
            <p className="text-sm">Không có task. Thử bỏ bộ lọc hoặc nhận hàng từ đơn PO trước.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Task</TableHead>
                  <TableHead>poItemId</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Vị trí gợi ý</TableHead>
                  <TableHead>Vị trí thực tế</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((t: PutawayTask) => (
                  <TableRow key={t.id}>
                    <TableCell className="max-w-[120px] truncate font-mono text-xs">{t.id}</TableCell>
                    <TableCell className="max-w-[120px] truncate font-mono text-xs">{t.poItemId ?? "—"}</TableCell>
                    <TableCell>{t.status}</TableCell>
                    <TableCell className="max-w-[100px] truncate font-mono text-xs">
                      {t.suggestedLocationId ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[100px] truncate font-mono text-xs">
                      {t.actualLocationId ?? "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEdit(t)} disabled={patching}>
                        Sửa
                      </Button>
                      <Button type="button" size="sm" className="bg-indigo-600" onClick={() => openComplete(t)}>
                        Hoàn tất
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <form onSubmit={submitComplete}>
            <DialogHeader>
              <DialogTitle>Hoàn tất putaway</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <label className="text-xs font-semibold text-slate-500">actualLocationId * (UUID)</label>
              <Input
                value={actualLocationId}
                onChange={(e) => setActualLocationId(e.target.value)}
                className={`mt-1 font-mono text-xs ${completeErrors.actualLocationId ? "border-rose-400" : ""}`}
              />
              {completeErrors.actualLocationId && (
                <p className="text-xs text-rose-600">{completeErrors.actualLocationId}</p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                TODO: thay bằng dropdown vị trí khi có GET /api/locations.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCompleteOpen(false)}>
                Huỷ
              </Button>
              <Button type="submit" disabled={completing} className="bg-indigo-600">
                {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gửi complete"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <form onSubmit={submitEdit}>
            <DialogHeader>
              <DialogTitle>Cập nhật task (PATCH)</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div>
                <label className="text-xs font-semibold text-slate-500">Trạng thái</label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v ?? "PENDING")}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">PENDING</SelectItem>
                    <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
                    <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Vị trí gợi ý (UUID)</label>
                <Input
                  value={editSuggested}
                  onChange={(e) => setEditSuggested(e.target.value)}
                  className="mt-1 font-mono text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
                Huỷ
              </Button>
              <Button type="submit" disabled={patching} className="bg-indigo-600">
                {patching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
