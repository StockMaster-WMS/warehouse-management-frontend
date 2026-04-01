"use client";
import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  Plus,
  Package,
  MapPin,
  AlertCircle,
  Hash,
  ListOrdered
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { ProductTableRow } from "@/components/features/ProductTableRow";
import { AdvancedFilterActions, AdvancedFilterPanel } from "@/components/features/AdvancedFilters";

const DeleteConfirmDialog = dynamic(
  () => import("@/components/features/DeleteConfirmDialog").then((m) => m.DeleteConfirmDialog),
  { ssr: false },
);
const ProductImportExportMenu = dynamic(
  () => import("@/components/features/ProductImportExportMenu").then((m) => m.ProductImportExportMenu),
  { ssr: false },
);
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetProductsQuery } from "@/store/services/product.service";
import { useGetCategoriesQuery } from "@/store/services/category.service";
import { useGetWarehousesQuery } from "@/store/services/warehouse.service";
import { CategoryTreeSelectItems } from "@/components/features/CategoryTreeSelectItems";
import { apiErrMessage } from "@/types/api";

const PAGE_SIZE = 20;
const SKELETON_ROWS = 6;
const COL_COUNT = 10;

function ProductTableSkeleton() {
  return (
    <>
      {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
        <TableRow key={`product-skeleton-${i}`}>
          <TableCell className="px-3 py-3 text-center">
            <Skeleton className="mx-auto h-5 w-6 rounded" />
          </TableCell>
          <TableCell className="px-3 py-3"><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell className="px-3 py-3"><Skeleton className="h-4 w-full max-w-60" /></TableCell>
          <TableCell className="px-3 py-3"><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell className="px-3 py-3"><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell className="px-3 py-3 text-center"><Skeleton className="mx-auto h-4 w-8" /></TableCell>
          <TableCell className="px-3 py-3 text-center"><Skeleton className="mx-auto h-4 w-10" /></TableCell>
          <TableCell className="px-3 py-3 text-center"><Skeleton className="mx-auto h-5 w-20 rounded-full" /></TableCell>
          <TableCell className="px-3 py-3"><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell className="px-3 py-3 text-right"><Skeleton className="ml-auto h-8 w-8 rounded-lg" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default function ProductsPage() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedKeyword = useDebouncedValue(searchInput.trim());
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"" | "ACTIVE" | "INACTIVE">("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const listParams = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      sort: "updatedAt",
      keyword: debouncedKeyword || undefined,
      status: statusFilter || undefined,
      categoryId: categoryFilter || undefined,
      warehouseId: warehouseFilter || undefined,
    }),
    [page, debouncedKeyword, statusFilter, categoryFilter, warehouseFilter],
  );

  const { data, error, isLoading, isFetching, refetch } = useGetProductsQuery(listParams);
  const products = useMemo(() => data?.data?.content ?? [], [data]);
  const totalElements = data?.data?.total_elements ?? 0;
  const serverTotalPages = data?.data?.total_pages ?? 0;
  const canGoPrev = page > 0;
  const canGoNext = serverTotalPages > 0 && page < serverTotalPages - 1;

  const {
    data: categoryOptionsData,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useGetCategoriesQuery();
  const {
    data: warehouseOptionsData,
    isLoading: warehousesLoading,
    error: warehousesError,
    refetch: refetchWarehouses,
  } = useGetWarehousesQuery({
    page: 0,
    size: 200,
    sort: "createdAt",
    sortDir: "desc",
  });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState("");

  const hasAnyFilter =
    searchInput.trim().length > 0 ||
    Boolean(statusFilter) ||
    Boolean(categoryFilter) ||
    Boolean(warehouseFilter);
  const advancedCount =
    Number(Boolean(statusFilter)) + Number(Boolean(categoryFilter)) + Number(Boolean(warehouseFilter));

  const clearFilters = () => {
    setSearchInput("");
    setStatusFilter("");
    setCategoryFilter("");
    setWarehouseFilter("");
    setPage(0);
    setAdvancedOpen(false);
  };

  const handleRequestDelete = useCallback((name: string) => {
    setItemToDelete(name);
    setIsDeleteDialogOpen(true);
  }, []);

  const stats = useMemo(() => {
    const pageLabel =
      totalElements === 0 ? "—" : `${page + 1} / ${data?.data?.total_pages ?? 1}`;

    return [
      { label: "Tổng SKU", value: totalElements.toString(), icon: Hash, color: "text-blue-500" },
      { label: "Trang (hiện tại / tổng)", value: pageLabel, icon: ListOrdered, color: "text-indigo-500" },
      { label: "Vị trí lưu trữ", value: "N/A", icon: MapPin, color: "text-emerald-500" },
      { label: "Giá trị hàng", value: "N/A", icon: Package, color: "text-slate-400" },
    ];
  }, [totalElements, page, data?.data?.total_pages]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Sản phẩm"
        description="Quản lý thông tin SKU, tồn kho đa điểm và vị trí lưu trữ."
        actions={
          <div className="flex items-center gap-2">
            <ProductImportExportMenu products={products} pageIndex={page} listParams={listParams} />
            <Button
              render={<Link href="/products/new" />}
              nativeButton={false}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tạo mới Sản phẩm
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {stat.label}
              </span>
              <stat.icon className={`h-4 w-4 ${stat.color} opacity-70`} />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <SearchToolbar
        placeholder="Tìm kiếm sản phẩm"
        value={searchInput}
        onValueChange={(value) => {
          setSearchInput(value);
          setPage(0);
        }}
        right={
          <AdvancedFilterActions
            open={advancedOpen}
            onToggle={() => setAdvancedOpen((v) => !v)}
            activeCount={advancedCount}
            hasAnyFilter={hasAnyFilter}
            onClear={clearFilters}
          />
        }
        filters={
          <AdvancedFilterPanel
            open={advancedOpen}
            summary={
              advancedCount > 0 ? (
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                  {statusFilter ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                      Trạng thái:{" "}
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {statusFilter === "ACTIVE" ? "Hoạt động" : "Ngưng"}
                      </span>
                    </span>
                  ) : null}
                  {categoryFilter ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                      Nhóm:{" "}
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {categoryOptionsData?.data?.content?.find((x) => x.id === categoryFilter)?.code ??
                          categoryOptionsData?.data?.content?.find((x) => x.id === categoryFilter)?.name ??
                          "—"}
                      </span>
                    </span>
                  ) : null}
                  {warehouseFilter ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                      Kho:{" "}
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {warehouseOptionsData?.data?.content?.find((x) => x.id === warehouseFilter)?.code ??
                          warehouseOptionsData?.data?.content?.find((x) => x.id === warehouseFilter)?.name ??
                          "—"}
                      </span>
                    </span>
                  ) : null}
                </div>
              ) : null
            }
          >
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v === "ACTIVE" || v === "INACTIVE" ? v : "");
                setPage(0);
              }}
            >
              <SelectTrigger className="h-10 w-full rounded-xl border border-slate-200 bg-white sm:w-42 dark:border-slate-800 dark:bg-slate-900">
                <SelectValue placeholder="Trạng thái">
                  {(val) =>
                    val === "ACTIVE"
                      ? "Hoạt động"
                      : val === "INACTIVE"
                        ? "Ngưng"
                        : "Tất cả trạng thái"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="" className="rounded-lg">Tất cả trạng thái</SelectItem>
                <SelectItem value="ACTIVE" className="rounded-lg">Hoạt động</SelectItem>
                <SelectItem value="INACTIVE" className="rounded-lg">Ngưng</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={categoryFilter}
              onValueChange={(v) => {
                setCategoryFilter(v ?? "");
                setPage(0);
              }}
            >
              <SelectTrigger className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white sm:max-w-60 sm:w-55 dark:border-slate-800 dark:bg-slate-900">
                <SelectValue
                  placeholder={
                    categoriesLoading
                      ? "Đang tải nhóm..."
                      : categoriesError
                        ? "Lỗi nhóm hàng"
                        : "Tất cả nhóm hàng"
                  }
                >
                  {(val) => {
                    if (!val) return "Tất cả nhóm hàng";
                    const c = categoryOptionsData?.data?.content?.find((x) => x.id === val);
                    return c ? `${c.name} (${c.code})` : "Đang tải…";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-72 rounded-xl">
                {categoriesError ? (
                  <div className="px-2 py-1.5 text-xs text-rose-500">
                    Không tải được nhóm.
                    <button
                      type="button"
                      onClick={() => refetchCategories()}
                      className="ml-1 underline"
                    >
                      Thử lại
                    </button>
                  </div>
                ) : null}
                <SelectItem value="" className="rounded-lg">Tất cả nhóm hàng</SelectItem>
                {categoryOptionsData?.data?.content?.length ? (
                  <CategoryTreeSelectItems
                    categories={categoryOptionsData.data.content}
                    itemClassName="rounded-lg"
                  />
                ) : null}
              </SelectContent>
            </Select>

            <Select
              value={warehouseFilter}
              onValueChange={(v) => {
                setWarehouseFilter(v ?? "");
                setPage(0);
              }}
            >
              <SelectTrigger className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white sm:max-w-60 sm:w-55 dark:border-slate-800 dark:bg-slate-900">
                <SelectValue
                  placeholder={
                    warehousesLoading
                      ? "Đang tải kho..."
                      : warehousesError
                        ? "Lỗi tải kho"
                        : "Tất cả kho"
                  }
                >
                  {(val) => {
                    if (!val) return "Tất cả kho";
                    const w = warehouseOptionsData?.data?.content?.find((x) => x.id === val);
                    return w ? `${w.name} (${w.code || "—"})` : "Đang tải…";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-72 rounded-xl">
                {warehousesError ? (
                  <div className="px-2 py-1.5 text-xs text-rose-500">
                    Không tải được danh sách kho.
                    <button
                      type="button"
                      onClick={() => refetchWarehouses()}
                      className="ml-1 underline"
                    >
                      Thử lại
                    </button>
                  </div>
                ) : null}
                <SelectItem value="" className="rounded-lg">Tất cả kho</SelectItem>
                {warehouseOptionsData?.data?.content?.map((w) => (
                  <SelectItem key={w.id} value={w.id} className="rounded-lg">
                    {w.name} {w.code ? `(${w.code})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AdvancedFilterPanel>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isFetching && !isLoading ? (
          <p className="border-b border-slate-100 bg-slate-50 px-6 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
            Đang cập nhật dữ liệu...
          </p>
        ) : null}
        <div className="overflow-x-auto">
          <Table className="min-w-260 text-left">
            <TableHeader className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 text-xs font-semibold text-slate-500 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
              <TableRow>
                <TableHead className="w-12 px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">STT</TableHead>
                <TableHead className="w-[30 px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Mã SKU</TableHead>
                <TableHead className="min-w-50 px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Tên sản phẩm</TableHead>
                <TableHead className="w-[33 px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Mã vạch</TableHead>
                <TableHead className="min-w-35 px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Nhóm hàng</TableHead>
                <TableHead className="w-16 px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">ĐVT</TableHead>
                <TableHead className="w-25 px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">NCC chính</TableHead>
                <TableHead className="w-30 px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</TableHead>
                <TableHead className="w-25 px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Cập nhật</TableHead>
                <TableHead className="w-12 px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <span className="sr-only">Thao tác</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <ProductTableSkeleton />
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={COL_COUNT} className="p-0">
                    <EmptyState
                      icon={AlertCircle}
                      title="Không thể tải dữ liệu sản phẩm"
                      description={apiErrMessage(error, "Đã xảy ra lỗi khi tải danh sách sản phẩm.")}
                      action={
                        <Button variant="outline" size="sm" onClick={() => refetch()}>
                          Thử lại
                        </Button>
                      }
                      className="py-10"
                    />
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COL_COUNT} className="p-0">
                    <EmptyState
                      icon={Package}
                      title={hasAnyFilter ? "Không có sản phẩm khớp bộ lọc" : "Chưa có sản phẩm nào"}
                      description={
                        hasAnyFilter
                          ? "Thử đổi từ khóa, bộ lọc hoặc chuyển trang."
                          : "Bắt đầu bằng cách tạo sản phẩm đầu tiên cho kho."
                      }
                      action={
                        hasAnyFilter ? (
                          <Button variant="outline" size="sm" onClick={clearFilters}>Xóa bộ lọc</Button>
                        ) : (
                          <Button
                            render={<Link href="/products/new" />}
                            nativeButton={false}
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Tạo sản phẩm
                          </Button>
                        )
                      }
                      className="py-10"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product, index) => (
                  <ProductTableRow
                    key={product.id}
                    product={product}
                    rowNumber={page * PAGE_SIZE + index + 1}
                    onRequestDelete={handleRequestDelete}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {products.length > 0 ? (
                <>
                  Hiển thị{" "}
                  <span className="tabular-nums font-semibold text-slate-700 dark:text-slate-200">
                    {page * PAGE_SIZE + 1}–{page * PAGE_SIZE + products.length}
                  </span>{" "}
                  / <span className="tabular-nums">{totalElements}</span> sản phẩm
                  {serverTotalPages > 1 ? (
                    <span className="text-slate-400">
                      {" "}· Trang{" "}
                      <span className="tabular-nums font-medium text-slate-600 dark:text-slate-300">
                        {page + 1}/{serverTotalPages}
                      </span>
                    </span>
                  ) : null}
                </>
              ) : (
                <>Không có bản ghi trên trang này · Tổng {totalElements} sản phẩm</>
              )}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!canGoPrev || isFetching}
                className="h-8 px-3 text-xs border-slate-200"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!canGoNext || isFetching}
                className="h-8 px-3 text-xs border-slate-200"
                onClick={() => setPage((p) => p + 1)}
              >
                Tiếp theo
              </Button>
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={() => {
          setIsDeleteDialogOpen(false);
        }}
        itemName={itemToDelete}
      />
    </div>
  );
}
