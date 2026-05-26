import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  PackageCheck,
  PackageX,
  MoreHorizontal,
  Eye,
  Edit2,
  Trash2,
  Truck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { OrdersPaginationFooter } from "./OrdersPaginationFooter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { apiErrMessage } from "@/types/api";
import { cn } from "@/lib/utils";
import { formatShippingShort, salesOrderStatusLabel, type SalesOrder } from "@/types/sales-order";
import { formatOrderCreatedAt } from "@/components/features/orders/utils";

const SKELETON_ROWS = 5;

const SALES_ORDER_STATUS_CONFIG = {
  DRAFT: {
    cls: "border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
    icon: <FileText className="size-3" />,
  },
  PENDING: {
    cls: "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-400",
    icon: <CheckCircle2 className="size-3" />,
  },
  ON_HOLD: {
    cls: "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-400",
    icon: <AlertCircle className="size-3" />,
  },
  PICKING: {
    cls: "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400",
    icon: <Clock className="size-3" />,
  },
  PACKED: {
    cls: "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400",
    icon: <PackageCheck className="size-3" />,
  },
  SHIPPED: {
    cls: "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-400",
    icon: <Truck className="size-3" />,
  },
  COMPLETED: {
    cls: "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400",
    icon: <CheckCircle2 className="size-3" />,
  },
  CANCELLED: {
    cls: "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-400",
    icon: <XCircle className="size-3" />,
  },
} as const;

function SalesOrderStatusPill({ status }: { status: SalesOrder["status"] }) {
  const cfg = SALES_ORDER_STATUS_CONFIG[status as keyof typeof SALES_ORDER_STATUS_CONFIG];
  if (!cfg) return <span className="text-xs text-slate-400">{status ?? "—"}</span>;

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", cfg.cls)}>
      {cfg.icon}
      {salesOrderStatusLabel(status)}
    </span>
  );
}

function OrdersTableSkeleton() {
  return (
    <>
      {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
        <TableRow key={`order-sk-${i}`}>
          <TableCell className="p-3 text-center">
            <Skeleton className="mx-auto h-4 w-6" />
          </TableCell>
          <TableCell className="p-3"><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell className="p-3"><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell className="p-3"><Skeleton className="h-3 w-full max-w-60" /></TableCell>
          <TableCell className="p-3 text-center"><Skeleton className="mx-auto h-5 w-24 rounded-full" /></TableCell>
          <TableCell className="p-3 text-right"><Skeleton className="ml-auto h-3 w-20" /></TableCell>
          <TableCell className="p-3 text-right"><Skeleton className="ml-auto h-8 w-20 rounded-lg" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

type OrdersTableProps = {
  rows: SalesOrder[];
  page: number;
  createdId: string;
  hasAnyFilter: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  onRetry: () => void;
  onClearFilters: () => void;
  totalElements: number;
  totalPages: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  pageSize: number;
  onPageSizeChange?: (size: number) => void;
  noContainer?: boolean;
  canManageOrders?: boolean;
};

export function OrdersTable({
  rows,
  page,
  createdId,
  hasAnyFilter,
  isLoading,
  isFetching,
  error,
  onRetry,
  onClearFilters,
  totalElements,
  totalPages,
  canGoPrev,
  canGoNext,
  onPrevPage,
  onNextPage,
  pageSize,
  onPageSizeChange,
  noContainer = false,
  canManageOrders = false,
}: OrdersTableProps) {
  const content = (
    <>
      {isFetching && !isLoading ? (
        <p className="ui-updating-banner">
          Đang cập nhật dữ liệu…
        </p>
      ) : null}
      <div className="overflow-x-auto">
        <Table className="min-w-245 text-left">
          <TableHeader className="ui-table-header">
            <TableRow>
              <TableHead className="ui-label w-12 p-3 text-center">STT</TableHead>
              <TableHead className="ui-label p-3">Mã đơn</TableHead>
              <TableHead className="ui-label p-3">Khách hàng</TableHead>
              <TableHead className="ui-label p-3">Địa chỉ giao</TableHead>
              <TableHead className="ui-label p-3 text-center">Trạng thái</TableHead>
              <TableHead className="ui-label p-3 text-right">Tạo lúc</TableHead>
              <TableHead className="ui-label p-3 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <OrdersTableSkeleton />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState
                    icon={AlertCircle}
                    title="Không thể tải đơn hàng"
                    description={apiErrMessage(error, "Đã xảy ra lỗi khi tải danh sách đơn hàng.")}
                    action={
                      <Button variant="outline" size="sm" onClick={onRetry}>
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
                    icon={PackageX}
                    title={hasAnyFilter ? "Không có đơn hàng khớp bộ lọc" : "Chưa có đơn hàng nào"}
                    description={
                      hasAnyFilter
                        ? "Thử đổi từ khóa hoặc bộ lọc trạng thái."
                        : "Bắt đầu bằng cách tạo hành trình giao hàng đầu tiên."
                    }
                    action={
                      hasAnyFilter ? (
                        <Button variant="outline" size="sm" onClick={onClearFilters}>
                          Xóa bộ lọc
                        </Button>
                      ) : canManageOrders ? (
                      <Button
                        render={<Link href="/orders/new" />}
                        nativeButton={false}
                        size="sm"
                      >
                          Tạo đơn xuất
                        </Button>
                      ) : null
                    }
                    className="py-10"
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((item, index) => {
                const highlight = Boolean(createdId && item.id === createdId);
                return (
                  <TableRow
                    key={item.id}
                    className={`group ${
                      highlight
                        ? "bg-primary/10 ring-1 ring-primary/20"
                        : "ui-table-row"
                    }`}
                  >
                    <TableCell className="p-3 text-center">
                      <span className="tabular-nums text-xs font-medium text-muted-foreground">
                        {page * pageSize + index + 1}
                      </span>
                    </TableCell>
                    <TableCell className="p-3 text-sm font-semibold text-foreground">
                      {item.soNumber || `SO-${item.id.slice(0, 8)}`}
                    </TableCell>
                    <TableCell className="p-3 text-sm text-foreground/85">
                      {item.customerName || "-"}
                    </TableCell>
                    <TableCell className="max-w-80 p-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0" />
                        <span className="truncate">
                          {item.shippingAddress ? formatShippingShort(item.shippingAddress) : "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="p-3 text-center">
                      <SalesOrderStatusPill status={item.status} />
                    </TableCell>
                    <TableCell className="p-3 text-right text-xs text-muted-foreground">
                      {formatOrderCreatedAt(item.createdAt)}
                    </TableCell>
                    <TableCell className="p-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-8 rounded-lg"
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent
                          align="end"
                          className="w-48 rounded-xl"
                        >
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                          </DropdownMenuGroup>
                          <DropdownMenuItem
                            className="rounded-lg"
                            render={<Link href={`/orders/${item.id}`} />}
                          >
                            <Eye className="mr-2 size-4" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          {canManageOrders ? (
                            <>
                              <DropdownMenuItem
                                className="rounded-lg text-muted-foreground"
                                disabled
                              >
                                <Edit2 className="mr-2 size-4" />
                                Sửa thông tin
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="rounded-lg text-destructive focus:text-destructive"
                                disabled={item.status !== "DRAFT" && item.status !== "PENDING"}
                              >
                                <Trash2 className="mr-2 size-4" />
                                Hủy đơn hàng
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <OrdersPaginationFooter
        rowsCount={rows.length}
        page={page}
        totalElements={totalElements}
        totalPages={totalPages}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        isFetching={isFetching}
        onPrevPage={onPrevPage}
        onNextPage={onNextPage}
        pageSize={pageSize}
        onPageSizeChange={onPageSizeChange}
      />
    </>
  );

  if (noContainer) {
    return content;
  }

  return (
    <div className="ui-surface overflow-hidden">
      {content}
    </div>
  );
}
