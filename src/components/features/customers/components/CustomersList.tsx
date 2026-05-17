import Link from "next/link";
import {
  AlertCircle,
  Edit2,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { apiErrMessage } from "@/types/api";
import {
  customerStatusClass,
  customerStatusLabel,
  formatCustomerAddress,
  type Customer,
} from "@/types/customer";

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
  onPageSizeChange?: (size: number) => void;
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
  onPageSizeChange,
  onRequestDelete,
  noContainer = false,
}: CustomersListProps) {
  const content = (
    <>
      {isFetching && !isLoading ? (
        <p className="border-b border-slate-100 bg-slate-50 px-6 py-1.5 text-[11px] font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
          Đang cập nhật dữ liệu…
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <Table className="min-w-[700px] table-fixed">
          <TableHeader className="bg-slate-50/60 dark:bg-slate-800/40">
            <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
              <TableHead className="pl-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ width: '30%' }}>
                Khách hàng
              </TableHead>
              <TableHead className="py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ width: '18%' }}>
                Liên hệ
              </TableHead>
              <TableHead className="py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ width: '30%' }}>
                Địa chỉ
              </TableHead>
              <TableHead className="py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ width: '14%' }}>
                Trạng thái
              </TableHead>
              <TableHead className="pr-4 py-3" style={{ width: '8%' }} />
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`sk-${i}`} className="hover:bg-transparent">
                  <TableCell className="pl-5 py-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-3 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-3 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <EmptyState
                    icon={AlertCircle}
                    title="Không tải được danh sách"
                    description={apiErrMessage(error)}
                    action={
                      <Button variant="outline" size="sm" onClick={onRetry}>
                        Thử lại
                      </Button>
                    }
                    className="py-12"
                  />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <EmptyState
                    icon={Users}
                    title="Chưa có khách hàng"
                    description={
                      hasAnyFilter
                        ? "Không có kết quả khớp tìm kiếm. Thử từ khóa khác."
                        : "Thêm khách hàng mới hoặc kiểm tra dữ liệu trên server."
                    }
                    className="py-12"
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="group border-b border-slate-50 last:border-0 hover:bg-indigo-50/40 dark:border-slate-800/60 dark:hover:bg-slate-800/30 transition-colors"
                >
                  {/* Customer info */}
                  <TableCell className="pl-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-indigo-50 text-indigo-600 text-sm font-black ring-1 ring-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400">
                          {customer.name[0]?.toUpperCase() ?? "K"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <Link
                          href={`/customers/${customer.id}/edit`}
                          className="block truncate text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors dark:text-white"
                        >
                          {customer.name}
                        </Link>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{customer.code} · {customer.email ?? "—"}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Contact */}
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                      {customer.phone && <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                      <span className="truncate">
                        {customer.contactName || customer.phone || "—"}
                      </span>
                    </div>
                  </TableCell>

                  {/* Address */}
                  <TableCell className="py-3.5">
                    <div className="flex items-start gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">
                        {formatCustomerAddress(customer.address) || "—"}
                      </span>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3.5">
                    <span className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                      customerStatusClass(customer.isActive)
                    )}>
                      {customerStatusLabel(customer.isActive)}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="pr-4 py-3.5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-8 w-8 rounded-lg hover:bg-white dark:hover:bg-slate-700 ring-1 ring-border transition-all"
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
        onPageSizeChange={onPageSizeChange}
      />
    </>
  );

  if (noContainer) return content;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {content}
    </div>
  );
}
