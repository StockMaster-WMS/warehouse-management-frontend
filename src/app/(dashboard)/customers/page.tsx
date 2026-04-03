"use client";

import { useMemo, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import Link from "next/link";
import { toast } from "sonner";
import {
  UserPlus,
  Mail,
  MoreHorizontal,
  Edit2,
  Trash2,
  AlertCircle,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/page-header";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { AdvancedFilterActions, AdvancedFilterPanel } from "@/components/features/AdvancedFilters";
import { FilterGroup } from "@/components/features/FilterGroup";
import { DeleteConfirmDialog } from "@/components/features/DeleteConfirmDialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetCustomersQuery, useDeleteCustomerMutation } from "@/store/services/customer.service";
import { apiErrMessage, type PagedResponse } from "@/types/api";
import type { Customer } from "@/types/customer";
import { customerCategoryLabel } from "@/types/customer";

const PAGE_SIZE = 20;

const CATEGORY_API_MAP: Record<string, string> = {
  "Cá nhân": "INDIVIDUAL",
  "Nhà buôn": "WHOLESALE",
};

const ALL_CATEGORY = "Tất cả phân loại";

export default function CustomersPage() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedKeyword = useDebouncedValue(searchInput.trim());
  const [page, setPage] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORY);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const categoryApiValue = CATEGORY_API_MAP[categoryFilter];

  const { data, isLoading, isFetching, isError, error, refetch } = useGetCustomersQuery({
    page,
    size: PAGE_SIZE,
    keyword: debouncedKeyword || undefined,
    category: categoryApiValue,
  });

  const [deleteCustomer] = useDeleteCustomerMutation();

  const pagedBody = data?.data;
  const rows = useMemo(() => pagedBody?.content ?? [], [pagedBody]);

  const paged = useMemo((): Pick<
    PagedResponse<Customer>,
    "page" | "size" | "total_elements" | "total_pages"
  > | null => {
    if (!pagedBody || typeof pagedBody.page !== "number" || typeof pagedBody.total_pages !== "number") return null;
    return {
      page: pagedBody.page,
      size: pagedBody.size,
      total_elements: pagedBody.total_elements,
      total_pages: pagedBody.total_pages,
    };
  }, [pagedBody]);

  const canGoPrev = page > 0;
  const canGoNext = paged != null && paged.total_pages > 0 && page < paged.total_pages - 1;

  const hasAnyFilter = searchInput.trim().length > 0 || categoryFilter !== ALL_CATEGORY;
  const advancedCount = Number(categoryFilter !== ALL_CATEGORY);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteCustomer(deleteTarget.id).unwrap();
      toast.success(`Đã xóa khách hàng "${deleteTarget.name}"`);
    } catch (err) {
      toast.error(apiErrMessage(err));
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Khách hàng"
        description="Duy trì mối quan hệ và quản lý thông tin khách hàng/nhà cung cấp."
        actions={
          <Button
            render={<Link href="/customers/new" />}
            nativeButton={false}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Thêm mới
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Tổng khách hàng", value: "—" },
          { label: "Khách mới tháng này", value: "—" },
          { label: "Khách hàng VIP", value: "—" },
          { label: "Tỷ lệ quay lại", value: "—" },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      <SearchToolbar
        placeholder="Tìm theo tên, email, số điện thoại..."
        value={searchInput}
        onValueChange={setSearchInput}
        right={
          <AdvancedFilterActions
            open={advancedOpen}
            onToggle={() => setAdvancedOpen((v) => !v)}
            activeCount={advancedCount}
            hasAnyFilter={hasAnyFilter}
            onClear={() => {
              setSearchInput("");
              setCategoryFilter(ALL_CATEGORY);
              setPage(0);
              setAdvancedOpen(false);
            }}
          />
        }
        filters={
          <AdvancedFilterPanel
            open={advancedOpen}
            summary={
              advancedCount > 0 ? (
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                  {categoryFilter !== ALL_CATEGORY ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                      Phân loại:{" "}
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{categoryFilter}</span>
                    </span>
                  ) : null}
                </div>
              ) : null
            }
          >
            <FilterGroup
              hasAnyFilter={hasAnyFilter}
              onClear={() => {
                setSearchInput("");
                setCategoryFilter(ALL_CATEGORY);
                setPage(0);
                setAdvancedOpen(false);
              }}
              showTitle={false}
              showClear={false}
              filters={[
                {
                  label: "phân loại",
                  placeholder: "Phân loại",
                  value: categoryFilter,
                  onChange: (v) => {
                    setCategoryFilter(v);
                    setPage(0);
                  },
                  options: ["Cá nhân", "Nhà buôn"],
                  width: "sm:w-[180px]",
                },
              ]}
            />
          </AdvancedFilterPanel>
        }
      />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {isFetching && !isLoading ? (
          <p className="border-b border-slate-100 bg-slate-50 px-6 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
            Đang cập nhật dữ liệu…
          </p>
        ) : null}

        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="flex items-center justify-between p-4">
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
                <Button variant="outline" size="sm" onClick={() => refetch()}>
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
            rows.map((customer: Customer) => (
              <div key={customer.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold">{customer.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{customer.name}</span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <Mail className="h-3 w-3" />
                      <span>{customer.email ?? "—"}</span>
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-8">
                  <div className="flex flex-col items-start min-w-30">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Số điện thoại</span>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{customer.phone ?? "—"}</span>
                  </div>
                  <div className="flex flex-col items-start min-w-30">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phân loại</span>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{customerCategoryLabel(customer.category)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon-sm" className="h-8 w-8 rounded-lg hover:bg-white dark:hover:bg-slate-700">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-48 rounded-xl">
                      <DropdownMenuItem
                        className="rounded-lg"
                        render={<Link href={`/customers/${customer.id}/edit`} />}
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        Sửa hồ sơ
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="rounded-lg text-rose-600 focus:text-rose-600"
                        onClick={() => {
                          setDeleteTarget({ id: customer.id, name: customer.name });
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa khách hàng
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>

        <PaginationFooter
          itemLabel="khách hàng"
          rowsCount={rows.length}
          page={page}
          totalElements={paged?.total_elements ?? rows.length}
          totalPages={paged?.total_pages ?? 1}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          isLoading={isLoading}
          isError={isError}
          isFetching={isFetching}
          errorText="Không tải được dữ liệu trang này."
          onPrevPage={() => setPage((p) => Math.max(0, p - 1))}
          onNextPage={() => setPage((p) => p + 1)}
          pageSize={paged?.size ?? PAGE_SIZE}
        />
      </div>

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        itemName={deleteTarget?.name ?? ""}
        title="Xóa hồ sơ khách hàng"
        description="Xóa khách hàng sẽ gỡ bỏ lịch sử giao dịch liên quan. Hãy cân nhắc kỹ."
      />
    </div>
  );
}
