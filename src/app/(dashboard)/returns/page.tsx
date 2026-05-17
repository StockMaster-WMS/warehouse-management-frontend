"use client";

import { Dispatch, useMemo, useReducer } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Box,
  ClipboardCheck,
  PackageCheck,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";

import { CreateRMAModal } from "@/components/features/returns/components/CreateRMAModal";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  DEFAULT_OPERATION_DATE_PRESET,
  getOperationDateRange,
  operationDatePresetLabel,
  type OperationDatePreset,
} from "@/lib/date-range";
import { apiErrMessage } from "@/types/api";
import type {
  ReturnReason,
  ReturnRequest,
  ReturnSourceType,
  ReturnStatus,
} from "@/types/returns";
import { useGetReturnRequestsQuery } from "@/store/services/return.service";
import { useGetWarehousesQuery } from "@/store/services/warehouse.service";

const PAGE_SIZE = 20;

type ReturnsPageState = {
  page: number;
  pageSize: number;
  keyword: string;
  tab: string;
  status: ReturnStatus | "";
  datePreset: OperationDatePreset;
  isCreateModalOpen: boolean;
};

const INITIAL_RETURNS_PAGE_STATE: ReturnsPageState = {
  page: 0,
  pageSize: PAGE_SIZE,
  keyword: "",
  tab: "all",
  status: "",
  datePreset: DEFAULT_OPERATION_DATE_PRESET,
  isCreateModalOpen: false,
};

function returnsPageReducer(
  state: ReturnsPageState,
  patch: Partial<ReturnsPageState>,
) {
  return { ...state, ...patch };
}

const STATUS_LABEL: Record<ReturnStatus, string> = {
  REQUESTED: "Mới yêu cầu",
  APPROVED: "Đã duyệt",
  RECEIVED: "Đã nhận",
  INSPECTING: "Đang kiểm",
  RESTOCKED: "Nhập lại kho",
  SCRAPPED: "Đã hủy hàng",
  REJECTED: "Từ chối",
  CLOSED: "Đã đóng",
  COMPLETED: "Hoàn tất",
};

const REASON_LABEL: Record<ReturnReason, string> = {
  CUSTOMER_RETURN: "Khách trả",
  DAMAGED: "Hàng lỗi / hỏng",
  WRONG_ITEM: "Sai hàng",
  EXPIRED: "Hết hạn",
  QUALITY_CHECK: "Chờ kiểm định",
  SUPPLIER_RETURN: "Trả NCC",
};

const SOURCE_LABEL: Record<ReturnSourceType, string> = {
  CUSTOMER: "Khách hàng",
  SUPPLIER: "Nhà cung cấp",
  INTERNAL: "Nội bộ kho",
};

function statusClass(status: ReturnStatus) {
  switch (status) {
    case "REQUESTED":
    case "APPROVED":
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300";
    case "RECEIVED":
    case "INSPECTING":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300";
    case "RESTOCKED":
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300";
    case "SCRAPPED":
    case "REJECTED":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300";
    default:
      return "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300";
  }
}

function formatDate(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
}

function displayCode(value?: string | null) {
  const code = value?.trim();
  if (!code) return "Chưa có mã";
  return code.replace(/^RMA-/i, "HT-");
}

function isUuid(value?: string | null) {
  return Boolean(value?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i));
}

function displayLinkedOrder(row: ReturnRequest) {
  if (!row.orderNumber || isUuid(row.orderNumber)) {
    return "Không gắn đơn";
  }
  return row.orderNumber;
}

function reasonLabel(reason: string) {
  const mapped = REASON_LABEL[reason as ReturnReason];
  if (mapped) return mapped;
  const normalized = reason.trim().toLowerCase();
  if (normalized.includes("khach") && normalized.includes("loi")) {
    return "Khách trả hàng lỗi";
  }
  if (normalized.includes("khach")) {
    return "Khách trả";
  }
  if (normalized.includes("ncc") || normalized.includes("supplier")) {
    return "Trả NCC";
  }
  return reason.replace(/_/g, " ");
}

function lineSummary(row: ReturnRequest) {
  const lines = row.lines ?? [];
  const received = lines.reduce((sum, line) => sum + Number(line.receivedQty ?? 0), 0);
  const expected = lines.reduce((sum, line) => sum + Number(line.expectedQty ?? 0), 0);
  if (!lines.length) return "Chưa có dòng hàng";
  return `${lines.length} dòng · ${received}/${expected} đã nhận`;
}

function partnerName(row: ReturnRequest) {
  if (row.sourceType === "SUPPLIER") return row.supplierName || "Nhà cung cấp";
  if (row.sourceType === "CUSTOMER") return row.customerName || "Khách hàng";
  return row.createdBy || "Nội bộ kho";
}

export default function ReturnsPage() {
  const [state, dispatch] = useReducer(
    returnsPageReducer,
    INITIAL_RETURNS_PAGE_STATE,
  );
  const { page, pageSize, keyword, tab, status, datePreset, isCreateModalOpen } = state;
  const dateRange = useMemo(() => getOperationDateRange(datePreset), [datePreset]);

  const tabFilters = useMemo<{
    reason?: ReturnReason;
    sourceType?: ReturnSourceType;
  }>(() => {
    if (tab === "damaged") return { reason: "DAMAGED" };
    if (tab === "customer") return { sourceType: "CUSTOMER" };
    if (tab === "supplier") return { sourceType: "SUPPLIER" };
    return {};
  }, [tab]);

  const { data, isLoading, isFetching, error, refetch } = useGetReturnRequestsQuery({
    page,
    size: pageSize,
    keyword,
    status,
    ...tabFilters,
    ...dateRange,
  });
  const { data: warehousesRes } = useGetWarehousesQuery({ page: 0, size: 200 });
  const warehouseNameById = useMemo(
    () =>
      new Map(
        (warehousesRes?.data?.content ?? []).map((warehouse) => [
          warehouse.id,
          warehouse.code ? `${warehouse.name} (${warehouse.code})` : warehouse.name,
        ]),
      ),
    [warehousesRes],
  );

  const rows = data?.data?.content ?? [];
  const totalElements = data?.data?.total_elements ?? 0;
  const totalPages = data?.data?.total_pages ?? 0;
  const damagedCount = rows.filter((row) => row.reason === "DAMAGED").length;
  const waitingInspection = rows.filter((row) =>
    row.status === "RECEIVED" || row.status === "INSPECTING",
  ).length;
  const restockedCount = rows.filter((row) => row.status === "RESTOCKED").length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Hàng trả / Hàng lỗi"
        description="Tiếp nhận, kiểm định và quyết định xử lý hàng trả về kho."
        actions={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn("mr-2 size-4", isFetching && "animate-spin")} />
              Làm mới
            </Button>
            <Button 
              size="sm" 
              className="bg-primary hover:bg-primary/90 shadow-md"
              onClick={() => dispatch({ isCreateModalOpen: true })}
            >
              <Plus className="mr-2 size-4" />
              Tạo phiếu trả hàng
            </Button>
          </div>
        }
      />

      <ReturnsStats
        damagedCount={damagedCount}
        restockedCount={restockedCount}
        totalElements={totalElements}
        waitingInspection={waitingInspection}
      />

      <ReturnsPanel
        error={error}
        isFetching={isFetching}
        isLoading={isLoading}
        keyword={keyword}
        page={page}
        pageSize={pageSize}
        rows={rows}
        status={status}
        tab={tab}
        datePreset={datePreset}
        totalElements={totalElements}
        totalPages={totalPages}
        warehouseNameById={warehouseNameById}
        onDispatch={dispatch}
        onRefetch={refetch}
      />
      <CreateRMAModal 
        open={isCreateModalOpen} 
        onOpenChange={(isCreateModalOpen) => dispatch({ isCreateModalOpen })} 
      />
    </div>
  );
}

function ReturnsStats({
  damagedCount,
  restockedCount,
  totalElements,
  waitingInspection,
}: {
  damagedCount: number;
  restockedCount: number;
  totalElements: number;
  waitingInspection: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 md:gap-6">
      <StatCard
        label="Tổng hồ sơ"
        value={totalElements.toLocaleString("vi-VN")}
        icon={RotateCcw}
        description="Theo bộ lọc hiện tại"
        showAccentBar={false}
      />
      <StatCard
        label="Hàng lỗi"
        value={damagedCount.toLocaleString("vi-VN")}
        icon={ShieldAlert}
        iconClassName="text-rose-500"
        description="Trên trang hiện tại"
        showAccentBar={false}
      />
      <StatCard
        label="Chờ kiểm định"
        value={waitingInspection.toLocaleString("vi-VN")}
        icon={ClipboardCheck}
        iconClassName="text-amber-500"
        description="Đã nhận / đang kiểm"
        showAccentBar={false}
      />
      <StatCard
        label="Nhập lại kho"
        value={restockedCount.toLocaleString("vi-VN")}
        icon={PackageCheck}
        iconClassName="text-emerald-500"
        description="Sẵn sàng bán lại"
        showAccentBar={false}
      />
    </div>
  );
}

function ReturnsPanel({
  error,
  isFetching,
  isLoading,
  keyword,
  page,
  pageSize,
  rows,
  status,
  tab,
  datePreset,
  totalElements,
  totalPages,
  warehouseNameById,
  onDispatch,
  onRefetch,
}: {
  error: unknown;
  isFetching: boolean;
  isLoading: boolean;
  keyword: string;
  page: number;
  pageSize: number;
  rows: ReturnRequest[];
  status: ReturnStatus | "";
  tab: string;
  datePreset: OperationDatePreset;
  totalElements: number;
  totalPages: number;
  warehouseNameById: Map<string, string>;
  onDispatch: Dispatch<Partial<ReturnsPageState>>;
  onRefetch: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <ReturnsTabs tab={tab} onDispatch={onDispatch} />
      <ReturnsSearch
        datePreset={datePreset}
        keyword={keyword}
        status={status}
        tab={tab}
        onDispatch={onDispatch}
      />

      {isFetching && !isLoading ? (
        <div className="border-b border-border bg-muted/50 px-6 py-2 text-xs font-medium text-muted-foreground">
          Đang cập nhật danh sách hàng trả…
        </div>
      ) : null}

      <ReturnsTable
        error={error}
        isLoading={isLoading}
        rows={rows}
        warehouseNameById={warehouseNameById}
        onRefetch={onRefetch}
      />
      <PaginationFooter
        itemLabel="hồ sơ hàng trả"
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
        onPrevPage={() => onDispatch({ page: Math.max(0, page - 1) })}
        onNextPage={() => onDispatch({ page: page + 1 })}
        onPageSizeChange={(nextSize) => onDispatch({ pageSize: nextSize, page: 0 })}
      />
    </div>
  );
}

function ReturnsTabs({
  tab,
  onDispatch,
}: {
  tab: string;
  onDispatch: Dispatch<Partial<ReturnsPageState>>;
}) {
  return (
    <div className="border-b border-border p-3 sm:p-4">
      <Tabs value={tab} onValueChange={(value) => onDispatch({ tab: value, page: 0 })}>
        <TabsList className="h-auto flex-wrap justify-start gap-1 bg-muted/70">
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="damaged">Hàng lỗi</TabsTrigger>
          <TabsTrigger value="customer">Khách trả</TabsTrigger>
          <TabsTrigger value="supplier">Trả NCC</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

function ReturnsSearch({
  datePreset,
  keyword,
  status,
  tab,
  onDispatch,
}: {
  datePreset: OperationDatePreset;
  keyword: string;
  status: ReturnStatus | "";
  tab: string;
  onDispatch: Dispatch<Partial<ReturnsPageState>>;
}) {
  return (
    <SearchToolbar
      noContainer
      placeholder="Tìm theo mã hồ sơ, đơn hàng, khách hàng, nhà cung cấp…"
      value={keyword}
      onValueChange={(value) => onDispatch({ keyword: value, page: 0 })}
      right={
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={datePreset}
            onValueChange={(value) =>
              onDispatch({
                datePreset: value as OperationDatePreset,
                page: 0,
              })
            }
          >
            <SelectTrigger className="h-10 w-44 rounded-xl border-zinc-200 dark:border-zinc-700">
              <span className="truncate text-sm">{operationDatePresetLabel(datePreset)}</span>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="today">Hôm nay</SelectItem>
              <SelectItem value="7d">7 ngày gần nhất</SelectItem>
              <SelectItem value="30d">30 ngày gần nhất</SelectItem>
              <SelectItem value="all">Tất cả thời gian</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={status || "all"}
            onValueChange={(value) =>
              onDispatch({
                status: value === "all" ? "" : (value as ReturnStatus),
                page: 0,
              })
            }
          >
            <SelectTrigger className="h-10 w-44 rounded-xl border-zinc-200 dark:border-zinc-700">
              <span className="truncate text-sm">
                {status ? STATUS_LABEL[status] : "Tất cả trạng thái"}
              </span>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {keyword || status || tab !== "all" || datePreset !== DEFAULT_OPERATION_DATE_PRESET ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 text-muted-foreground hover:text-destructive"
              onClick={() => onDispatch({
                keyword: "",
                status: "",
                tab: "all",
                datePreset: DEFAULT_OPERATION_DATE_PRESET,
                page: 0,
              })}
            >
              Xóa lọc
            </Button>
          ) : null}
          {datePreset !== DEFAULT_OPERATION_DATE_PRESET ? (
            <span className="text-xs font-medium text-muted-foreground">
              {operationDatePresetLabel(datePreset)}
            </span>
          ) : null}
        </div>
      }
    />
  );
}

function ReturnsTable({
  error,
  isLoading,
  rows,
  warehouseNameById,
  onRefetch,
}: {
  error: unknown;
  isLoading: boolean;
  rows: ReturnRequest[];
  warehouseNameById: Map<string, string>;
  onRefetch: () => void;
}) {
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[980px]">
        <ReturnsTableHeader />
        <TableBody>
          {isLoading ? (
            <ReturnsSkeletonRows />
          ) : error ? (
            <ReturnsErrorRow error={error} onRefetch={onRefetch} />
          ) : rows.length === 0 ? (
            <ReturnsEmptyRow />
          ) : (
            rows.map((row) => <ReturnsTableRow key={row.id} row={row} warehouseNameById={warehouseNameById} />)
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ReturnsTableHeader() {
  return (
    <TableHeader className="bg-muted/50">
      <TableRow className="hover:bg-transparent">
        {["Mã hồ sơ", "Đối tác", "Lý do", "Trạng thái", "Kho nhận", "Dòng hàng", "Ngày tạo"].map((label, index) => (
          <TableHead
            key={label}
            className={cn(
              "px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
              index === 0 && "w-40",
              index === 6 && "text-right",
            )}
          >
            {label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

function ReturnsSkeletonRows() {
  return Array.from({ length: 6 }).map((_, index) => (
    <TableRow key={`return-skeleton-${index}`}>
      {Array.from({ length: 7 }).map((__, col) => (
        <TableCell key={`${index}-${col}`} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  ));
}

function ReturnsErrorRow({ error, onRefetch }: { error: unknown; onRefetch: () => void }) {
  return (
    <TableRow>
      <TableCell colSpan={7} className="p-0">
        <EmptyState
          icon={AlertTriangle}
          title="Chưa tải được dữ liệu hàng trả"
          description={apiErrMessage(
            error,
            "Frontend đã có contract /returns, nhưng backend có thể chưa triển khai endpoint này.",
          )}
          action={
            <Button variant="outline" size="sm" onClick={onRefetch}>
              <RefreshCw className="mr-2 size-4" />
              Thử lại
            </Button>
          }
          className="py-12"
        />
      </TableCell>
    </TableRow>
  );
}

function ReturnsEmptyRow() {
  return (
    <TableRow>
      <TableCell colSpan={7} className="p-0">
        <EmptyState
          icon={Box}
          title="Chưa có hồ sơ hàng trả"
          description="Khi backend tạo phiếu trả hàng hoặc ghi nhận hàng lỗi, danh sách sẽ hiển thị tại đây."
          className="py-12"
        />
      </TableCell>
    </TableRow>
  );
}

function ReturnsTableRow({
  row,
  warehouseNameById,
}: {
  row: ReturnRequest;
  warehouseNameById: Map<string, string>;
}) {
  const warehouseLabel =
    row.warehouseName ||
    (row.warehouseId ? warehouseNameById.get(row.warehouseId) : null) ||
    "Kho chưa xác định";

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell className="px-4 py-3">
        <Link href={`/returns/${row.id}`} className="hover:underline">
          <div className="font-mono text-xs font-bold text-primary">
            {displayCode(row.rmaNumber)}
          </div>
        </Link>
        <div className="mt-1 text-[11px] text-muted-foreground">
          {displayLinkedOrder(row)}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="text-sm font-semibold text-foreground">{partnerName(row)}</div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          {SOURCE_LABEL[row.sourceType] ?? row.sourceType}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <span className="inline-flex rounded-lg border border-border bg-muted px-2 py-1 text-xs font-semibold text-foreground">
          {reasonLabel(row.reason)}
        </span>
      </TableCell>
      <TableCell className="px-4 py-3">
        <span className={cn("inline-flex rounded-lg border px-2 py-1 text-xs font-semibold", statusClass(row.status))}>
          {STATUS_LABEL[row.status] ?? row.status}
        </span>
      </TableCell>
      <TableCell className="px-4 py-3 text-sm font-medium text-foreground">
        {warehouseLabel}
      </TableCell>
      <TableCell className="px-4 py-3 text-sm text-muted-foreground">
        {lineSummary(row)}
      </TableCell>
      <TableCell className="px-4 py-3 text-right text-sm text-muted-foreground">
        {formatDate(row.createdAt)}
      </TableCell>
    </TableRow>
  );
}
