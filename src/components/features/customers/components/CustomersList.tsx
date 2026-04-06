import Link from "next/link";
import {
  AlertCircle,
  Edit2,
  Mail,
  MoreHorizontal,
  Trash2,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrMessage } from "@/types/api";
import { customerCategoryLabel, type Customer } from "@/types/customer";

type CustomersListProps = {
  rows: Customer[];
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
  onRequestDelete: (target: { id: string; name: string }) => void;
  noContainer?: boolean;
};

export function CustomersList({
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
  onRequestDelete,
  noContainer = false,
}: CustomersListProps) {
  const content = (
    <>
      {isFetching && !isLoading ? (
        <p className="border-b border-slate-100 bg-slate-50 px-6 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
          Đang cập nhật dữ liệu…
        </p>
      ) : null}

      <div className="divide-y divide-slate-50 dark:divide-slate-800">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
              </div>
              <div className="hidden md:flex items-center gap-8">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          ))
        ) : isError ? (
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
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Chưa có khách hàng"
            description={
              hasAnyFilter
                ? "Không có kết quả khớp tìm kiếm. Thử từ khóa khác."
                : "Thêm khách hàng mới hoặc kiểm tra dữ liệu trên server."
            }
            className="py-10"
          />
        ) : (
          rows.map((customer) => (
            <div
              key={customer.id}
              className="flex items-center justify-between p-4 hover:bg-indigo-50/40 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-white/80 text-indigo-600 font-black shadow-sm ring-1 ring-slate-100">
                    {customer.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{customer.name}</span>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <Mail className="h-3 w-3" />
                    <span>{customer.email ?? "—"}</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-8">
                <div className="flex flex-col items-start min-w-30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Số điện thoại</span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{customer.phone ?? "—"}</span>
                </div>
                <div className="flex flex-col items-start min-w-30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phân loại</span>
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    {customerCategoryLabel(customer.category)}
                  </span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-8 w-8 rounded-lg hover:bg-white dark:hover:bg-slate-700 shadow-sm"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                  <DropdownMenuItem className="rounded-lg" render={<Link href={`/customers/${customer.id}/edit`} />}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Sửa hồ sơ
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-lg text-rose-600 focus:text-rose-600"
                    onClick={() => onRequestDelete({ id: customer.id, name: customer.name })}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Xóa khách hàng
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>

      <PaginationFooter
        itemLabel="khách hàng"
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
      />
    </>
  );

  if (noContainer) {
    return content;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      {content}
    </div>
  );
}
