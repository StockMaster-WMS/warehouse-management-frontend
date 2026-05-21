import Link from "next/link";
import {
  AlertCircle,
  MapPin,
  PackageX,
  MoreHorizontal,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
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
import { statusTone } from "@/lib/design-system";
import { formatShippingShort, salesOrderStatusLabel, type SalesOrder } from "@/types/sales-order";
import { formatOrderCreatedAt } from "@/components/features/orders/utils";

const SKELETON_ROWS = 5;

function OrdersTableSkeleton() {
  return (
    <>
      {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
        <TableRow key={`order-sk-${i}`}>
          <TableCell className="px-3 py-3 text-center">
            <Skeleton className="mx-auto h-4 w-6" />
          </TableCell>
          <TableCell className="px-3 py-3"><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell className="px-3 py-3"><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell className="px-3 py-3"><Skeleton className="h-3 w-full max-w-60" /></TableCell>
          <TableCell className="px-3 py-3 text-center"><Skeleton className="mx-auto h-5 w-24 rounded-full" /></TableCell>
          <TableCell className="px-3 py-3 text-right"><Skeleton className="ml-auto h-3 w-20" /></TableCell>
          <TableCell className="px-3 py-3 text-right"><Skeleton className="ml-auto h-8 w-20 rounded-lg" /></TableCell>
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
          Đang cập nhật dữ liệu...
        </p>
      ) : null}
      <div className="overflow-x-auto">
        <Table className="min-w-245 text-left">
          <TableHeader className="ui-table-header">
            <TableRow>
              <TableHead className="ui-label w-12 px-3 py-3 text-center">STT</TableHead>
              <TableHead className="ui-label px-3 py-3">Mã đơn</TableHead>
              <TableHead className="ui-label px-3 py-3">Khách hàng</TableHead>
              <TableHead className="ui-label px-3 py-3">Địa chỉ giao</TableHead>
              <TableHead className="ui-label px-3 py-3 text-center">Trạng thái</TableHead>
              <TableHead className="ui-label px-3 py-3 text-right">Tạo lúc</TableHead>
              <TableHead className="ui-label px-3 py-3 text-right">Thao tác</TableHead>
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
                    <TableCell className="px-3 py-3 text-center">
                      <span className="tabular-nums text-xs font-medium text-muted-foreground">
                        {page * pageSize + index + 1}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-sm font-semibold text-foreground">
                      {item.soNumber || `SO-${item.id.slice(0, 8)}`}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-sm text-foreground/85">
                      {item.customerName || "-"}
                    </TableCell>
                    <TableCell className="max-w-80 px-3 py-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {item.shippingAddress ? formatShippingShort(item.shippingAddress) : "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-center">
                      <StatusBadge tone={statusTone(item.status)}>
                        {salesOrderStatusLabel(item.status)}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right text-xs text-muted-foreground">
                      {formatOrderCreatedAt(item.createdAt)}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="h-8 w-8 rounded-lg"
                            >
                              <MoreHorizontal className="h-4 w-4" />
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
                            <Eye className="mr-2 h-4 w-4" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          {canManageOrders ? (
                            <>
                              <DropdownMenuItem
                                className="rounded-lg text-muted-foreground"
                                disabled
                              >
                                <Edit2 className="mr-2 h-4 w-4" />
                                Sửa thông tin
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="rounded-lg text-destructive focus:text-destructive"
                                disabled={item.status !== "DRAFT" && item.status !== "PENDING"}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
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
