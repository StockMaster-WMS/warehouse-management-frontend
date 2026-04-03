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
import { apiErrMessage } from "@/types/api";
import {
  getSupplierDisplayName,
  isSupplierActive,
  supplierStatusLabel,
  type Supplier,
} from "@/types/supplier";

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
  onRequestDelete: (supplier: Supplier) => void;
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
  onRequestDelete,
}: SuppliersTableProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      {isFetching && !isLoading ? (
        <p className="border-b border-slate-100 bg-slate-50 px-6 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
          Đang cập nhật dữ liệu…
        </p>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
            <tr>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Nhà cung cấp</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Liên hệ</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Thanh toán / Giao hàng</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Địa chỉ</th>
              <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</th>
              <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, rowIndex) => (
                <tr key={`supplier-skeleton-${rowIndex}`} className="hover:bg-transparent">
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="mt-2 h-3 w-28" />
                  </td>
                  <td className="px-6 py-4 space-y-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </td>
                  <td className="px-6 py-4 space-y-2">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-3 w-full max-w-45" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Skeleton className="mx-auto h-5 w-16 rounded-full" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Skeleton className="ml-auto h-8 w-8 rounded-lg" />
                  </td>
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={6} className="p-0">
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
                <td colSpan={6} className="p-0">
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
                const sub = [supplier.code, tax ? `MST ${tax}` : null].filter(Boolean).join(" • ");
                const activeLike = isSupplierActive(supplier.status);

                return (
                  <tr
                    key={supplier.id}
                    className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold leading-tight text-slate-900 dark:text-white">{name}</span>
                        <span className="mt-1 font-mono text-[10px] font-medium text-slate-500">{sub || supplier.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <User className="h-3 w-3 shrink-0 text-slate-400" />
                          <span className="truncate">{supplier.contactName ?? "—"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                          <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                          <span className="truncate">{supplier.contactEmail ?? "—"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                          {supplier.contactPhone ?? "—"}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-600 dark:text-slate-300">
                      <div>TT: {supplier.paymentTerms != null ? `${supplier.paymentTerms} ngày` : "—"}</div>
                      <div className="mt-0.5 text-slate-500">Lead: {supplier.leadTimeDays != null ? `${supplier.leadTimeDays} ngày` : "—"}</div>
                    </td>
                    <td className="max-w-55 px-6 py-4">
                      <span className="line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{supplier.address ?? "—"}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          activeLike
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {supplierStatusLabel(supplier.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon-sm" className="h-8 w-8 rounded-lg">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-48 rounded-xl">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                          </DropdownMenuGroup>
                          <DropdownMenuItem className="rounded-lg" render={<Link href={`/suppliers/${supplier.id}/edit`} />}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Sửa thông tin
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Lịch sử nhập hàng
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="rounded-lg text-rose-600 focus:text-rose-600"
                            onClick={() => onRequestDelete(supplier)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
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
        />
      </div>
    </div>
  );
}
