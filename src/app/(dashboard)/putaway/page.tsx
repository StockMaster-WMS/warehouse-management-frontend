"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import {
  Loader2,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  ChevronRight,
  PackageCheck,
  SlidersHorizontal,
  PackageOpen,
  FileText,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import { Input } from "@/components/ui/input";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { StatsGrid, type StatItem } from "@/components/ui/stats-grid";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { apiErrMessage } from "@/types/api";
import {
  useCompletePutawayTaskMutation,
  useGetLocationsQuery,
  useGetPoItemsQuery,
  useGetPutawayTasksQuery,
  usePatchPutawayTaskMutation,
} from "@/store/services/purchase-order.service";
import type { PoItem, PutawayTask } from "@/types/purchase-order";

const completeSchema = z.object({
  actualLocationId: z.string().min(1, "Chọn vị trí thực tế"),
});

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  PENDING: {
    label: "Chờ xử lý",
    cls: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900",
    icon: <Clock className="h-3 w-3" />,
  },
  IN_PROGRESS: {
    label: "Đang thực hiện",
    cls: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900",
    icon: <ChevronRight className="h-3 w-3" />,
  },
  COMPLETED: {
    label: "Hoàn tất",
    cls: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  CANCELLED: {
    label: "Đã hủy",
    cls: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900",
    icon: <XCircle className="h-3 w-3" />,
  },
};

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return <span className="text-xs text-slate-400">{status}</span>;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", cfg.cls)}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

const EMPTY_PUTAWAY_TASKS: PutawayTask[] = [];

export default function PutawayPage() {
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetPutawayTasksQuery({
      page,
      size,
      ...(keyword.trim() ? { poItemId: keyword.trim() } : {}),
      ...(statusFilter.trim() ? { status: statusFilter.trim() } : {}),
    });

  const tasks = data?.data?.content ?? EMPTY_PUTAWAY_TASKS;
  const totalElements = data?.data?.total_elements ?? tasks.length;
  const totalPages = data?.data?.total_pages ?? 0;

  /* ── Locations lookup ── */
  const { data: locationsRes } = useGetLocationsQuery({});
  const locationMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const loc of locationsRes?.data ?? []) {
      const label =
        loc.code ||
        loc.name ||
        `${loc.zone ?? ""}${loc.aisle ?? ""}-${loc.rack ?? ""}${loc.level != null ? "/" + loc.level : ""}${loc.bin ? "/" + loc.bin : ""}`;
      map.set(loc.id, label);
    }
    return map;
  }, [locationsRes]);

  /* ── PO Items lookup ── */
  const { data: poItemsRes } = useGetPoItemsQuery(
    { size: 200 },
    { skip: tasks.length === 0 },
  );

  const poItemMap = useMemo(() => {
    const map = new Map<string, PoItem>();
    for (const item of poItemsRes?.data?.content ?? []) {
      map.set(item.id, item);
    }
    return map;
  }, [poItemsRes]);

  /* ── Dialog state ── */
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

  /* ── Quick stats ── */
  const stats = useMemo(() => ({
    total: totalElements,
    pending: tasks.filter((t) => t.status === "PENDING").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    completed: tasks.filter((t) => t.status === "COMPLETED").length,
  }), [tasks, totalElements]);

  const statsItems = useMemo<StatItem[]>(() => {
    const multiPage = totalPages > 1;

    return [
      {
        label: "Tổng task",
        value: stats.total,
        icon: FileText,
        color: "text-indigo-500",
      },
      {
        label: multiPage ? "Chờ xử lý (trang này)" : "Chờ xử lý",
        value: stats.pending,
        icon: Clock,
        color: "text-amber-500",
      },
      {
        label: multiPage ? "Đang thực hiện (trang này)" : "Đang thực hiện",
        value: stats.inProgress,
        icon: Activity,
        color: "text-blue-500",
      },
      {
        label: multiPage ? "Hoàn tất (trang này)" : "Hoàn tất",
        value: stats.completed,
        icon: CheckCircle2,
        color: "text-emerald-500",
      },
    ];
  }, [stats, totalPages]);

  return (
    <div className="space-y-5 pb-16">
      <PageHeader
        title="Sắp xếp vào kho"
        description="Quản lý tác vụ đặt hàng vào vị trí lưu kho (Putaway tasks)."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5 rounded-xl border-slate-200"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            Làm mới
          </Button>
        }
      />

      <StatsGrid stats={statsItems} isLoading={isLoading} />

      {/* Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <SearchToolbar
          noContainer
          placeholder="Tìm theo mã PO Item ID..."
          value={keyword}
          onValueChange={(value) => {
            setKeyword(value);
            setPage(0);
          }}
          right={
            <>
              <Select
                value={statusFilter || "all"}
                onValueChange={(value) => {
                  setStatusFilter(!value || value === "all" ? "" : value);
                  setPage(0);
                }}
              >
                <SelectTrigger className="h-10 w-44 shrink-0 rounded-xl border-slate-200 dark:border-slate-700">
                  <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate text-sm">
                    {statusFilter ? (STATUS_CONFIG[statusFilter]?.label ?? statusFilter) : "Tất cả trạng thái"}
                  </span>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="rounded-lg">Tất cả</SelectItem>
                  <SelectItem value="PENDING" className="rounded-lg">Chờ xử lý</SelectItem>
                  <SelectItem value="IN_PROGRESS" className="rounded-lg">Đang thực hiện</SelectItem>
                  <SelectItem value="COMPLETED" className="rounded-lg">Hoàn tất</SelectItem>
                  <SelectItem value="CANCELLED" className="rounded-lg">Đã hủy</SelectItem>
                </SelectContent>
              </Select>

              {(keyword || statusFilter) ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 text-xs text-slate-500 hover:text-rose-600"
                  onClick={() => {
                    setKeyword("");
                    setStatusFilter("");
                    setPage(0);
                  }}
                >
                  Xóa bộ lọc
                </Button>
              ) : null}
            </>
          }
        />

        {isFetching && !isLoading && (
          <div className="flex items-center gap-2 border-b border-slate-100 bg-indigo-50/60 px-6 py-2 text-xs font-medium text-indigo-600 dark:border-slate-800 dark:bg-indigo-950/20 dark:text-indigo-400">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
            Đang cập nhật dữ liệu…
          </div>
        )}

        <div className="overflow-x-auto">
          <Table className="min-w-[800px] text-left">
            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
              <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                <TableHead className="py-3.5 pl-6 pr-3 w-36 text-[11px] font-bold uppercase tracking-wider text-slate-400">Task ID</TableHead>
                <TableHead className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Sản phẩm (SKU)</TableHead>
                <TableHead className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</TableHead>
                <TableHead className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Vị trí gợi ý</TableHead>
                <TableHead className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Vị trí thực tế</TableHead>
                <TableHead className="py-3.5 pl-3 pr-6 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-slate-100 dark:border-slate-800">
                    <TableCell className="py-4 pl-6 pr-3"><Skeleton className="h-4 w-24 rounded" /></TableCell>
                    <TableCell className="px-3 py-4"><Skeleton className="h-4 w-28 rounded" /></TableCell>
                    <TableCell className="px-3 py-4"><Skeleton className="h-4 w-24 rounded" /></TableCell>
                    <TableCell className="px-3 py-4"><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell className="px-3 py-4"><Skeleton className="h-4 w-16 rounded" /></TableCell>
                    <TableCell className="py-4 pl-3 pr-6 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Skeleton className="h-8 w-12 rounded-lg" />
                        <Skeleton className="h-8 w-16 rounded-lg" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12">
                    <EmptyState
                      icon={AlertCircle}
                      title="Không tải được danh sách putaway"
                      description={apiErrMessage(error)}
                      action={<Button variant="outline" size="sm" onClick={() => refetch()}>Thử lại</Button>}
                    />
                  </TableCell>
                </TableRow>
              ) : tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12">
                    <EmptyState
                      icon={PackageOpen}
                      title="Không có task putaway"
                      description="Thử bỏ bộ lọc hoặc tạo phiếu nhập hàng từ đơn PO trước."
                      action={<Button variant="outline" size="sm" onClick={() => refetch()}>Làm mới</Button>}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((t: PutawayTask) => {
                  const sku = t.poItemId && poItemMap.has(t.poItemId)
                    ? poItemMap.get(t.poItemId)!.productSku
                    : t.poItemId ? `…${t.poItemId.slice(-6)}` : "—";
                  const canComplete = t.status === "PENDING" || t.status === "IN_PROGRESS";

                  return (
                    <TableRow
                      key={t.id}
                      className={cn(
                        "group border-b border-slate-50 last:border-0 transition-colors dark:border-slate-800/60",
                        t.status === "COMPLETED" && "opacity-60",
                        t.status !== "COMPLETED" && "hover:bg-slate-50/80 dark:hover:bg-slate-800/40",
                      )}
                    >
                      <TableCell className="py-4 pl-6 pr-3">
                        <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                          PUT-{t.id.slice(0, 8).toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-4">
                        <span className="font-mono text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                          {sku}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-4">
                        <StatusPill status={t.status} />
                      </TableCell>
                      <TableCell className="px-3 py-4">
                        {t.suggestedLocationId ? (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {locationMap.get(t.suggestedLocationId) ?? `…${t.suggestedLocationId.slice(-6)}`}
                          </span>
                        ) : <span className="text-slate-400 text-xs">—</span>}
                      </TableCell>
                      <TableCell className="px-3 py-4">
                        {t.actualLocationId ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            {locationMap.get(t.actualLocationId) ?? `…${t.actualLocationId.slice(-6)}`}
                          </span>
                        ) : <span className="text-slate-400 text-xs">—</span>}
                      </TableCell>
                      <TableCell className="py-4 pl-3 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700"
                            onClick={() => openEdit(t)}
                            disabled={patching}
                          >
                            Sửa
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className={cn(
                              "h-8 px-2.5 text-xs rounded-lg gap-1",
                              canComplete
                                ? "bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                                : "opacity-40 cursor-not-allowed bg-slate-300 dark:bg-slate-700",
                            )}
                            onClick={() => canComplete && openComplete(t)}
                            disabled={!canComplete}
                          >
                            <PackageCheck className="h-3.5 w-3.5" />
                            Hoàn tất
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

      {/* ── Complete Dialog ── */}
      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <form onSubmit={submitComplete}>
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

            <div className="py-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                  Vị trí thực tế <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={actualLocationId}
                  onChange={(e) => setActualLocationId(e.target.value)}
                  placeholder="Nhập UUID vị trí thực tế"
                  className={cn("font-mono text-xs rounded-xl", completeErrors.actualLocationId && "border-rose-400 focus:ring-rose-400/20")}
                />
                {completeErrors.actualLocationId && (
                  <p className="mt-1 text-xs text-rose-600">{completeErrors.actualLocationId}</p>
                )}
                <p className="mt-1.5 text-xs text-slate-400">Nhập ID của vị trí kệ thực tế đã đặt sản phẩm vào</p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setCompleteOpen(false)} className="rounded-xl">
                Huỷ
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={completing}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 gap-1.5"
              >
                {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Xác nhận hoàn tất
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <form onSubmit={submitEdit}>
            <DialogHeader>
              <DialogTitle>Cập nhật task putaway</DialogTitle>
              {activeTask && (
                <DialogDescription>
                  Task <span className="font-mono font-semibold">PUT-{activeTask.id.slice(0, 8).toUpperCase()}</span>
                </DialogDescription>
              )}
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Trạng thái</label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v ?? "PENDING")}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="PENDING" className="rounded-lg">Chờ xử lý</SelectItem>
                    <SelectItem value="IN_PROGRESS" className="rounded-lg">Đang thực hiện</SelectItem>
                    <SelectItem value="CANCELLED" className="rounded-lg">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Vị trí gợi ý</label>
                <Input
                  value={editSuggested}
                  onChange={(e) => setEditSuggested(e.target.value)}
                  placeholder="UUID vị trí gợi ý (để trống = xóa)"
                  className="rounded-xl font-mono text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditOpen(false)} className="rounded-xl">
                Huỷ
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={patching}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 gap-1.5"
              >
                {patching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
