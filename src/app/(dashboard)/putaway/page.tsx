"use client";

import { useState } from "react";
import { z } from "zod";
import {
  Loader2,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationFooter } from "@/components/ui/pagination-footer";
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
  actualLocationId: z.string().min(1, "Chọn vị trí thực tế"),
});

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Chờ xử lý",
  IN_PROGRESS: "Đang thực hiện",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

function statusBadgeClass(s: string): string {
  switch (s) {
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

export default function PutawayPage() {
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [poItemFilter, setPoItemFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetPutawayTasksQuery({
      page,
      size,
      ...(poItemFilter.trim() ? { poItemId: poItemFilter.trim() } : {}),
      ...(statusFilter.trim() ? { status: statusFilter.trim() } : {}),
    });

  const tasks = data?.data?.content ?? [];
  const totalElements = data?.data?.total_elements ?? tasks.length;
  const totalPages = data?.data?.total_pages ?? 0;

  const [completeOpen, setCompleteOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<PutawayTask | null>(null);
  const [actualLocationId, setActualLocationId] = useState("");
  const [completeErrors, setCompleteErrors] = useState<Record<string, string>>(
    {},
  );

  const [editOpen, setEditOpen] = useState(false);
  const [editSuggested, setEditSuggested] = useState("");
  const [editStatus, setEditStatus] = useState<string>("PENDING");

  const [completeTask, { isLoading: completing }] =
    useCompletePutawayTaskMutation();
  const [patchTask, { isLoading: patching }] = usePatchPutawayTaskMutation();

  function openComplete(t: PutawayTask) {
    setActiveTask(t);
    setActualLocationId(t.actualLocationId ?? t.suggestedLocationId ?? "");
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
    const parsed = completeSchema.safeParse({
      actualLocationId: actualLocationId.trim(),
    });
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
        toast.error(
          (res as { message?: string }).message || "Hoàn tất thất bại",
        );
        return;
      }
      toast.success(
        (res as { message?: string }).message || "Đã hoàn tất putaway",
      );
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
          ...(editSuggested.trim()
            ? { suggestedLocationId: editSuggested.trim() }
            : { suggestedLocationId: null }),
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
        description="Danh sách task sắp xếp hàng vào vị trí kho."
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-end">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold text-slate-500">
            PO Item ID
          </label>
          <Input
            value={poItemFilter}
            onChange={(e) => {
              setPoItemFilter(e.target.value);
              setPage(0);
            }}
            placeholder="Lọc theo dòng PO…"
            className="font-mono text-xs"
          />
        </div>
        <div className="w-full md:w-56 space-y-1">
          <label className="text-xs font-semibold text-slate-500">
            Trạng thái
          </label>
          <Select
            value={statusFilter || "__all__"}
            onValueChange={(v) => {
              setStatusFilter(!v || v === "__all__" ? "" : v);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tất cả</SelectItem>
              <SelectItem value="PENDING">Chờ xử lý</SelectItem>
              <SelectItem value="IN_PROGRESS">Đang thực hiện</SelectItem>
              <SelectItem value="COMPLETED">Hoàn tất</SelectItem>
              <SelectItem value="CANCELLED">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="button" variant="secondary" onClick={() => refetch()}>
          Làm mới
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isFetching && !isLoading ? (
          <p className="border-b border-slate-100 bg-slate-50 px-6 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
            Đang cập nhật dữ liệu…
          </p>
        ) : null}
        <div className="overflow-x-auto">
          <Table className="min-w-245 text-left">
            <TableHeader className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 text-xs font-semibold text-slate-500 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
              <TableRow>
                <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Task</TableHead>
                <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">poItemId</TableHead>
                <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</TableHead>
                <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Vị trí gợi ý</TableHead>
                <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Vị trí thực tế</TableHead>
                <TableHead className="px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`putaway-skel-${i}`}>
                    <TableCell className="px-3 py-3">
                      <Skeleton className="h-3 w-full max-w-25" />
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <Skeleton className="h-3 w-full max-w-25" />
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <Skeleton className="h-3 w-20" />
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <Skeleton className="h-3 w-20" />
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Skeleton className="h-8 w-14 rounded-md" />
                        <Skeleton className="h-8 w-20 rounded-md" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      icon={AlertCircle}
                      title="Không tải được danh sách putaway"
                      description={apiErrMessage(error)}
                      action={
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => refetch()}
                        >
                          Thử lại
                        </Button>
                      }
                      className="py-10"
                    />
                  </TableCell>
                </TableRow>
              ) : tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      icon={MapPin}
                      title="Không có task putaway"
                      description="Thử bỏ bộ lọc hoặc nhập hàng từ đơn PO trước."
                      action={
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => refetch()}
                        >
                          Làm mới
                        </Button>
                      }
                      className="py-10"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((t: PutawayTask) => (
                  <TableRow key={t.id} className="group transition-colors odd:bg-white even:bg-slate-50/40 hover:bg-indigo-50/40 dark:odd:bg-slate-900 dark:even:bg-slate-900/70 dark:hover:bg-slate-800/70">
                    <TableCell className="max-w-30 truncate px-3 py-3 font-mono text-xs">{t.id}</TableCell>
                    <TableCell className="max-w-30 truncate px-3 py-3 font-mono text-xs">{t.poItemId ?? "—"}</TableCell>
                    <TableCell className="px-3 py-3">{t.status}</TableCell>
                    <TableCell className="max-w-25 truncate px-3 py-3 font-mono text-xs">
                      {t.suggestedLocationId ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-25 truncate px-3 py-3 font-mono text-xs">
                      {t.actualLocationId ?? "—"}
                    </TableCell>
                    <TableCell className="space-x-1 px-3 py-3 text-right">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEdit(t)} disabled={patching}>
                        Sửa
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => openComplete(t)}
                        disabled={
                          !(
                            t.status === "PENDING" || t.status === "IN_PROGRESS"
                          )
                        }
                      >
                        Hoàn tất
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <PaginationFooter
          itemLabel="putaway task"
          rowsCount={tasks.length}
          page={page}
          totalElements={totalElements}
          totalPages={totalPages}
          canGoPrev={page > 0}
          canGoNext={totalPages > 0 && page < totalPages - 1}
          isFetching={isFetching}
          onPrevPage={() => setPage((p) => Math.max(0, p - 1))}
          onNextPage={() => setPage((p) => p + 1)}
          pageSize={size}
        />
      </div>

      {/* Complete Dialog */}
      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitComplete}>
            <DialogHeader>
              <DialogTitle>Hoàn tất putaway</DialogTitle>
              {activeTask && (
                <p className="text-xs text-slate-500">
                  Task: {activeTask.id.slice(0, 8)}…
                </p>
              )}
            </DialogHeader>
            <div className="py-2">
              <label className="text-xs font-semibold text-slate-500">
                Vị trí thực tế *
              </label>
              <Input
                value={actualLocationId}
                onChange={(e) => setActualLocationId(e.target.value)}
                placeholder="UUID vị trí thực tế"
                className={`mt-1 font-mono text-xs ${completeErrors.actualLocationId ? "border-rose-400" : ""}`}
              />
              {completeErrors.actualLocationId && (
                <p className="text-xs text-rose-600">
                  {completeErrors.actualLocationId}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCompleteOpen(false)}
              >
                Huỷ
              </Button>
              <Button
                type="submit"
                disabled={completing}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {completing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Hoàn tất"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitEdit}>
            <DialogHeader>
              <DialogTitle>Cập nhật task</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div>
                <label className="text-xs font-semibold text-slate-500">
                  Trạng thái
                </label>
                <Select
                  value={editStatus}
                  onValueChange={(v) => setEditStatus(v ?? "PENDING")}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                    <SelectItem value="IN_PROGRESS">Đang thực hiện</SelectItem>
                    <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">
                  Vị trí gợi ý (UUID)
                </label>
                <Input
                  value={editSuggested}
                  onChange={(e) => setEditSuggested(e.target.value)}
                  placeholder="UUID vị trí gợi ý"
                  className="mt-1 font-mono text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditOpen(false)}
              >
                Huỷ
              </Button>
              <Button
                type="submit"
                disabled={patching}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {patching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Lưu"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
