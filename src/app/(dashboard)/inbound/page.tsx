"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
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
import { statusTone } from "@/lib/design-system";
import {
  DEFAULT_OPERATION_DATE_PRESET,
  getOperationDateRange,
  operationDatePresetLabel,
  type OperationDatePreset,
} from "@/lib/date-range";
import { useGetInboundReceiptsQuery, useLazyGetInboundReceiptPrintDataQuery } from "@/store/services/inbound.service";
import { useLazyGetLocationByIdQuery } from "@/store/services/location.service";
import { useGetWarehousesQuery } from "@/store/services/warehouse.service";
import { apiErrMessage, type PagedResponse } from "@/types/api";
import type { InboundReceipt, InboundReceiptPrintResponse } from "@/types/inbound-receipt";
import type { Location } from "@/types/location";
import type { Warehouse } from "@/types/warehouse";
import { InboundPrintModal } from "./_components/InboundPrintModal";
import { PermissionControl } from "@/components/permission-control";

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

const EMPTY_RECEIPTS: InboundReceipt[] = [];

export default function InboundPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [datePreset, setDatePreset] = useState<OperationDatePreset>(DEFAULT_OPERATION_DATE_PRESET);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const dateRange = useMemo(() => getOperationDateRange(datePreset), [datePreset]);

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState<InboundReceiptPrintResponse | null>(null);
  const [warehouseLabel, setWarehouseLabel] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [printingId, setPrintingId] = useState<string | null>(null);

  const [triggerGetPrintData] = useLazyGetInboundReceiptPrintDataQuery();
  const [triggerGetLocationById] = useLazyGetLocationByIdQuery();

  const {
    data: warehousesRes,
    isLoading: warehousesLoading,
    isError: warehousesIsError,
    refetch: refetchWarehouses,
  } = useGetWarehousesQuery({ page: 0, size: 100 });

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetInboundReceiptsQuery({
      page,
      size: pageSize,
      ...(keyword.trim() ? { keyword: keyword.trim() } : {}),
      ...(status ? { status } : {}),
      ...(warehouseId ? { warehouseId } : {}),
      ...dateRange,
    });

  const receipts = data?.data?.content ?? EMPTY_RECEIPTS;
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
    if (datePreset !== DEFAULT_OPERATION_DATE_PRESET) count++;
    return count;
  }, [status, warehouseId, datePreset]);

  const hasAnyFilter = Boolean(keyword.trim() || activeFiltersCount > 0);

  const clearFilters = () => {
    setKeyword("");
    setStatus("");
    setWarehouseId("");
    setDatePreset(DEFAULT_OPERATION_DATE_PRESET);
    setPage(0);
  };

  const findWarehouse = (id: string) => warehouses.find((w: Warehouse) => w.id === id);

  const formatLocationLabel = (
    location: (Location & { name?: string | null }) | null | undefined,
    fallback?: string,
  ) => {
    const name = String(location?.name ?? "").trim();
    const code = String(location?.code ?? "").trim();

    if (name && code && name !== code) return `${name} (${code})`;
    if (name) return name;
    if (code) return code;
    return fallback?.trim() || "—";
  };

  const resolvePrintLocationLabel = async (receipt: InboundReceiptPrintResponse) => {
    const inlineName = receipt.locationName?.trim();
    const inlineCode = receipt.locationCode?.trim();
    if (inlineName && inlineCode && inlineName !== inlineCode) return `${inlineName} (${inlineCode})`;
    if (inlineName) return inlineName;
    if (inlineCode) return inlineCode;

    const locationId = receipt.locationId?.trim();
    if (!locationId) return "—";

    try {
      const locationResult = await triggerGetLocationById(locationId).unwrap();
      return formatLocationLabel(locationResult.data, locationId);
    } catch {
      return locationId;
    }
  };

  const handlePrintClick = async (receiptId: string) => {
    try {
      setPrintingId(receiptId);
      const result = await triggerGetPrintData(receiptId).unwrap();
      if (result && result.data) {
        setPrintData(result.data);
        const w = findWarehouse(result.data.warehouseId);
        const nextLocationLabel = await resolvePrintLocationLabel(result.data);
        setWarehouseLabel(w ? `${w.name}${w.code ? ` (${w.code})` : ""}` : "—");
        setLocationLabel(nextLocationLabel);
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
        color: "text-primary",
      },
      {
        label: multiPage ? "Đã nhận (trang này)" : "Đã nhận",
        value: stats.received,
        icon: TruckIcon,
        color: "text-info",
      },
      {
        label: multiPage ? "Đang lên kệ (trang này)" : "Đang lên kệ",
        value: stats.inProgress,
        icon: Clock,
        color: "text-warning",
      },
      {
        label: multiPage ? "Hoàn tất (trang này)" : "Hoàn tất",
        value: stats.completed,
        icon: CheckCircle2,
        color: "text-success",
      },
    ];
  }, [paged?.total_pages, stats]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Phiếu nhập kho"
        description="Quản lý phiếu nhập kho (GRN) từ đơn mua hàng."
        actions={
          <PermissionControl allowedRoles={["ADMIN", "WAREHOUSE_MANAGER"]}>
            <Button
              render={<Link href="/inbound/new" />}
              nativeButton={false}
              size="sm"
              className="gap-1.5"
            >
              <PackagePlus className="h-4 w-4" />
              Tạo phiếu nhập
            </Button>
          </PermissionControl>
        }
      />

      <StatsGrid stats={statsItems} isLoading={isLoading} />

      <div className="ui-surface flex flex-col overflow-hidden">
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
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                      {status ? (
                        <span className="rounded-full bg-muted px-3 py-1">
                          Trạng thái:{" "}
                          <span className="font-semibold text-foreground">
                            {STATUS_LABEL[status] ?? status}
                          </span>
                        </span>
                      ) : null}
                      {warehouseId ? (
                        <span className="rounded-full bg-muted px-3 py-1">
                          Kho:{" "}
                          <span className="font-semibold text-foreground">
                            {findWarehouse(warehouseId)?.name ?? "—"}
                          </span>
                        </span>
                      ) : null}
                      {datePreset !== DEFAULT_OPERATION_DATE_PRESET ? (
                        <span className="rounded-full bg-muted px-3 py-1">
                          Thời gian:{" "}
                          <span className="font-semibold text-foreground">
                            {operationDatePresetLabel(datePreset)}
                          </span>
                        </span>
                      ) : null}
                    </div>
                  ) : null
                }
              >
                <Select
                  value={datePreset}
                  onValueChange={(v) => {
                    setDatePreset(v as OperationDatePreset);
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="h-10 w-44 shrink-0 rounded-lg">
                    <span className="truncate text-sm">{operationDatePresetLabel(datePreset)}</span>
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="today" className="rounded-lg">Hôm nay</SelectItem>
                    <SelectItem value="7d" className="rounded-lg">7 ngày gần nhất</SelectItem>
                    <SelectItem value="30d" className="rounded-lg">30 ngày gần nhất</SelectItem>
                    <SelectItem value="all" className="rounded-lg">Tất cả thời gian</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={status}
                  onValueChange={(v) => {
                    setStatus(v || "");
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="h-10 w-44 shrink-0 rounded-lg">
                    <span className="truncate text-sm">
                      {status ? (STATUS_LABEL[status] ?? status) : "Tất cả trạng thái"}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
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
                  <SelectTrigger className="h-10 w-full min-w-0 rounded-lg sm:max-w-60 sm:w-55">
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
                  <SelectContent className="max-h-72 rounded-lg">
                    {warehousesIsError ? (
                      <div className="px-2 py-1.5 text-xs text-destructive">
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

        {isFetching && !isLoading ? (
          <div className="ui-updating-banner flex items-center gap-2">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Đang cập nhật dữ liệu…
          </div>
        ) : null}

        <div className="flex-1 overflow-x-auto">
          <Table className="min-w-px text-left border-collapse">
            <TableHeader className="ui-table-header">
              <TableRow>
                <TableHead className="ui-label py-3.5 pl-6 pr-3">
                  Mã phiếu GRN
                </TableHead>
                <TableHead className="ui-label px-3 py-3.5">
                  PO liên quan
                </TableHead>
                <TableHead className="ui-label px-3 py-3.5">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Ngày nhập
                  </span>
                </TableHead>
                <TableHead className="ui-label px-3 py-3.5">
                  Trạng thái
                </TableHead>
                <TableHead className="ui-label py-3.5 pl-3 pr-6 text-right">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`ske-inb-${i}`} className="ui-table-row">
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
                        <PermissionControl allowedRoles={["ADMIN", "WAREHOUSE_MANAGER"]}>
                          <Button
                            render={<Link href="/inbound/new" />}
                            nativeButton={false}
                            size="sm"
                            className="gap-1.5"
                          >
                            <PackagePlus className="h-4 w-4" />
                            Tạo phiếu đầu tiên
                          </Button>
                        </PermissionControl>
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                receipts.map((r) => (
                  <TableRow
                    key={r.id}
                    className="ui-table-row group last:border-0"
                  >
                    <TableCell className="py-4 pl-6 pr-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-foreground">
                          {r.receiptNumber}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">{r.id.slice(0, 8)}...</span>
                      </div>
                    </TableCell>

                    <TableCell className="px-3 py-4">
                      {r.poNumber ? (
                        <span className="inline-flex items-center rounded-lg bg-info-soft px-2.5 py-1 font-mono text-[11px] font-semibold text-info-foreground">
                          {r.poNumber}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="px-3 py-4 text-sm text-muted-foreground">
                      {r.receivedDate ?? "—"}
                    </TableCell>

                    <TableCell className="px-3 py-4">
                      <StatusBadge tone={statusTone(r.status)}>
                        {STATUS_LABEL[r.status ?? ""] ?? r.status ?? "—"}
                      </StatusBadge>
                    </TableCell>

                    <TableCell className="py-4 pl-3 pr-6 text-right">
                      <Button
                        onClick={() => handlePrintClick(r.id)}
                        disabled={printingId === r.id}
                        variant="outline"
                        size="sm"
                        className="flex h-8 items-center gap-1.5 px-3 text-xs font-semibold"
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
          pageSize={pageSize}
          onPageSizeChange={(nextSize) => {
            setPageSize(nextSize);
            setPage(0);
          }}
        />
      </div>

      {printData && (
        <InboundPrintModal
          open={printModalOpen}
          onOpenChange={setPrintModalOpen}
          data={printData}
          warehouseLabel={warehouseLabel}
          locationLabel={locationLabel}
        />
      )}
    </div>
  );
}
