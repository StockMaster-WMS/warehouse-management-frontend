"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  Boxes,
  ChevronDown,
  ChevronUp,
  Filter,
  History,
  Plus,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { apiErrMessage } from "@/types/api";
import { useGetWarehousesQuery } from "@/store/services/warehouse.service";
import { useGetStockListQuery } from "@/store/services/stock.service";
import type { StockExpanded } from "@/types/stock";

type InventoryRow = {
  id: string;
  name: string;
  sku: string;
  locationCode: string;
  qtyOnHand: number;
  qtyAvailable: number;
  minQty: number;
  maxQty?: number | null;
  unitPrice?: number | null;
  nearExpiry?: boolean;
  warehouseCode?: string | null;
  lotNumber?: string | null;
  expiryDate?: string | null;
};

const PAGE_SIZE = 12;

function inventoryStatus(row: InventoryRow): "SAFE" | "LOW" | "OVER" {
  if (row.qtyAvailable < row.minQty) return "LOW";
  const max = row.maxQty ?? null;
  if (typeof max === "number" && Number.isFinite(max) && max > 0 && row.qtyOnHand > max) return "OVER";
  return "SAFE";
}

function statusLabel(s: "SAFE" | "LOW" | "OVER"): string {
  if (s === "LOW") return "Sắp hết hàng";
  if (s === "OVER") return "Vượt định mức";
  return "An toàn";
}

function statusBadgeVariant(s: "SAFE" | "LOW" | "OVER") {
  if (s === "LOW") return "destructive";
  if (s === "OVER") return "secondary";
  return "outline";
}

function statusBadgeClassName(s: "SAFE" | "LOW" | "OVER") {
  if (s === "OVER") {
    return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20";
  }
  if (s === "SAFE") {
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
  }
  return undefined;
}

function isNearExpiry(expiryDate: string | null | undefined, thresholdDays = 30): boolean {
  if (!expiryDate) return false;
  const end = new Date(expiryDate);
  if (Number.isNaN(end.getTime())) return false;
  const now = new Date();
  const diffDays = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= thresholdDays;
}

function toInventoryRow(s: StockExpanded): InventoryRow {
  const name = s.product?.name ?? "—";
  const sku = s.product?.sku ?? s.productId;
  const locationCode = s.location?.code ?? s.locationId;
  const minQty = Number(s.product?.minQty ?? 0);
  return {
    id: s.id,
    name,
    sku,
    locationCode,
    qtyOnHand: s.qtyOnHand,
    qtyAvailable: s.qtyAvailable,
    minQty,
    maxQty: s.product?.maxQty ?? null,
    unitPrice: s.product?.unitPrice ?? null,
    nearExpiry: isNearExpiry(s.expiryDate),
    warehouseCode: s.warehouse?.code ?? null,
    lotNumber: s.lotNumber ?? null,
    expiryDate: s.expiryDate ?? null,
  };
}

function InventoryTableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={`inv-sk-${i}`}>
          <TableCell className="px-3 py-3 text-center">
            <Skeleton className="mx-auto h-4 w-6" />
          </TableCell>
          <TableCell className="px-3 py-3">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="mt-2 h-3 w-32" />
          </TableCell>
          <TableCell className="px-3 py-3"><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell className="px-3 py-3 text-center"><Skeleton className="mx-auto h-4 w-16" /></TableCell>
          <TableCell className="px-3 py-3 text-center"><Skeleton className="mx-auto h-4 w-16" /></TableCell>
          <TableCell className="px-3 py-3 text-center"><Skeleton className="mx-auto h-5 w-28 rounded-full" /></TableCell>
          <TableCell className="px-3 py-3 text-right"><Skeleton className="ml-auto h-8 w-20 rounded-lg" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default function InventoryPage() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedKeyword = useDebouncedValue(searchInput.trim());
  const [warehouseId, setWarehouseId] = useState("");
  const [page, setPage] = useState(0);

  const [reason, setReason] = useState("Kiểm kê");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const { data: warehousesData, isLoading: warehousesLoading, error: warehousesError, refetch: refetchWarehouses } =
    useGetWarehousesQuery({ page: 0, size: 200, sort: "createdAt", sortDir: "desc" });
  const warehouseOptions = useMemo(() => warehousesData?.data?.content ?? [], [warehousesData]);

  const { data, error, isLoading, isFetching, refetch } = useGetStockListQuery({
    page,
    size: PAGE_SIZE,
    sort: "updatedAt",
    sortDir: "desc",
    warehouseId: warehouseId || undefined,
    keyword: debouncedKeyword || undefined,
  });

  const stocks = useMemo(() => data?.data?.content ?? [], [data]);
  const rows = useMemo(() => stocks.map(toInventoryRow), [stocks]);

  const totalElements = data?.data?.total_elements ?? 0;
  const totalPages = data?.data?.total_pages ?? 0;
  const canGoPrev = page > 0;
  const canGoNext = totalPages > 0 && page < totalPages - 1;

  const hasAnyFilter = searchInput.trim().length > 0 || Boolean(warehouseId) || reason !== "Kiểm kê";
  const activeAdvancedFiltersCount = Number(Boolean(warehouseId)) + Number(reason !== "Kiểm kê");

  const clearFilters = () => {
    setSearchInput("");
    setWarehouseId("");
    setReason("Kiểm kê");
    setPage(0);
    setAdvancedOpen(false);
  };

  const summary = useMemo(() => {
    const totalItems = rows.length;
    const warningLowOrExpiry = rows.filter((r) => inventoryStatus(r) === "LOW" || r.nearExpiry).length;
    const warningOver = rows.filter((r) => inventoryStatus(r) === "OVER").length;
    const totalQtyOnHand = rows.reduce((sum, r) => sum + r.qtyOnHand, 0);
    return { totalItems, warningLowOrExpiry, warningOver, totalQtyOnHand };
  }, [rows]);

  const warehouseSelect = (
    <Select
      value={warehouseId}
      onValueChange={(v) => {
        setWarehouseId(v ?? "");
        setPage(0);
      }}
    >
      <SelectTrigger className="h-10 w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:w-60:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80">
        <SelectValue
          placeholder={warehousesLoading ? "Đang tải kho..." : warehousesError ? "Lỗi tải kho" : "Chọn kho"}
        >
          {(val) => {
            if (!val) return "Tất cả kho";
            const w = warehouseOptions.find((x) => x.id === val);
            return w ? `${w.name} ${w.code ? `(${w.code})` : ""}` : "Đang tải…";
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-72 rounded-xl border border-slate-200 shadow-xl dark:border-slate-800">
        {warehousesError ? (
          <div className="px-2 py-1.5 text-xs text-rose-500">
            Không tải được danh sách kho.
            <button type="button" onClick={() => refetchWarehouses()} className="ml-1 underline">
              Thử lại
            </button>
          </div>
        ) : null}
        <SelectItem value="" className="rounded-lg focus:bg-indigo-50 focus:text-indigo-600 dark:focus:bg-indigo-500/10 dark:focus:text-indigo-400">
          Tất cả kho
        </SelectItem>
        {warehouseOptions.map((w) => (
          <SelectItem
            key={w.id}
            value={w.id}
            className="rounded-lg focus:bg-indigo-50 focus:text-indigo-600 dark:focus:bg-indigo-500/10 dark:focus:text-indigo-400"
          >
            {w.name} {w.code ? `(${w.code})` : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Theo dõi tồn kho"
        description="Giám sát tồn kho, cảnh báo và điều chỉnh nhanh theo SKU."
        actions={
          <Button
            render={<Link href="/purchase-orders/new" />}
            nativeButton={false}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tạo Phiếu Kiểm Kê
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tổng số mặt hàng" value={summary.totalItems.toString()} icon={Boxes} />
        <StatCard
          label="Cảnh báo (sắp hết / sắp hết hạn)"
          value={summary.warningLowOrExpiry.toString()}
          icon={AlertTriangle}
          accentClassName="bg-rose-600"
          className="ring-1 ring-rose-200/50"
        />
        <StatCard
          label="Cảnh báo (vượt định mức)"
          value={summary.warningOver.toString()}
          icon={AlertTriangle}
          accentClassName="bg-amber-500"
          className="ring-1 ring-amber-200/50"
        />
        <StatCard
          label="Tổng tồn (trên trang)"
          value={summary.totalQtyOnHand.toString()}
          icon={Wallet}
        />
      </div>

      <SearchToolbar
        placeholder="Tìm theo tên/SKU/vị trí… (có thể quét mã vạch)"
        value={searchInput}
        onValueChange={(value) => {
          setSearchInput(value);
          setPage(0);
        }}
        right={
          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 rounded-xl border-slate-200"
              onClick={() => setAdvancedOpen((v) => !v)}
              aria-expanded={advancedOpen}
            >
              <Filter className="mr-2 h-4 w-4 text-indigo-500" />
              Bộ lọc nâng cao
              {activeAdvancedFiltersCount > 0 ? (
                <span className="ml-2 rounded-full bg-indigo-600/10 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                  {activeAdvancedFiltersCount}
                </span>
              ) : null}
              {advancedOpen ? (
                <ChevronUp className="ml-2 h-4 w-4 text-slate-500" />
              ) : (
                <ChevronDown className="ml-2 h-4 w-4 text-slate-500" />
              )}
            </Button>

            {hasAnyFilter ? (
              <Button
                type="button"
                variant="ghost"
                className="h-11 rounded-xl px-4 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                onClick={clearFilters}
              >
                <X className="mr-2 h-4 w-4" />
                Xoá lọc
              </Button>
            ) : null}
          </div>
        }
        filters={
          <div className="w-full space-y-3">
            {!advancedOpen && activeAdvancedFiltersCount > 0 ? (
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                {warehouseId ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                    Kho:{" "}
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {warehouseOptions.find((x) => x.id === warehouseId)?.code ??
                        warehouseOptions.find((x) => x.id === warehouseId)?.name ??
                        "—"}
                    </span>
                  </span>
                ) : null}
                {reason !== "Kiểm kê" ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                    Lý do:{" "}
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{reason}</span>
                  </span>
                ) : null}
              </div>
            ) : null}

            {advancedOpen ? (
              <div className="flex w-full flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
                {warehouseSelect}

                <Select
                  value={reason}
                  onValueChange={(v) => {
                    setReason(v ?? "Kiểm kê");
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="h-10 w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:w-55 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80">
                    <SelectValue placeholder="Lý do điều chỉnh" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-slate-200 shadow-xl dark:border-slate-800">
                    <SelectItem value="Kiểm kê" className="rounded-lg focus:bg-indigo-50 focus:text-indigo-600 dark:focus:bg-indigo-500/10 dark:focus:text-indigo-400">
                      Kiểm kê
                    </SelectItem>
                    <SelectItem value="Hư hỏng" className="rounded-lg focus:bg-indigo-50 focus:text-indigo-600 dark:focus:bg-indigo-500/10 dark:focus:text-indigo-400">
                      Hư hỏng
                    </SelectItem>
                    <SelectItem value="Thất thoát" className="rounded-lg focus:bg-indigo-50 focus:text-indigo-600 dark:focus:bg-indigo-500/10 dark:focus:text-indigo-400">
                      Thất thoát
                    </SelectItem>
                    <SelectItem value="Khác" className="rounded-lg focus:bg-indigo-50 focus:text-indigo-600 dark:focus:bg-indigo-500/10 dark:focus:text-indigo-400">
                      Khác
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isFetching && !isLoading ? (
          <p className="border-b border-slate-100 bg-slate-50 px-6 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
            Đang cập nhật dữ liệu...
          </p>
        ) : null}
        <div className="overflow-x-auto">
          <Table className="min-w-245 text-left">
            <TableHeader className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 text-xs font-semibold text-slate-500 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
              <TableRow>
                <TableHead className="w-12 px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  STT
                </TableHead>
                <TableHead className="min-w-70 px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Thông tin hàng hóa
                </TableHead>
                <TableHead className="w-35 px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Vị trí
                </TableHead>
                <TableHead className="w-35 px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Tồn thực tế
                </TableHead>
                <TableHead className="w-35 px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Khả dụng
                </TableHead>
                <TableHead className="w-42.5 px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Trạng thái
                </TableHead>
                <TableHead className="w-30 px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <InventoryTableSkeleton />
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      icon={AlertCircle}
                      title="Không thể tải dữ liệu tồn kho"
                      description={apiErrMessage(error, "Đã xảy ra lỗi khi tải danh sách tồn kho.")}
                      action={
                        <Button variant="outline" size="sm" onClick={() => refetch()}>
                          Thử lại
                        </Button>
                      }
                      className="py-10"
                    />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      icon={Boxes}
                      title={debouncedKeyword ? "Không có mặt hàng khớp tìm kiếm" : "Chưa có dữ liệu tồn kho"}
                      description={
                        debouncedKeyword
                          ? "Thử đổi từ khóa hoặc kiểm tra lại SKU/vị trí."
                          : "Kết nối API tồn kho để hiển thị dữ liệu thực tế."
                      }
                      action={
                        debouncedKeyword ? (
                          <Button variant="outline" size="sm" onClick={() => setSearchInput("")}>
                            Xóa tìm kiếm
                          </Button>
                        ) : (
                          <Button
                            render={<Link href="/products" />}
                            nativeButton={false}
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700"
                          >
                            Đi tới Sản phẩm
                          </Button>
                        )
                      }
                      className="py-10"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => {
                  const status = inventoryStatus(row);
                  const isLow = status === "LOW";
                  const isOver = status === "OVER";
                  return (
                    <TableRow
                      key={row.id}
                      className={cn(
                        "group transition-colors",
                        "odd:bg-white even:bg-slate-50/40 hover:bg-indigo-50/40 dark:odd:bg-slate-900 dark:even:bg-slate-900/70 dark:hover:bg-slate-800/70",
                        isLow ? "animate-[pulse_2.2s_ease-in-out_infinite]" : null,
                      )}
                    >
                      <TableCell className="px-3 py-3 text-center">
                        <span className="tabular-nums text-xs font-medium text-slate-500 dark:text-slate-400">
                          {page * PAGE_SIZE + index + 1}
                        </span>
                      </TableCell>

                      <TableCell className="px-3 py-3">
                        <div className="space-y-0.5">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">
                            {row.name}
                          </div>
                          <div className="text-xs font-medium text-slate-500 dark:text-slate-300">
                            <span className="mr-2">{row.sku}</span>
                            {row.lotNumber ? (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {row.lotNumber}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-3 py-3">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {row.locationCode}
                        </span>
                      </TableCell>

                      <TableCell className="px-3 py-3 text-center">
                        <span
                          className={cn(
                            "tabular-nums text-sm font-semibold",
                            isOver ? "text-amber-700 dark:text-amber-300" : "text-slate-800 dark:text-slate-100",
                          )}
                        >
                          {row.qtyOnHand}
                        </span>
                      </TableCell>

                      <TableCell className="px-3 py-3 text-center">
                        <span
                          className={cn(
                            "tabular-nums text-sm font-semibold",
                            isLow ? "text-rose-600 dark:text-rose-400" : "text-slate-800 dark:text-slate-100",
                          )}
                        >
                          {row.qtyAvailable}
                        </span>
                      </TableCell>

                      <TableCell className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Badge
                            variant={statusBadgeVariant(status)}
                            className={cn(statusBadgeClassName(status))}
                          >
                            {statusLabel(status)}
                          </Badge>
                          {row.nearExpiry ? (
                            <Badge variant="destructive" className="bg-rose-600/10 text-rose-700 dark:text-rose-300 border-rose-500/20">
                              Sắp hết hạn
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell className="px-3 py-3 text-right">
                        <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-slate-600 hover:text-indigo-700"
                            onClick={() => toast.message("Demo: mở lịch sử thẻ kho")}
                            aria-label="Xem lịch sử (thẻ kho)"
                          >
                            <History className="h-4 w-4" />
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
          itemLabel="mặt hàng"
          rowsCount={rows.length}
          page={page}
          totalElements={totalElements}
          totalPages={totalPages}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          isFetching={isFetching}
          onPrevPage={() => setPage((p) => Math.max(0, p - 1))}
          onNextPage={() => setPage((p) => p + 1)}
          pageSize={PAGE_SIZE}
        />
      </div>
    </div>
  );
}
