"use client";

import { useReducer } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  ListChecks,
  Plus,
  RefreshCw,
  Scale,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateCycleCountModal } from "@/components/features/cycle-counts/components/CreateCycleCountModal";
import { cn } from "@/lib/utils";
import { apiErrMessage } from "@/types/api";
import type { CycleCount, CycleCountStatus } from "@/types/cycle-count";
import { useGetCycleCountsQuery } from "@/store/services/cycle-count.service";
import { PermissionControl } from "@/components/permission-control";
import { ADMIN_MANAGER_ROLES } from "@/lib/access-control";

const PAGE_SIZE = 20;

type CycleCountsPageState = {
  page: number;
  pageSize: number;
  keyword: string;
  status: CycleCountStatus | "";
  createModalOpen: boolean;
};

const INITIAL_CYCLE_COUNTS_PAGE_STATE: CycleCountsPageState = {
  page: 0,
  pageSize: PAGE_SIZE,
  keyword: "",
  status: "",
  createModalOpen: false,
};

function cycleCountsPageReducer(
  state: CycleCountsPageState,
  patch: Partial<CycleCountsPageState>,
) {
  return { ...state, ...patch };
}

const STATUS_LABEL: Record<CycleCountStatus, string> = {
  DRAFT: "Nháp",
  OPEN: "Đã mở",
  COUNTING: "Đang kiểm",
  REVIEW: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  CANCELLED: "Đã hủy",
  PENDING: "Chờ bắt đầu",
  IN_PROGRESS: "Đang kiểm",
  COMPLETED: "Hoàn tất",
};

function statusClass(status: CycleCountStatus) {
  if (status === "APPROVED" || status === "COMPLETED") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300";
  if (status === "COUNTING" || status === "OPEN" || status === "IN_PROGRESS") return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300";
  if (status === "REVIEW") return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300";
  if (status === "CANCELLED") return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300";
  return "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300";
}

function formatDate(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
}

function lineStats(count: CycleCount) {
  const lines = count.lines ?? [];
  const counted = lines.filter((line) => line.status === "COUNTED" || line.status === "VARIANCE" || line.status === "APPROVED" || line.status === "ADJUSTED").length;
  const variances = lines.filter((line) => Number(line.varianceQty ?? 0) !== 0 || line.status === "VARIANCE" || line.status === "ADJUSTED").length;
  if (!lines.length) return { label: "Chưa sinh dòng kiểm", variances: 0 };
  return { label: `${counted}/${lines.length} đã kiểm`, variances };
}

export default function CycleCountsPage() {
  const [state, dispatch] = useReducer(
    cycleCountsPageReducer,
    INITIAL_CYCLE_COUNTS_PAGE_STATE,
  );
  const { page, pageSize, keyword, status, createModalOpen } = state;

  const { data, isLoading, isFetching, error, refetch } = useGetCycleCountsQuery({
    page,
    size: pageSize,
    keyword,
    status,
  });

  const rows = data?.data?.content ?? [];
  const totalElements = data?.data?.total_elements ?? 0;
  const totalPages = data?.data?.total_pages ?? 0;
  const countingCount = rows.filter((row) => row.status === "COUNTING" || row.status === "OPEN" || row.status === "IN_PROGRESS").length;
  const reviewCount = rows.filter((row) => row.status === "REVIEW" || row.status === "PENDING").length;
  const varianceCount = rows.reduce((sum, row) => sum + lineStats(row).variances, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Kiểm kê kho"
        description="Cycle Count: tạo đợt kiểm kê, ghi nhận số lượng thực tế và duyệt chênh lệch tồn."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn("mr-2 size-4", isFetching && "animate-spin")} />
              Làm mới
            </Button>
            <PermissionControl allowedRoles={ADMIN_MANAGER_ROLES}>
              <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-md" onClick={() => dispatch({ createModalOpen: true })}>
                <Plus className="mr-2 size-4" />
                Tạo đợt kiểm
              </Button>
            </PermissionControl>
          </div>
        }
      />

      <CreateCycleCountModal open={createModalOpen} onOpenChange={(createModalOpen) => dispatch({ createModalOpen })} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 md:gap-6">
        <StatCard label="Tổng đợt kiểm" value={totalElements.toLocaleString("vi-VN")} icon={ClipboardCheck} showAccentBar={false} />
        <StatCard label="Đang kiểm" value={countingCount.toLocaleString("vi-VN")} icon={ListChecks} iconClassName="text-blue-500" description="Trên trang hiện tại" showAccentBar={false} />
        <StatCard label="Chờ duyệt" value={reviewCount.toLocaleString("vi-VN")} icon={CheckCircle2} iconClassName="text-amber-500" description="Trên trang hiện tại" showAccentBar={false} />
        <StatCard label="Dòng lệch" value={varianceCount.toLocaleString("vi-VN")} icon={Scale} iconClassName="text-rose-500" description="Trên trang hiện tại" showAccentBar={false} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <SearchToolbar
          noContainer
          placeholder="Tìm theo mã kiểm kê, tiêu đề, kho, vị trí…"
          value={keyword}
          onValueChange={(value) => {
            dispatch({ keyword: value, page: 0 });
          }}
          right={
            <Select
              value={status || "all"}
              onValueChange={(value) => {
                dispatch({
                  status: value === "all" ? "" : (value as CycleCountStatus),
                  page: 0,
                });
              }}
            >
              <SelectTrigger className="h-10 w-44 rounded-xl border-zinc-200 dark:border-zinc-700">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />

        <div className="overflow-x-auto">
          <Table className="min-w-[920px]">
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Mã kiểm kê</TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Phạm vi</TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Trạng thái</TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tiến độ</TableHead>
                <TableHead className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Ngày tạo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, row) => (
                  <TableRow key={`cycle-skeleton-${row}`}>
                    {Array.from({ length: 5 }).map((__, col) => (
                      <TableCell key={`${row}-${col}`} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      icon={AlertCircle}
                      title="Chưa tải được dữ liệu kiểm kê"
                      description={apiErrMessage(error, "Frontend đã có contract /cycle-counts, backend có thể chưa triển khai endpoint kiểm kê kho.")}
                      action={<Button variant="outline" size="sm" onClick={() => refetch()}>Thử lại</Button>}
                      className="py-12"
                    />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      icon={ClipboardCheck}
                      title="Chưa có đợt kiểm kê"
                      description="Khi backend tạo cycle count, danh sách kiểm kê và chênh lệch tồn sẽ hiển thị tại đây."
                      className="py-12"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const stats = lineStats(row);
                  return (
                    <TableRow key={row.id} className="hover:bg-muted/50">
                      <TableCell className="px-4 py-3">
                        <Link href={`/cycle-counts/${row.id}`} className="hover:underline">
                          <div className="font-mono text-xs font-bold text-primary">{row.countNumber || row.id}</div>
                        </Link>
                        <div className="mt-1 text-xs text-muted-foreground">{row.description || "Không có tiêu đề"}</div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-foreground">
                        <div className="font-semibold">{row.warehouseName || row.warehouseId || "Kho chưa xác định"}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {row.scope}{row.zone ? ` · Zone ${row.zone}` : ""}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className={cn("inline-flex rounded-lg border px-2 py-1 text-xs font-semibold", statusClass(row.status))}>
                          {STATUS_LABEL[row.status] ?? row.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="text-sm font-medium text-foreground">{stats.label}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{stats.variances} dòng có chênh lệch</div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-sm text-muted-foreground">
                        {formatDate(row.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <PaginationFooter
          itemLabel="đợt kiểm kê"
          rowsCount={rows.length}
          page={page}
          totalElements={totalElements}
          totalPages={totalPages}
          pageSize={pageSize}
          canGoPrev={page > 0}
          canGoNext={totalPages > 0 && page < totalPages - 1}
          isLoading={isLoading}
          isError={Boolean(error)}
          isFetching={isFetching}
          onPrevPage={() => dispatch({ page: Math.max(0, page - 1) })}
          onNextPage={() => dispatch({ page: page + 1 })}
          onPageSizeChange={(nextSize) => {
            dispatch({ pageSize: nextSize, page: 0 });
          }}
        />
      </div>

      <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Quy trình kiểm kê gồm tạo đợt kiểm, sinh dòng kiểm theo tồn hệ thống, nhập số đếm thực tế và duyệt chênh lệch để điều chỉnh tồn kho.
      </div>
    </div>
  );
}
