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
  Loader2,
  Printer,
  CheckCircle2,
  Clock,
  TruckIcon,
  CalendarDays,
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
import { StatsGrid, type StatItem } from "@/components/ui/stats-grid";
import { useGetInboundReceiptsQuery, useLazyGetInboundReceiptPrintDataQuery } from "@/store/services/inbound.service";
import { useGetWarehousesQuery } from "@/store/services/warehouse.service";
import { apiErrMessage, type PagedResponse } from "@/types/api";
import type { InboundReceipt, InboundReceiptPrintResponse } from "@/types/inbound-receipt";
import type { Warehouse } from "@/types/warehouse";
import { InboundPrintModal } from "./_components/InboundPrintModal";

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

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  RECEIVED: {
    label: "Đã nhận hàng",
    cls: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900",
    icon: <TruckIcon className="h-3 w-3" />,
  },
  PUTAWAY_IN_PROGRESS: {
    label: "Đang lên kệ",
    cls: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900",
    icon: <Clock className="h-3 w-3" />,
  },
  COMPLETED: {
    label: "Hoàn tất",
    cls: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
};

function StatusBadge({ status }: { status: string | null | undefined }) {
  const s = status ?? "";
  const cfg = STATUS_CONFIG[s];
  if (!cfg) {
    return (
      <Badge variant="secondary" className="rounded-md border-0 px-2.5 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
        {s || "—"}
      </Badge>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", cfg.cls)}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

export default function InboundPage() {
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState<InboundReceiptPrintResponse | null>(null);
  const [warehouseLabel, setWarehouseLabel] = useState("");
  const [printingId, setPrintingId] = useState<string | null>(null);

  const [triggerGetPrintData] = useLazyGetInboundReceiptPrintDataQuery();

  const {
    data: warehousesRes,
    isLoading: warehousesLoading,
    isError: warehousesIsError,
    refetch: refetchWarehouses,
  } = useGetWarehousesQuery({ page: 0, size: 100 });

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
  const canGoNext = paged != null && paged.total_pages > 0 && page < paged.total_pages - 1;

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

  const handlePrintClick = async (receiptId: string) => {
    try {
      setPrintingId(receiptId);
      const result = await triggerGetPrintData(receiptId).unwrap();
      if (result && result.data) {
        setPrintData(result.data);
        const w = findWarehouse(result.data.warehouseId);
        setWarehouseLabel(w ? `${w.name}${w.code ? ` (${w.code})` : ""}` : "—");
        setPrintModalOpen(true);
      }
    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu in:", err);
    } finally {
      setPrintingId(null);
    }
  };

  // Compute quick stats from visible page
  const stats = useMemo(() => {
    const all = receipts;
    return {
      total: paged?.total_elements ?? all.length,
      completed: all.filter((r) => r.status === "COMPLETED").length,
      inProgress: all.filter((r) => r.status === "PUTAWAY_IN_PROGRESS").length,
      received: all.filter((r) => r.status === "RECEIVED").length,
    };
  }, [receipts, paged]);

  const statsItems = useMemo<StatItem[]>(() => {
    const multiPage = (paged?.total_pages ?? 0) > 1;

    return [
      {
        label: "Tổng phiếu",
        value: stats.total,
        icon: FileText,
        color: "text-indigo-500",
      },
      {
        label: multiPage ? "Đã nhận (trang này)" : "Đã nhận",
        value: stats.received,
        icon: TruckIcon,
        color: "text-blue-500",
      },
      {
        label: multiPage ? "Đang lên kệ (trang này)" : "Đang lên kệ",
        value: stats.inProgress,
        icon: Clock,
        color: "text-amber-500",
      },
      {
        label: multiPage ? "Hoàn tất (trang này)" : "Hoàn tất",
        value: stats.completed,
        icon: CheckCircle2,
        color: "text-emerald-500",
      },
    ];
  }, [paged?.total_pages, stats]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Phiếu nhập kho"
        description="Quản lý phiếu nhập kho (GRN) từ đơn mua hàng."
        actions={
          <Button
            render={<Link href="/inbound/new" />}
            nativeButton={false}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none gap-1.5"
          >
            <PackagePlus className="h-4 w-4" />
            Tạo phiếu nhập
          </Button>
        }
      />

      <StatsGrid stats={statsItems} isLoading={isLoading} />

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col">
        <SearchToolbar
          noContainer
          placeholder="Tìm theo mã phiếu GRN, mã PO..."
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
                  <SelectTrigger className="h-10 w-44 shrink-0 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <span className="truncate text-sm">
                      {status ? (STATUS_LABEL[status] ?? status) : "Tất cả trạng thái"}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="" className="rounded-lg">Tất cả trạng thái</SelectItem>
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
                        warehousesLoading ? "Đang tải kho..." : warehousesIsError ? "Lỗi tải kho" : "Tất cả kho"
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
                        <button type="button" onClick={() => refetchWarehouses()} className="ml-1 underline">Thử lại</button>
                      </div>
                    ) : null}
                    <SelectItem value="" className="rounded-lg">Tất cả kho</SelectItem>
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

        {/* Fetching indicator */}
        {isFetching && !isLoading ? (
          <div className="flex items-center gap-2 border-b border-slate-100 bg-indigo-50/60 px-6 py-2 text-xs font-medium text-indigo-600 dark:border-slate-800 dark:bg-indigo-950/20 dark:text-indigo-400">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
            Đang cập nhật dữ liệu…
          </div>
        ) : null}

        <div className="flex-1 overflow-x-auto">
          <Table className="min-w-px text-left border-collapse">
            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
              <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                <TableHead className="py-3.5 pl-6 pr-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Mã phiếu GRN
                </TableHead>
                <TableHead className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  PO liên quan
                </TableHead>
                <TableHead className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Ngày nhập
                  </span>
                </TableHead>
                <TableHead className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Trạng thái
                </TableHead>
                <TableHead className="py-3.5 pl-3 pr-6 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`ske-inb-${i}`} className="border-b border-slate-100 dark:border-slate-800">
                    <TableCell className="py-4 pl-6 pr-3"><Skeleton className="h-4 w-36 rounded" /></TableCell>
                    <TableCell className="px-3 py-4"><Skeleton className="h-4 w-28 rounded" /></TableCell>
                    <TableCell className="px-3 py-4"><Skeleton className="h-4 w-24 rounded" /></TableCell>
                    <TableCell className="px-3 py-4"><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell className="py-4 pl-3 pr-6 text-right"><Skeleton className="ml-auto h-8 w-24 rounded-lg" /></TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12">
                    <EmptyState
                      icon={AlertCircle}
                      title="Không tải được danh sách phiếu nhập"
                      description={apiErrMessage(error, "Lỗi mạng hoặc máy chủ từ chối yêu cầu.")}
                      action={
                        <Button variant="outline" size="sm" onClick={() => refetch()}>Thử lại</Button>
                      }
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
                        <Button
                          render={<Link href="/inbound/new" />}
                          nativeButton={false}
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700 gap-1.5"
                        >
                          <PackagePlus className="h-4 w-4" />
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
                    className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/80 dark:border-slate-800/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Receipt Number */}
                    <TableCell className="py-4 pl-6 pr-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                          {r.receiptNumber}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">{r.id.slice(0, 8)}…</span>
                      </div>
                    </TableCell>

                    {/* PO Number */}
                    <TableCell className="px-3 py-4">
                      {r.poNumber ? (
                        <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400">
                          {r.poNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>

                    {/* Date */}
                    <TableCell className="px-3 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {r.receivedDate ?? "—"}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="px-3 py-4">
                      <StatusBadge status={r.status} />
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-4 pl-3 pr-6 text-right">
                      <Button
                        onClick={() => handlePrintClick(r.id)}
                        disabled={printingId === r.id}
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
                      >
                        {printingId === r.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Printer className="w-3.5 h-3.5" />
                        )}
                        In phiếu
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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

      {printData && (
        <InboundPrintModal
          open={printModalOpen}
          onOpenChange={setPrintModalOpen}
          data={printData}
          warehouseLabel={warehouseLabel}
        />
      )}
    </div>
  );
}
