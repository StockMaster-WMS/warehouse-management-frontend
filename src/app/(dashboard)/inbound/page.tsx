"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  PackagePlus,
  Search,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useGetInboundReceiptsQuery } from "@/store/services/inbound.service";
import { apiErrMessage, type PagedResponse } from "@/types/api";
import type { InboundReceipt } from "@/types/inbound-receipt";

const STATUS_OPTIONS = [
  "RECEIVED",
  "PUTAWAY_IN_PROGRESS",
  "COMPLETED",
] as const;

const STATUS_LABEL: Record<string, string> = {
  RECEIVED: "Đã nhận hàng",
  PUTAWAY_IN_PROGRESS: "Đang lên kệ",
  COMPLETED: "Hoàn tất",
};

function statusBadgeClass(status: string | null | undefined): string {
  switch (status) {
    case "RECEIVED":
      return "bg-blue-100 text-blue-700";
    case "PUTAWAY_IN_PROGRESS":
      return "bg-amber-100 text-amber-700";
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function InboundPage() {
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetInboundReceiptsQuery({
      page,
      size: 20,
      ...(keyword.trim() ? { keyword: keyword.trim() } : {}),
      ...(status ? { status } : {}),
    });

  const receipts = data?.data?.content ?? [];
  const pagedBody = data?.data;

  const paged = useMemo((): Pick<
    PagedResponse<InboundReceipt>,
    "page" | "size" | "total_elements" | "total_pages"
  > | null => {
    if (
      !pagedBody ||
      typeof pagedBody.page !== "number" ||
      typeof pagedBody.total_pages !== "number"
    )
      return null;
    return {
      page: pagedBody.page,
      size: pagedBody.size,
      total_elements: pagedBody.total_elements,
      total_pages: pagedBody.total_pages,
    };
  }, [pagedBody]);

  const canGoPrev = page > 0;
  const canGoNext =
    paged != null && paged.total_pages > 0 && page < paged.total_pages - 1;
  const hasAnyFilter = Boolean(keyword.trim() || status);

  const clearFilters = () => {
    setKeyword("");
    setStatus("");
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phiếu nhập kho"
        description="Quản lý phiếu nhập kho (GRN) từ đơn nhập hàng."
        actions={
          <Button
            render={<Link href="/inbound/new" />}
            nativeButton={false}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <PackagePlus className="mr-2 h-4 w-4" />
            Tạo phiếu nhập
          </Button>
        }
      />

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <Filter className="h-4 w-4 text-indigo-500" />
          Bộ lọc phiếu nhập
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(0);
              }}
              placeholder="Tìm theo mã phiếu, mã PO..."
              className="pl-9"
            />
          </div>
          <Select
            value={status || "__all__"}
            onValueChange={(v) => {
              const next = String(v ?? "");
              setStatus(next === "__all__" ? "" : next);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <span className="flex flex-1 truncate text-left">
                {status ? (STATUS_LABEL[status] ?? status) : "Tất cả trạng thái"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tất cả trạng thái</SelectItem>
              {STATUS_OPTIONS.map((st) => (
                <SelectItem key={st} value={st}>
                  {STATUS_LABEL[st] ?? st}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {hasAnyFilter ? (
          <div className="mt-3">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Xóa bộ lọc
            </Button>
          </div>
        ) : null}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isFetching && !isLoading ? (
          <p className="border-b border-slate-100 bg-slate-50 px-6 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
            Đang cập nhật dữ liệu…
          </p>
        ) : null}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 text-xs font-semibold text-slate-500 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Mã phiếu
                </TableHead>
                <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  PO liên quan
                </TableHead>
                <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Ngày nhập
                </TableHead>
                <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Trạng thái
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`skel-${i}`}>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={4} className="p-0">
                    <EmptyState
                      icon={AlertCircle}
                      title="Không tải được danh sách phiếu nhập"
                      description={apiErrMessage(
                        error,
                        "Lỗi mạng hoặc máy chủ từ chối yêu cầu.",
                      )}
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
              ) : receipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="p-0">
                    <EmptyState
                      icon={FileText}
                      title="Chưa có phiếu nhập kho"
                      description="Chưa có phiếu nhập nào hoặc không khớp bộ lọc."
                      action={
                        <Button
                          render={<Link href="/inbound/new" />}
                          nativeButton={false}
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          Tạo phiếu nhập đầu tiên
                        </Button>
                      }
                      className="py-10"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                receipts.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono font-medium">
                      {r.receiptNumber}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.poNumber ??
                        (r.purchaseOrderId
                          ? r.purchaseOrderId.slice(0, 8) + "…"
                          : "—")}
                    </TableCell>
                    <TableCell>{r.receivedDate ?? "—"}</TableCell>
                    <TableCell>
                      {r.status ? (
                        <Badge
                          variant="secondary"
                          className={`font-normal ${statusBadgeClass(r.status)}`}
                        >
                          {STATUS_LABEL[r.status] ?? r.status}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination footer */}
        <div className="border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {isLoading ? (
                <span>Đang tải danh sách…</span>
              ) : isError ? (
                <span className="text-rose-600 dark:text-rose-400">
                  Không tải được dữ liệu.
                </span>
              ) : paged ? (
                <span>
                  Hiển thị {receipts.length}/{paged.total_elements} phiếu nhập
                  {paged.total_pages > 1
                    ? ` · Trang ${paged.page + 1}/${paged.total_pages}`
                    : ""}
                </span>
              ) : (
                <span>{receipts.length} bản ghi</span>
              )}
            </div>
            {paged && paged.total_pages > 1 ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canGoPrev || isFetching}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Trước
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canGoNext || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sau
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
