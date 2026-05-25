import Link from "next/link";
import {
  AlertCircle,
  Building2,
  Edit2,
  ExternalLink,
  Mail,
  MoreHorizontal,
  Phone,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { statusTone } from "@/lib/design-system";
import { apiErrMessage } from "@/types/api";
import {
  getSupplierDisplayName,
  supplierStatusLabel,
  type Supplier,
} from "@/types/supplier";

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN");
}

type SuppliersTableProps = {
  rows: Supplier[];
  page: number;
  totalElements: number;
  totalPages: number;
  pageSize: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  hasAnyFilter: boolean;
  onRetry: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onPageSizeChange?: (size: number) => void;
  onRequestDelete: (supplier: Supplier) => void;
  noContainer?: boolean;
};

export function SuppliersTable({
  rows,
  page,
  totalElements,
  totalPages,
  pageSize,
  canGoPrev,
  canGoNext,
  isLoading,
  isFetching,
  isError,
  error,
  hasAnyFilter,
  onRetry,
  onPrevPage,
  onNextPage,
  onPageSizeChange,
  onRequestDelete,
  noContainer = false,
}: SuppliersTableProps) {
  const content = (
    <>
      {isFetching && !isLoading ? (
        <p className="ui-updating-banner">Đang cập nhật dữ liệu…</p>
      ) : null}
      <div className="overflow-x-auto">
        <table className="min-w-250 w-full text-left">
          <thead className="ui-table-header">
            <tr>
              <th className="ui-label px-6 py-4">Nhà cung cấp</th>
              <th className="ui-label px-6 py-4">Liên hệ</th>
              <th className="ui-label px-6 py-4">Thanh toán / Giao hàng</th>
              <th className="ui-label px-6 py-4">Địa chỉ</th>
              <th className="ui-label px-6 py-4 text-center">Trạng thái</th>
              <th className="ui-label px-6 py-4">Tạo lúc</th>
              <th className="ui-label px-6 py-4 text-right" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, rowIndex) => (
                <tr key={`supplier-skeleton-${rowIndex}`} className="hover:bg-transparent">
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="mt-2 h-3 w-28" />
                  </td>
                  <td className="space-y-2 px-6 py-4">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </td>
                  <td className="space-y-2 px-6 py-4">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-3 w-full max-w-45" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Skeleton className="mx-auto h-5 w-16 rounded-full" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-3 w-28" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Skeleton className="ml-auto size-8 rounded-lg" />
                  </td>
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={7} className="p-0">
                  <EmptyState
                    icon={AlertCircle}
                    title="Không tải được danh sách"
                    description={apiErrMessage(error)}
                    action={
                      <Button variant="outline" size="sm" onClick={onRetry}>
                        Thử lại
                      </Button>
                    }
                    className="py-10"
                  />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-0">
                  <EmptyState
                    icon={Building2}
                    title="Chưa có nhà cung cấp"
                    description={
                      hasAnyFilter
                        ? "Không có kết quả khớp tìm kiếm. Thử từ khóa khác."
                        : "Thêm đối tác hoặc kiểm tra dữ liệu trên server."
                    }
                    className="py-10"
                  />
                </td>
              </tr>
            ) : (
              rows.map((supplier) => {
                const name = getSupplierDisplayName(supplier);
                const tax = supplier.taxCode?.trim();
                const sub = [supplier.code, tax ? `MST ${tax}` : null]
                  .filter(Boolean)
                  .join(" - ");

                return (
                  <tr key={supplier.id} className="ui-table-row group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold leading-tight text-foreground">
                          {name}
                        </span>
                        <span className="mt-1 font-mono text-[10px] font-medium text-muted-foreground">
                          {sub || supplier.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/85">
                          <User className="size-3 shrink-0 text-muted-foreground" />
                          <span className="truncate">{supplier.contactName ?? "-"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <Mail className="size-3 shrink-0 text-muted-foreground" />
                          <span className="truncate">{supplier.contactEmail ?? "-"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="size-3 shrink-0 text-muted-foreground" />
                          {supplier.contactPhone ?? "-"}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-muted-foreground">
                      <div>
                        TT: {supplier.paymentTerms != null ? `${supplier.paymentTerms} ngày` : "-"}
                      </div>
                      <div className="mt-0.5">
                        Lead: {supplier.leadTimeDays != null ? `${supplier.leadTimeDays} ngày` : "-"}
                      </div>
                    </td>
                    <td className="max-w-55 px-6 py-4">
                      <span className="line-clamp-2 text-xs text-muted-foreground">
                        {supplier.address ?? "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge tone={statusTone(supplier.status)}>
                        {supplierStatusLabel(supplier.status)}
                      </StatusBadge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-muted-foreground">
                      {formatDateTime(supplier.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon-sm" className="size-8 rounded-lg">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-48 rounded-lg">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                          </DropdownMenuGroup>
                          <DropdownMenuItem
                            className="rounded-lg"
                            render={<Link href={`/suppliers/${supplier.id}/edit`} />}
                          >
                            <Edit2 className="mr-2 size-4" />
                            Sửa thông tin
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg">
                            <ExternalLink className="mr-2 size-4" />
                            Lịch sử nhập hàng
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="rounded-lg text-destructive focus:text-destructive"
                            onClick={() => onRequestDelete(supplier)}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Xóa đối tác
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
        <PaginationFooter
          itemLabel="nhà cung cấp"
          rowsCount={rows.length}
          page={page}
          totalElements={totalElements}
          totalPages={totalPages}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          isLoading={isLoading}
          isError={isError}
          isFetching={isFetching}
          errorText="Không tải được dữ liệu trang này."
          onPrevPage={onPrevPage}
          onNextPage={onNextPage}
          pageSize={pageSize}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </>
  );

  if (noContainer) {
    return content;
  }

  return <div className="ui-surface overflow-hidden">{content}</div>;
}
