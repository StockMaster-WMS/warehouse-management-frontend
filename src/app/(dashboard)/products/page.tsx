"use client";
import { useMemo, useState } from "react";
import {
  Plus,
  Download,
  Package,
  ChevronRight,
  MoreHorizontal,
  MapPin,
  AlertCircle,
  Hash,
  Edit2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { FilterGroup } from "@/components/features/FilterGroup";
import { DeleteConfirmDialog } from "@/components/features/DeleteConfirmDialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetProductsQuery } from "@/store/services/product.service";
import { getProductCategoryDisplayName } from "@/types/product";


export default function ProductsPage() {
  const [query, setQuery] = useState("");

  const { data, error, isLoading, isFetching, refetch } = useGetProductsQuery();
  const products = useMemo(() => data?.data?.content ?? [], [data]);
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const name = p.name?.toLowerCase() ?? "";
      const sku = p.sku?.toLowerCase() ?? "";
      const category = getProductCategoryDisplayName(p).toLowerCase();
      const barcode = p.barcodeEan13?.toLowerCase() ?? "";
      return (
        name.includes(q) ||
        sku.includes(q) ||
        category.includes(q) ||
        barcode.includes(q)
      );
    });
  }, [products, query]);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState("");

  const hasAnyFilter = query.trim().length > 0;

  const stats = useMemo(() => {
    const totalSKU = data?.data?.total_elements ?? 0;
    const outOfStock = products.filter((p) => p.status !== "ACTIVE").length;
    // TODO: Calculate these values dynamically when data is available
    const totalLocations = "N/A";
    const totalValue = "N/A";

    return [
      {
        label: "Tổng SKU",
        value: totalSKU.toString(),
        icon: Hash,
        color: "text-blue-500",
      },
      {
        label: "Không hoạt động",
        value: outOfStock.toString(),
        icon: AlertCircle,
        color: "text-rose-500",
      },
      {
        label: "Vị trí lưu trữ",
        value: totalLocations,
        icon: MapPin,
        color: "text-emerald-500",
      },
      {
        label: "Giá trị hàng",
        value: totalValue,
        icon: Package,
        color: "text-indigo-500",
      },
    ];
  }, [products, data]);

  const formatDate = (value?: string) => {
    if (!value) return "--";
    return new Date(value).toLocaleDateString("vi-VN");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sản phẩm"
        description="Quản lý thông tin SKU, tồn kho đa điểm và vị trí lưu trữ."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex border-slate-200"
            >
              <Download className="mr-2 h-4 w-4" />
              Nhập/Xuất Excel
            </Button>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {stat.label}
              </span>
              <stat.icon className={`h-4 w-4 ${stat.color} opacity-70`} />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <SearchToolbar
        placeholder="Tìm theo tên, SKU, mã vạch hoặc nhóm hàng..."
        value={query}
        onValueChange={setQuery}
        filters={
          <FilterGroup
            hasAnyFilter={hasAnyFilter}
            onClear={() => {
              setQuery("");
            }}
            filters={[]}
          />
        }
      />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {isFetching && !isLoading ? (
          <p className="border-b border-slate-100 bg-slate-50 px-6 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
            Đang cập nhật dữ liệu...
          </p>
        ) : null}
        <div className="overflow-x-auto">
        <Table className="min-w-[1040px] text-left">
          <TableHeader className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 text-xs font-semibold text-slate-500 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
            <TableRow>
              <TableHead className="w-12 px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                STT
              </TableHead>
              <TableHead className="w-[120px] px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Mã SKU
              </TableHead>
              <TableHead className="min-w-[200px] px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Tên sản phẩm
              </TableHead>
              <TableHead className="w-[132px] px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Mã vạch
              </TableHead>
              <TableHead className="min-w-[140px] px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Nhóm hàng
              </TableHead>
              <TableHead className="w-16 px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                ĐVT
              </TableHead>
              <TableHead className="w-[100px] px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                NCC chính
              </TableHead>
              <TableHead className="w-[120px] px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Trạng thái
              </TableHead>
              <TableHead className="w-[108px] px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Cập nhật
              </TableHead>
              <TableHead className="w-12 px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span className="sr-only">Thao tác</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, rowIndex) => (
                <TableRow key={`product-skeleton-${rowIndex}`}>
                  <TableCell className="px-3 py-3 text-center">
                    <Skeleton className="mx-auto h-5 w-6 rounded" />
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <Skeleton className="h-4 w-full max-w-[240px]" />
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="px-3 py-3 text-center">
                    <Skeleton className="mx-auto h-4 w-8" />
                  </TableCell>
                  <TableCell className="px-3 py-3 text-center">
                    <Skeleton className="mx-auto h-4 w-10" />
                  </TableCell>
                  <TableCell className="px-3 py-3 text-center">
                    <Skeleton className="mx-auto h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="px-3 py-3 text-right">
                    <Skeleton className="ml-auto h-8 w-8 rounded-lg" />
                  </TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={10} className="p-0">
                  <EmptyState
                    icon={AlertCircle}
                    title="Không thể tải dữ liệu sản phẩm"
                    description={
                      (error as { data?: { message?: string } })?.data?.message ??
                      "Đã xảy ra lỗi khi tải danh sách sản phẩm."
                    }
                    action={
                      <Button variant="outline" size="sm" onClick={() => refetch()}>
                        Thử lại
                      </Button>
                    }
                    className="py-10"
                  />
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="p-0">
                  <EmptyState
                    icon={Package}
                    title={
                      hasAnyFilter
                        ? "Không có sản phẩm khớp bộ lọc"
                        : "Chưa có sản phẩm nào"
                    }
                    description={
                      hasAnyFilter
                        ? "Hãy thử đổi từ khóa tìm kiếm hoặc xóa bộ lọc hiện tại."
                        : "Bắt đầu bằng cách tạo sản phẩm đầu tiên cho kho."
                    }
                    action={
                      hasAnyFilter ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuery("")}
                        >
                          Xóa bộ lọc
                        </Button>
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
              filteredProducts.map((product, index) => {
                const categoryName = getProductCategoryDisplayName(product);
                const categoryLabel =
                  categoryName || (product.categoryId ? "—" : "Chưa gán danh mục");
                const categorySubline =
                  !categoryName && product.categoryId
                    ? `ID: ${product.categoryId}`
                    : "";

                return (
                <TableRow
                  key={product.id}
                  className="group transition-colors odd:bg-white even:bg-slate-50/40 hover:bg-indigo-50/40 dark:odd:bg-slate-900 dark:even:bg-slate-900/70 dark:hover:bg-slate-800/70"
                >
                  <TableCell className="px-3 py-3 text-center align-middle">
                    <span className="tabular-nums text-xs font-medium text-slate-500 dark:text-slate-400">
                      {index + 1}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3 align-middle">
                    <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {product.sku}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[280px] px-3 py-3 align-middle">
                    <span className="line-clamp-2 text-sm font-medium text-slate-900 dark:text-white">
                      {product.name}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3 align-middle">
                    <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                      {product.barcodeEan13?.trim() || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[200px] px-3 py-3 align-middle">
                    <div className="flex flex-col gap-0.5">
                      <span className="truncate text-sm text-slate-700 dark:text-slate-200">
                        {categoryLabel}
                      </span>
                      {categorySubline ? (
                        <span className="truncate font-mono text-[10px] text-slate-400">
                          {categorySubline}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-3 text-center align-middle">
                    <span className="text-xs font-medium uppercase text-slate-600 dark:text-slate-300">
                      {product.baseUnit?.trim() || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3 text-center align-middle">
                    {product.primarySupplierId ? (
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        Đã gán
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Chưa gán</span>
                    )}
                  </TableCell>
                  <TableCell className="px-3 py-3 text-center align-middle">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${product.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                          : "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400"
                        }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {product.status === "ACTIVE"
                        ? "Hoạt động"
                        : "Ngưng"}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3 align-middle whitespace-nowrap">
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      {formatDate(product.updatedAt)}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3 text-right align-middle">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Hành động cho sản phẩm ${product.name}`}
                            className="h-8 w-8 rounded-lg hover:bg-white dark:hover:bg-slate-700"
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
                          render={<Link href={`/products/${product.id}`} />}
                        >
                          <ChevronRight className="mr-2 h-4 w-4" />
                          Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="rounded-lg"
                          render={
                            <Link href={`/products/${product.id}/edit`} />
                          }
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="rounded-lg text-rose-600 focus:text-rose-600"
                          onClick={() => {
                            setItemToDelete(product.name);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa SKU
                        </DropdownMenuItem>
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

        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              Đang hiển thị {filteredProducts.length} trên {data?.data?.total_elements ?? 0} sản
              phẩm
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled className="h-8 px-3 text-xs border-slate-200">Trước</Button>
              <Button variant="outline" size="sm" className="h-8 px-3 text-xs border-slate-200">Tiếp theo</Button>
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
