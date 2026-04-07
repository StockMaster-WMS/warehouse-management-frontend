"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { AdvancedFilterActions, AdvancedFilterPanel } from "@/components/features/AdvancedFilters";
import {
  AlertCircle,
  PackagePlus,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { PaginationFooter } from "@/components/ui/pagination-footer";
import { useGetInboundReceiptsQuery } from "@/store/services/inbound.service";
import { useGetWarehousesQuery } from "@/store/services/warehouse.service";
import { apiErrMessage, type PagedResponse } from "@/types/api";
import type { InboundReceipt } from "@/types/inbound-receipt";
import type { Warehouse } from "@/types/warehouse";

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
  const [warehouseId, setWarehouseId] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const {
    data: warehousesRes,
    isLoading: warehousesLoading,
    isError: warehousesIsError,
    refetch: refetchWarehouses,
  } = useGetWarehousesQuery({
    page: 0,
    size: 100,
  });

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetInboundReceiptsQuery({
      page,
      size: 20,
      ...(keyword.trim() ? { keyword: keyword.trim() } : {}),
      ...(status ? { status } : {}),
      ...(warehouseId ? { warehouseId } : {}),
    });

  const receipts = data?.data?.content ?? [];
  const pagedBody = data?.data;
  const warehouses = useMemo(() => warehousesRes?.data?.content ?? [], [warehousesRes]);

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

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (status) count++;
    if (warehouseId) count++;
    return count;
  }, [status, warehouseId]);

  const hasAnyFilter = Boolean(keyword.trim() || activeFiltersCount > 0);

  const clearFilters = () => {
    setKeyword("");
    setStatus("");
    setWarehouseId("");
    setPage(0);
  };

  const findWarehouse = (id: string) => warehouses.find((w: Warehouse) => w.id === id);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Phiếu nhập kho"
        description="Quản lý phiếu nhập kho (GRN) từ đơn nhập hàng."
        actions={
          <Button
            render={<Link href="/inbound/new" />}
            nativeButton={false}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            <PackagePlus className="mr-2 h-4 w-4" />
            Tạo phiếu nhập
          </Button>
        }
      />



      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col">
        <SearchToolbar
          noContainer
          placeholder="Tìm kiếm theo mã phiếu, mã PO..."
          value={keyword}
          onValueChange={(v) => {
            setKeyword(v || "");
            setPage(0);
          }}
          right={
            <AdvancedFilterActions
              open={advancedOpen}
              onToggle={() => setAdvancedOpen(!advancedOpen)}
              activeCount={activeFiltersCount}
              hasAnyFilter={hasAnyFilter}
              onClear={clearFilters}
            />
          }
          filters={
            advancedOpen || activeFiltersCount > 0 ? (
              <AdvancedFilterPanel
                open={advancedOpen}
                summary={
                  activeFiltersCount > 0 ? (
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {status ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                          Trạng thái:{" "}
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {STATUS_LABEL[status] ?? status}
                          </span>
                        </span>
                      ) : null}
                      {warehouseId ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                          Kho:{" "}
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {findWarehouse(warehouseId)?.name ?? "—"}
                          </span>
                        </span>
                      ) : null}
                    </div>
                  ) : null
                }
              >
                <Select
                  value={status}
                  onValueChange={(v) => {
                    setStatus(v || "");
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="h-10 w-full rounded-xl border border-slate-200 bg-white sm:w-42 dark:border-slate-800 dark:bg-slate-900">
                    <SelectValue placeholder="Tất cả trạng thái">
                      {(val) => STATUS_LABEL[val as string] ?? "Tất cả trạng thái"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="" className="rounded-lg">
                      Tất cả trạng thái
                    </SelectItem>
                    {STATUS_OPTIONS.map((st) => (
                      <SelectItem key={st} value={st} className="rounded-lg">
                        {STATUS_LABEL[st] ?? st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={warehouseId}
                  onValueChange={(v) => {
                    setWarehouseId(v || "");
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white sm:max-w-60 sm:w-55 dark:border-slate-800 dark:bg-slate-900">
                    <SelectValue
                      placeholder={
                        warehousesLoading
                          ? "Đang tải kho..."
                          : warehousesIsError
                            ? "Lỗi tải kho"
                            : "Tất cả kho"
                      }
                    >
                      {(val) => {
                        if (!val) return "Tất cả kho";
                        const w = findWarehouse(val as string);
                        return w ? `${w.name} (${w.code || "—"})` : "—";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-72 rounded-xl">
                    {warehousesIsError ? (
                      <div className="px-2 py-1.5 text-xs text-rose-500">
                        Không tải được kho.
                        <button
                          type="button"
                          onClick={() => refetchWarehouses()}
                          className="ml-1 underline"
                        >
                          Thử lại
                        </button>
                      </div>
                    ) : null}
                    <SelectItem value="" className="rounded-lg">
                      Tất cả kho
                    </SelectItem>
                    {warehouses.map((w: Warehouse) => (
                      <SelectItem key={w.id} value={w.id} className="rounded-lg">
                        {w.name} {w.code ? `(${w.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </AdvancedFilterPanel>
            ) : null
          }
        />

        {/* Updated Table UI */}
        <div className="flex-1">
          {isFetching && !isLoading ? (
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-6 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
              Đang cập nhật dữ liệu…
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <Table className="min-w-px text-left border-collapse">
              <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                  <TableHead className="w-[200px] py-4 pl-6 pr-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Mã phiếu</TableHead>
                  <TableHead className="w-[180px] px-3 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">PO liên quan</TableHead>
                  <TableHead className="w-[200px] px-3 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Ngày nhập</TableHead>
                  <TableHead className="w-[180px] px-3 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</TableHead>
                  <TableHead className="w-[150px] py-4 pl-3 pr-6 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={`ske-inb-${i}`} className="border-b border-slate-100 dark:border-slate-800">
                      <TableCell className="py-4 pl-6 pr-3"><Skeleton className="h-4 w-32 rounded" /></TableCell>
                      <TableCell className="px-3 py-4"><Skeleton className="h-4 w-24 rounded" /></TableCell>
                      <TableCell className="px-3 py-4"><Skeleton className="h-4 w-32 rounded" /></TableCell>
                      <TableCell className="px-3 py-4"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell className="py-4 pl-3 pr-6 text-right"><Skeleton className="ml-auto h-8 w-20 rounded-lg" /></TableCell>
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12">
                      <EmptyState
                        icon={AlertCircle}
                        title="Không tải được danh sách phiếu nhập"
                        description={apiErrMessage(error, "Lỗi mạng hoặc máy chủ từ chối yêu cầu.")}
                        action={<Button variant="outline" size="sm" onClick={() => refetch()}>Thử lại</Button>}
                      />
                    </TableCell>
                  </TableRow>
                ) : receipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12">
                      <EmptyState
                        icon={FileText}
                        title="Chưa có phiếu nhập"
                        description="Chưa có phiếu nhập kho nào hoặc không khớp với kết quả tìm kiếm."
                        action={
                          <Button render={<Link href="/inbound/new" />} nativeButton={false} size="sm" className="bg-indigo-600">
                            Tạo phiếu đầu tiên
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  receipts.map((r) => (
                    <TableRow
                      key={r.id}
                      className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <TableCell className="py-4 pl-6 pr-3 font-semibold text-slate-700 dark:text-slate-200">{r.receiptNumber}</TableCell>
                      <TableCell className="px-3 py-4 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                        {r.poNumber ?? "—"}
                      </TableCell>
                      <TableCell className="px-3 py-4 text-slate-600 dark:text-slate-400">{r.receivedDate ?? "—"}</TableCell>
                      <TableCell className="px-3 py-4">
                        <Badge
                          variant="secondary"
                          className={cn("px-2.5 py-0.5 font-bold text-[11px] rounded-md border-0 shadow-none", statusBadgeClass(r.status))}
                        >
                          {STATUS_LABEL[r.status ?? ""] ?? r.status ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 pl-3 pr-6 text-right">
                        <Button
                          render={<Link href={`/inbound/${r.id}`} />}
                          nativeButton={false}
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-xs font-bold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950/30 dark:text-indigo-400"
                        >
                          Chi tiết
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <PaginationFooter
          itemLabel="phiếu nhập"
          rowsCount={receipts.length}
          page={page}
          totalElements={paged?.total_elements ?? receipts.length}
          totalPages={paged?.total_pages ?? 1}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          isLoading={isLoading}
          isError={isError}
          isFetching={isFetching}
          errorText="Không tải được dữ liệu."
          onPrevPage={() => setPage((p) => Math.max(0, p - 1))}
          onNextPage={() => setPage((p) => p + 1)}
          pageSize={paged?.size ?? 20}
        />
      </div>
    </div>
  );
}
