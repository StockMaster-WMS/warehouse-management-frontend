"use client";

import { useMemo, useReducer } from "react";
import Link from "next/link";
import { AlertTriangle, Box, PackageCheck, Plus, RefreshCw, RotateCcw } from "lucide-react";

import { CreateRMAModal } from "@/components/features/returns/components/CreateRMAModal";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { TableRefreshButton } from "@/components/ui/table-refresh-button";
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
import { REPORT_ROLES } from "@/lib/access-control";
import {
  DEFAULT_OPERATION_DATE_PRESET,
  getOperationDateRange,
  operationDatePresetLabel,
  type OperationDatePreset,
} from "@/lib/date-range";
import { apiErrMessage } from "@/types/api";
import type { ReturnRequest, ReturnStatus, ReturnType } from "@/types/returns";
import { useGetReturnRequestsQuery, useGetReturnReportQuery } from "@/store/services/return.service";
import { useGetWarehousesQuery } from "@/store/services/warehouse.service";
import { useHasPermissions } from "@/components/permission-control";

const PAGE_SIZE = 20;

type ReturnsPageState = {
  page: number;
  pageSize: number;
  keyword: string;
  returnType: ReturnType | "";
  status: ReturnStatus | "";
  warehouseId: string;
  datePreset: OperationDatePreset;
  isCreateModalOpen: boolean;
};

const INITIAL_RETURNS_PAGE_STATE: ReturnsPageState = {
  page: 0,
  pageSize: PAGE_SIZE,
  keyword: "",
  returnType: "",
  status: "",
  warehouseId: "",
  datePreset: DEFAULT_OPERATION_DATE_PRESET,
  isCreateModalOpen: false,
};

function reducer(state: ReturnsPageState, patch: Partial<ReturnsPageState>) {
  return { ...state, ...patch };
}

const STATUS_LABEL: Record<ReturnStatus, string> = {
  REQUESTED: "Chờ xử lý",
  RECEIVED: "Đã nhận hàng",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
  INSPECTING: "Đang kiểm",
  RESTOCKED: "Nhập lại kho",
  SCRAPPED: "Đã hủy hàng",
  CLOSED: "Đã đóng",
};

const RETURN_TYPE_LABEL: Record<ReturnType, string> = {
  CUSTOMER: "Khách trả",
  SUPPLIER: "Trả NCC",
};

const STATUSES: ReturnStatus[] = ["REQUESTED", "RECEIVED", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"];

function statusClass(status: ReturnStatus) {
  switch (status) {
    case "REQUESTED":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "RECEIVED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "APPROVED":
    case "COMPLETED":
    case "RESTOCKED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "REJECTED":
    case "CANCELLED":
    case "SCRAPPED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-zinc-200 bg-zinc-50 text-zinc-700";
  }
}

function formatDate(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

function displayCode(value?: string | null) {
  const code = value?.trim();
  return code || "Chưa có mã";
}

function partnerName(row: ReturnRequest) {
  if (row.returnType === "SUPPLIER") return row.supplierName || "Nhà cung cấp";
  return row.customerName || "Khách hàng";
}

export default function ReturnsPage() {
  const [state, dispatch] = useReducer(reducer, INITIAL_RETURNS_PAGE_STATE);
  const { page, pageSize, keyword, returnType, status, warehouseId, datePreset, isCreateModalOpen } = state;
  const canCreate = useHasPermissions(["ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"]);
  const canViewReport = useHasPermissions(REPORT_ROLES);
  const dateRange = useMemo(() => getOperationDateRange(datePreset), [datePreset]);

  const { data, isLoading, isFetching, error, refetch } = useGetReturnRequestsQuery({
    page,
    size: pageSize,
    keyword,
    status,
    returnType,
    warehouseId,
    ...dateRange,
  });
  const { data: reportRes } = useGetReturnReportQuery(
    { warehouseId, returnType, ...dateRange },
    { skip: !canViewReport },
  );
  const { data: warehousesRes } = useGetWarehousesQuery({ page: 0, size: 200 });
  const warehouses = useMemo(() => warehousesRes?.data?.content ?? [], [warehousesRes]);
  const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === warehouseId);
  const warehouseNameById = useMemo(
    () =>
      new Map(
        warehouses.map((warehouse) => [
          warehouse.id,
          warehouse.code ? `${warehouse.name} (${warehouse.code})` : warehouse.name,
        ]),
      ),
    [warehouses],
  );

  const rows = data?.data?.content ?? [];
  const totalElements = data?.data?.total_elements ?? 0;
  const totalPages = data?.data?.total_pages ?? 0;
  const report = reportRes?.data;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Hàng trả"
        description="Quản lý khách trả hàng về kho và trả hàng cho nhà cung cấp."
        actions={
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn("mr-2 size-4", isFetching && "animate-spin")} />
              Làm mới
            </Button>
            {canCreate ? (
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 shadow-md"
                onClick={() => dispatch({ isCreateModalOpen: true })}
              >
                <Plus className="mr-2 size-4" />
                Tạo phiếu trả hàng
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tổng phiếu trả" value={(report?.totalReturns ?? totalElements).toLocaleString("vi-VN")} icon={RotateCcw} showAccentBar={false} />
        <StatCard label="Khách trả" value={(report?.customerReturns ?? rows.filter((row) => row.returnType === "CUSTOMER").length).toLocaleString("vi-VN")} icon={PackageCheck} iconClassName="text-blue-500" showAccentBar={false} />
        <StatCard label="Trả NCC" value={(report?.supplierReturns ?? rows.filter((row) => row.returnType === "SUPPLIER").length).toLocaleString("vi-VN")} icon={PackageCheck} iconClassName="text-amber-500" showAccentBar={false} />
        <StatCard label="Chờ duyệt" value={(report?.pendingApproval ?? rows.filter((row) => row.status === "REQUESTED" || row.status === "RECEIVED").length).toLocaleString("vi-VN")} icon={AlertTriangle} iconClassName="text-rose-500" showAccentBar={false} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-3 sm:p-4">
          <Tabs value={returnType || "all"} onValueChange={(value) => dispatch({ returnType: value === "all" ? "" : (value as ReturnType), page: 0 })}>
            <TabsList className="h-auto flex-wrap justify-start gap-1 bg-muted/70">
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              <TabsTrigger value="CUSTOMER">Khách trả</TabsTrigger>
              <TabsTrigger value="SUPPLIER">Trả NCC</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <SearchToolbar
          noContainer
          placeholder="Tìm theo mã phiếu, khách hàng, nhà cung cấp, lý do..."
          value={keyword}
          onValueChange={(value) => dispatch({ keyword: value, page: 0 })}
          right={
            <div className="flex flex-wrap items-center gap-2">
              <Select value={warehouseId || "all"} onValueChange={(value) => dispatch({ warehouseId: !value || value === "all" ? "" : value, page: 0 })}>
                <SelectTrigger className="h-10 w-48 rounded-xl border-zinc-200 dark:border-zinc-700">
                  <span className={cn("truncate text-sm", !selectedWarehouse && "text-muted-foreground")}>
                    {selectedWarehouse ? selectedWarehouse.name : "Tất cả kho"}
                  </span>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Tất cả kho</SelectItem>
                  {warehouses.filter((warehouse) => warehouse.id).map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id!}>{warehouse.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={datePreset} onValueChange={(value) => dispatch({ datePreset: value as OperationDatePreset, page: 0 })}>
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
              <Select value={status || "all"} onValueChange={(value) => dispatch({ status: value === "all" ? "" : (value as ReturnStatus), page: 0 })}>
                <SelectTrigger className="h-10 w-44 rounded-xl border-zinc-200 dark:border-zinc-700">
                  <span className="truncate text-sm">{status ? STATUS_LABEL[status] : "Tất cả trạng thái"}</span>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  {STATUSES.map((value) => (
                    <SelectItem key={value} value={value}>{STATUS_LABEL[value]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <TableRefreshButton isFetching={isFetching} onRefresh={() => refetch()} />
            </div>
          }
        />

        {isFetching && !isLoading ? (
          <div className="border-b border-border bg-muted/50 px-6 py-2 text-xs font-medium text-muted-foreground">
            Đang cập nhật danh sách hàng trả...
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <Table className="min-w-[1120px]">
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                {["Mã phiếu", "Loại", "Khách/NCC", "Kho", "Trạng thái", "SL dự kiến", "Đã nhận", "Còn lại", "Tạo lúc"].map((label, index) => (
                  <TableHead key={label} className={cn("px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground", index >= 5 && "text-right")}>
                    {label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 9 }).map((__, col) => (
                      <TableCell key={col} className="px-4 py-3"><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={9} className="p-0">
                    <EmptyState
                      icon={AlertTriangle}
                      title="Chưa tải được dữ liệu hàng trả"
                      description={apiErrMessage(error)}
                      action={<Button variant="outline" size="sm" onClick={() => refetch()}>Thử lại</Button>}
                      className="py-12"
                    />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="p-0">
                    <EmptyState icon={Box} title="Chưa có phiếu trả hàng" description="Phiếu khách trả hoặc trả NCC sẽ hiển thị tại đây." className="py-12" />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const warehouseLabel =
                    row.warehouseName ||
                    (row.warehouseId ? warehouseNameById.get(row.warehouseId) : null) ||
                    "Kho chưa xác định";
                  return (
                    <TableRow key={row.id} className="hover:bg-muted/50">
                      <TableCell className="px-4 py-3">
                        <Link href={`/returns/${row.id}`} className="font-mono text-xs font-bold text-primary hover:underline">
                          {displayCode(row.rmaNumber)}
                        </Link>
                        <div className="mt-1 text-[11px] text-muted-foreground">{row.reason}</div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm font-semibold">{RETURN_TYPE_LABEL[row.returnType]}</TableCell>
                      <TableCell className="px-4 py-3 text-sm font-semibold">{partnerName(row)}</TableCell>
                      <TableCell className="px-4 py-3 text-sm">{warehouseLabel}</TableCell>
                      <TableCell className="px-4 py-3">
                        <span className={cn("inline-flex rounded-lg border px-2 py-1 text-xs font-semibold", statusClass(row.status))}>
                          {STATUS_LABEL[row.status] ?? row.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right font-semibold">{Number(row.totalExpectedQty ?? 0)}</TableCell>
                      <TableCell className="px-4 py-3 text-right font-semibold text-primary">{Number(row.totalReceivedQty ?? 0)}</TableCell>
                      <TableCell className="px-4 py-3 text-right font-semibold">{Number(row.totalRemainingQty ?? 0)}</TableCell>
                      <TableCell className="px-4 py-3 text-right text-sm text-muted-foreground">{formatDate(row.createdAt)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <PaginationFooter
          itemLabel="phiếu trả hàng"
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
          onPageSizeChange={(nextSize) => dispatch({ pageSize: nextSize, page: 0 })}
        />
      </div>

      <CreateRMAModal open={isCreateModalOpen} onOpenChange={(isCreateModalOpen) => dispatch({ isCreateModalOpen })} />
    </div>
  );
}
