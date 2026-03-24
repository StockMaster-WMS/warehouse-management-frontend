"use client";

import { useMemo, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  Plus,
  Truck,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  ArrowDownLeft,
  Calendar,
  Building2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { FilterGroup } from "@/components/features/FilterGroup";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { useGetInboundReceiptsQuery } from "@/store/services/inbound.service";
import { apiErrMessage, type PagedResponse } from "@/types/api";
import type { InboundReceipt } from "@/types/inbound-receipt";
import { inboundStatusLabel, inboundStatusColor } from "@/types/inbound-receipt";

const PAGE_SIZE = 20;

const STATUS_FILTER_OPTIONS = [
  { label: "Đang chờ hàng", value: "PENDING" },
  { label: "Đang nhận hàng", value: "PROCESSING" },
  { label: "Hoàn thành", value: "COMPLETED" },
];

export default function InboundPage() {
  const [query, setQuery] = useState("");
  const debouncedKeyword = useDebouncedValue(query.trim());
  const [statusFilter, setStatusFilter] = useState("Tất cả trạng thái");
  const [page, setPage] = useState(0);

  const apiStatus = STATUS_FILTER_OPTIONS.find((o) => o.label === statusFilter)?.value ?? "";

  const { data, isLoading, isFetching, isError, error, refetch } = useGetInboundReceiptsQuery({
    page,
    size: PAGE_SIZE,
    ...(debouncedKeyword ? { keyword: debouncedKeyword } : {}),
    ...(apiStatus ? { status: apiStatus } : {}),
  });

  const pagedBody = data?.data;
  const rows = useMemo(() => pagedBody?.content ?? [], [pagedBody]);

  const paged = useMemo((): Pick<
    PagedResponse<InboundReceipt>,
    "page" | "size" | "total_elements" | "total_pages"
  > | null => {
    if (!pagedBody || typeof pagedBody.page !== "number" || typeof pagedBody.total_pages !== "number") return null;
    return {
      page: pagedBody.page,
      size: pagedBody.size,
      total_elements: pagedBody.total_elements,
      total_pages: pagedBody.total_pages,
    };
  }, [pagedBody]);

  const canGoPrev = page > 0;
  const canGoNext = paged != null && paged.total_pages > 0 && page < paged.total_pages - 1;

  const hasAnyFilter = query.trim().length > 0 || statusFilter !== "Tất cả trạng thái";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhập hàng"
        description="Điều phối hàng về, kiểm đếm chất lượng và phân phối vị trí lưu kho."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex border-slate-200">
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Kiểm hàng nhanh
            </Button>
            <Button
              render={<Link href="/inbound/new" />}
              nativeButton={false}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tạo phiếu nhập
            </Button>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Chờ xác nhận", value: "—", icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Đang kiểm hàng", value: "—", icon: Truck, color: "text-indigo-500", bg: "bg-indigo-50" },
          { label: "Hoàn thành hôm nay", value: "—", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} ${stat.color} dark:bg-slate-800`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <SearchToolbar
        placeholder="Tìm mã phiếu, nhà cung cấp..."
        value={query}
        onValueChange={setQuery}
        filters={
          <FilterGroup
            hasAnyFilter={hasAnyFilter}
            onClear={() => {
              setQuery("");
              setStatusFilter("Tất cả trạng thái");
            }}
            filters={[
              {
                label: "trạng thái",
                placeholder: "Trạng thái",
                value: statusFilter,
                onChange: setStatusFilter,
                options: STATUS_FILTER_OPTIONS.map((o) => o.label),
                width: "sm:w-[180px]",
              },
            ]}
          />
        }
      />

      {/* Table Section */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {isFetching && !isLoading ? (
          <p className="border-b border-slate-100 bg-slate-50 px-6 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
            Đang cập nhật dữ liệu…
          </p>
        ) : null}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-900/50">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Mã phiếu & Loại</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Nhà cung cấp</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Ngày dự kiến</th>
                <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">Tiến độ nhận</th>
                <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, rowIndex) => (
                  <tr key={`inbound-skeleton-${rowIndex}`} className="hover:bg-transparent">
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="mt-2 h-3 w-20" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-3 w-40" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-3 w-24" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="mx-auto h-3 w-28" />
                      <Skeleton className="mx-auto mt-2 h-1.5 w-full max-w-[120px]" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Skeleton className="mx-auto h-5 w-20 rounded-full" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Skeleton className="ml-auto h-8 w-8 rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <EmptyState
                      icon={AlertCircle}
                      title="Không tải được danh sách"
                      description={apiErrMessage(error)}
                      action={
                        <Button variant="outline" size="sm" onClick={() => refetch()}>
                          Thử lại
                        </Button>
                      }
                      className="py-10"
                    />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <EmptyState
                      icon={ArrowDownLeft}
                      title="Chưa có phiếu nhập"
                      description={
                        hasAnyFilter
                          ? "Không có kết quả khớp tìm kiếm. Thử từ khóa khác."
                          : "Tạo phiếu nhập mới hoặc kiểm tra dữ liệu trên server."
                      }
                      className="py-10"
                    />
                  </td>
                </tr>
              ) : (
                rows.map((slip: InboundReceipt) => {
                  const total = slip.totalItems ?? 0;
                  const received = slip.receivedItems ?? 0;
                  const pct = total > 0 ? Math.round((received / total) * 100) : 0;

                  return (
                    <tr key={slip.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{slip.code}</span>
                          <span className="text-[10px] font-bold text-indigo-500 uppercase mt-1 flex items-center gap-1">
                            <ArrowDownLeft className="h-3 w-3" />
                            {slip.type ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{slip.supplierName ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {slip.expectedDate ?? "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-1.5 min-w-[120px]">
                          <div className="flex w-full items-center justify-between text-[10px] font-bold text-slate-500">
                            <span>{received}/{total} SP</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className={`h-full transition-all ${slip.status === "COMPLETED" ? "bg-emerald-500" : "bg-indigo-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${inboundStatusColor(slip.status)}`}>
                          {inboundStatusLabel(slip.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon-sm" className="h-8 w-8 rounded-lg">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-48 rounded-xl">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                            </DropdownMenuGroup>
                            <DropdownMenuItem className="rounded-lg">
                              <ChevronRight className="mr-2 h-4 w-4" />
                              Chi tiết phiếu
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-lg">
                              <ClipboardCheck className="mr-2 h-4 w-4" />
                              Bắt đầu kiểm hàng
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-lg text-rose-600 focus:text-rose-600">
                              Hủy phiếu nhập
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <div className="border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {isLoading ? (
                  <span>Đang tải danh sách…</span>
                ) : isError ? (
                  <span className="text-rose-600 dark:text-rose-400">Không tải được dữ liệu trang này.</span>
                ) : paged ? (
                  <span>
                    Hiển thị {rows.length}/{paged.total_elements} phiếu nhập
                    {paged.total_pages > 1
                      ? ` · Trang ${paged.page + 1}/${paged.total_pages}`
                      : ""}
                  </span>
                ) : (
                  <span>{rows.length} bản ghi</span>
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
    </div>
  );
}
