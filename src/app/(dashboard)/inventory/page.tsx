"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  Boxes,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  RefreshCcw,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { FilterGroup } from "@/components/features/FilterGroup";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  useGetWarehousesQuery,
  useGetWarehouseSummaryQuery,
} from "@/store/services/warehouse.service";
import type { SortDirection, WarehouseSortField } from "@/types/warehouse";
import { apiErrMessage } from "@/types/api";

const STATUS_LABEL_ALL = "Tất cả trạng thái";
const STATUS_LABEL_ACTIVE = "Đang hoạt động";
const STATUS_LABEL_INACTIVE = "Ngừng hoạt động";

const SORT_FIELD_LABELS: Record<string, WarehouseSortField> = {
  "Ngày tạo": "createdAt",
  "Tên kho": "name",
  "Mã kho": "code",
  "Trạng thái": "isActive",
};

const SORT_FIELD_OPTIONS = Object.keys(SORT_FIELD_LABELS);

const SORT_DIR_LABELS: Record<string, SortDirection> = {
  "Tăng dần": "asc",
  "Giảm dần": "desc",
};

const SORT_DIR_OPTIONS = Object.keys(SORT_DIR_LABELS);

const PAGE_SIZE = 20;

export default function InventoryPage() {
  const {
    data: summaryResponse,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    refetch: refetchSummary,
    isFetching: isSummaryFetching,
  } = useGetWarehouseSummaryQuery();

  const summary = summaryResponse?.data;

  const [searchInput, setSearchInput] = useState("");
  const debouncedKeyword = useDebouncedValue(searchInput.trim());
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(PAGE_SIZE);
  const [sort, setSort] = useState<WarehouseSortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    setPage(0);
  }, [debouncedKeyword, isActive, sort, sortDir]);

  const listParams = useMemo(
    () => ({
      page,
      size,
      sort,
      sortDir,
      keyword: debouncedKeyword || undefined,
      isActive,
    }),
    [page, size, sort, sortDir, debouncedKeyword, isActive],
  );

  const { data, error, isLoading, isFetching, refetch } =
    useGetWarehousesQuery(listParams);

  const warehouses = useMemo(() => data?.data?.content ?? [], [data]);
  const totalElements = data?.data?.total_elements ?? 0;
  const totalPages = data?.data?.total_pages ?? 0;

  const statusValue =
    isActive === true
      ? STATUS_LABEL_ACTIVE
      : isActive === false
        ? STATUS_LABEL_INACTIVE
        : STATUS_LABEL_ALL;

  const sortValue =
    SORT_FIELD_OPTIONS.find((label) => SORT_FIELD_LABELS[label] === sort) ??
    "Ngày tạo";

  const sortDirValue =
    SORT_DIR_OPTIONS.find((label) => SORT_DIR_LABELS[label] === sortDir) ??
    "Giảm dần";

  const hasAnyFilter =
    searchInput.trim().length > 0 ||
    typeof isActive === "boolean" ||
    sort !== "createdAt" ||
    sortDir !== "desc";

  const clearFilters = () => {
    setSearchInput("");
    setIsActive(undefined);
    setSort("createdAt");
    setSortDir("desc");
    setPage(0);
    setSize(PAGE_SIZE);
  };

  const stats = useMemo(() => {
    const listDerivedTotal = warehouses.length;
    const listDerivedActive = warehouses.filter((w) => w.isActive).length;
    const listDerivedInactive = Math.max(0, listDerivedTotal - listDerivedActive);
    const listWithStock = warehouses.filter((w) => (w.fillRatePercent ?? 0) > 0).length;
    const listHighFill = warehouses.filter((w) => (w.fillRatePercent ?? 0) >= 90).length;

    const totalWarehouses =
      summary?.totalWarehouses ??
      (totalElements > 0 ? totalElements : listDerivedTotal);
    const activeWarehouses = summary?.activeWarehouses ?? listDerivedActive;
    const inactiveWarehouses = summary?.inactiveWarehouses ?? listDerivedInactive;
    const warehousesWithStock = summary?.warehousesWithStock ?? listWithStock;
    const highFillRateWarehouses = summary?.highFillRateWarehouses ?? listHighFill;

    return [
      {
        label: "Tổng số kho",
        value: String(totalWarehouses),
        icon: CheckCircle2,
      },
      {
        label: "Kho đang hoạt động",
        value: String(activeWarehouses),
        icon: Boxes,
      },
      {
        label: "Kho ngừng hoạt động",
        value: String(inactiveWarehouses),
        icon: AlertTriangle,
      },
      {
        label: "Kho có tồn hàng",
        value: String(warehousesWithStock),
        icon: Boxes,
      },
      {
        label: "Kho lấp đầy cao",
        value: String(highFillRateWarehouses),
        icon: AlertTriangle,
      },
    ];
  }, [summary, warehouses, totalElements]);

  const avgFillRate = useMemo(() => {
    if (warehouses.length === 0) return 0;
    const sum = warehouses.reduce((acc, w) => acc + Number(w.fillRatePercent ?? 0), 0);
    return Math.round(sum / warehouses.length);
  }, [warehouses]);

  const paginationMeta = useMemo(() => {
    if (warehouses.length === 0) {
      return { from: 0, to: 0 };
    }
    const from = page * size + 1;
    const to = page * size + warehouses.length;
    return { from, to };
  }, [page, size, warehouses.length]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Theo dõi tồn kho"
        description="Tổng quan tình trạng hàng hóa và biến động kho theo thời gian thực."
        actions={
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => {
              refetch();
              refetchSummary();
            }}
            disabled={isFetching || isSummaryFetching}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            {isFetching || isSummaryFetching ? "Đang làm mới..." : "Làm mới số liệu"}
          </Button>
        }
      />

      {isSummaryError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
          Chưa tải được số liệu tổng hợp kho. Hệ thống đang dùng dữ liệu fallback từ danh sách hiện tại.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat, i) => {
          const displayValue =
            isSummaryLoading || isSummaryError ? "--" : stat.value;

          return (
            <StatCard
              key={i}
              label={stat.label}
              value={displayValue}
              icon={stat.icon}
              className="rounded-2xl"
              accentClassName="bg-indigo-500"
            />
          );
        })}
      </div>

      <SearchToolbar
        placeholder="Tìm mã kho, tên khu vực..."
        value={searchInput}
        onValueChange={setSearchInput}
        filters={
          <FilterGroup
            hasAnyFilter={hasAnyFilter}
            onClear={clearFilters}
            filters={[
              {
                label: "trạng thái",
                placeholder: "Trạng thái",
                value: statusValue,
                onChange: (value) => {
                  if (value === STATUS_LABEL_ACTIVE) {
                    setIsActive(true);
                    return;
                  }
                  if (value === STATUS_LABEL_INACTIVE) {
                    setIsActive(false);
                    return;
                  }
                  setIsActive(undefined);
                },
                options: [STATUS_LABEL_ACTIVE, STATUS_LABEL_INACTIVE],
                width: "sm:w-[180px]",
              },
              {
                label: "sắp xếp",
                placeholder: "Sắp xếp",
                value: sortValue,
                onChange: (value) =>
                  setSort(SORT_FIELD_LABELS[value] ?? "createdAt"),
                options: SORT_FIELD_OPTIONS,
                width: "sm:w-[170px]",
              },
              {
                label: "thứ tự",
                placeholder: "Thứ tự",
                value: sortDirValue,
                onChange: (value) =>
                  setSortDir(SORT_DIR_LABELS[value] ?? "desc"),
                options: SORT_DIR_OPTIONS,
                width: "sm:w-[150px]",
              },
            ]}
          />
        }
      />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {isFetching && !isLoading ? (
          <p className="border-b border-slate-100 bg-slate-50 px-6 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
            Đang cập nhật dữ liệu...
          </p>
        ) : null}

        {!isLoading && !error ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
            <span>
              Tỷ lệ lấp đầy trung bình (trang hiện tại):{" "}
              <span className="font-bold">{avgFillRate}%</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => {
                refetch();
                refetchSummary();
              }}
            >
              <RefreshCcw className="mr-1 h-3.5 w-3.5" />
              Cập nhật
            </Button>
          </div>
        ) : null}

        <Table className="text-left">
          <TableHeader className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 text-xs font-semibold text-slate-500 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
            <TableRow>
              <TableHead className="w-14 px-4 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                STT
              </TableHead>
              <TableHead className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Kho
              </TableHead>
              <TableHead className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Địa chỉ
              </TableHead>
              <TableHead className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Quản lý
              </TableHead>
              <TableHead className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Trạng thái
              </TableHead>
              <TableHead className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Lấp đầy
              </TableHead>
              <TableHead className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Zones / Bins
              </TableHead>
              <TableHead className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Chi tiết
              </TableHead>
              <TableHead className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Cập nhật
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <TableRow key={`inventory-loading-${idx}`}>
                  <TableCell className="px-4 py-4 text-center">
                    <Skeleton className="mx-auto h-5 w-6 rounded" />
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-52" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Skeleton className="h-3 w-44" />
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Skeleton className="h-3 w-28" />
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <Skeleton className="mx-auto h-5 w-24 rounded-full" />
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <Skeleton className="mx-auto h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <Skeleton className="mx-auto h-4 w-24" />
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <Skeleton className="ml-auto h-8 w-24 rounded-md" />
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <Skeleton className="ml-auto h-3 w-20" />
                  </TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={9} className="p-0">
                  <EmptyState
                    icon={AlertCircle}
                    title="Không thể tải dữ liệu tồn kho"
                    description={apiErrMessage(error, "Đã xảy ra lỗi khi tải dữ liệu tồn kho.")}
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
            ) : warehouses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="p-0">
                  <EmptyState
                    icon={Boxes}
                    title={
                      hasAnyFilter
                        ? "Không có dữ liệu phù hợp"
                        : "Lịch sử tồn kho trống"
                    }
                    description={
                      hasAnyFilter
                        ? "Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
                        : "Hiện chưa có dữ liệu tồn kho nào được ghi nhận."
                    }
                    action={
                      hasAnyFilter ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearFilters}
                        >
                          Xóa lọc
                        </Button>
                      ) : null
                    }
                    className="h-64 sm:h-80"
                  />
                </TableCell>
              </TableRow>
            ) : (
              warehouses.map((warehouse, idx) => (
                <TableRow
                  key={warehouse.id}
                  className="group transition-colors odd:bg-white even:bg-slate-50/40 hover:bg-indigo-50/40 dark:odd:bg-slate-900 dark:even:bg-slate-900/70 dark:hover:bg-slate-800/70"
                >
                  <TableCell className="px-4 py-4 text-center">
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-slate-100 px-1 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      {page * size + idx + 1}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="max-w-65 truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {warehouse.name}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">
                        Mã kho: {warehouse.code || "--"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-slate-600 dark:text-slate-200">
                    {warehouse.address || "Chưa cập nhật"}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-slate-600 dark:text-slate-200">
                    {warehouse.managerName ?? "--"}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        warehouse.isActive
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {warehouse.isActive
                        ? "Đang hoạt động"
                        : "Ngừng hoạt động"}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        (warehouse.fillRatePercent ?? 0) >= 90
                          ? "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                          : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300"
                      }`}
                    >
                      {Math.max(0, Math.round(warehouse.fillRatePercent ?? 0))}%
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center text-xs text-slate-600 dark:text-slate-300">
                    {warehouse.zonesCount ?? 0} / {warehouse.binsCount ?? 0}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <Button
                      render={<Link href={`/warehouses/${warehouse.id}/edit`} />}
                      nativeButton={false}
                      variant="outline"
                      size="sm"
                      className="h-8 border-slate-200 text-xs"
                    >
                      Xem chi tiết
                      <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right text-xs font-medium text-slate-500">
                    {warehouse.updatedAt
                      ? new Date(warehouse.updatedAt).toLocaleDateString(
                          "vi-VN",
                        )
                      : warehouse.createdAt
                        ? new Date(warehouse.createdAt).toLocaleDateString(
                            "vi-VN",
                          )
                        : "--"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {!isLoading && !error ? (
          <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {paginationMeta.from}-{paginationMeta.to}
              </span>{" "}
              / {totalElements} kho
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1 dark:border-slate-800 dark:bg-slate-900">
                <span className="text-xs font-medium text-slate-500">
                  Số dòng
                </span>
                <Select
                  value={String(size)}
                  onValueChange={(value) => {
                    setSize(Number(value));
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="h-8 min-w-18 border-0 px-1 text-xs shadow-none focus-visible:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {[10, 20, 50, 100].map((value) => (
                      <SelectItem key={value} value={String(value)}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page <= 0 || totalPages === 0 || isFetching}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  {totalPages === 0 ? 0 : page + 1}/{totalPages}
                  {isFetching ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : null}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3"
                  onClick={() => setPage(page + 1)}
                  disabled={
                    totalPages === 0 || page + 1 >= totalPages || isFetching
                  }
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
