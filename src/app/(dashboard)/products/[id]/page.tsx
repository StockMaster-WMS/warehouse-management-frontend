"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarClock, Edit2, Package, Ruler, ShieldCheck, Truck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetProductByIdQuery } from "@/store/services/product.service";

export default function ProductDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const { id } = params;
  const { data, error, isLoading, refetch, isFetching } = useGetProductByIdQuery(id);
  const product = data?.data;

  const formatDateTime = (value?: string) => {
    if (!value) return "--";
    return new Date(value).toLocaleString("vi-VN");
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Chi tiết sản phẩm"
        description={product ? `Theo dõi thông tin đầy đủ của SKU ${product.sku}.` : "Xem chi tiết sản phẩm theo mã định danh."}
        actions={
          <div className="flex items-center gap-2">
            <Button
              render={<Link href="/products" />}
              nativeButton={false}
              variant="outline"
              size="sm"
              className="border-slate-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
            {product ? (
              <Button
                render={<Link href={`/products/${product.id}/edit`} />}
                nativeButton={false}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </Button>
            ) : null}
          </div>
        }
      />

      {isFetching && !isLoading ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/30">
          Đang đồng bộ dữ liệu mới nhất...
        </p>
      ) : null}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <Skeleton className="mb-5 h-5 w-48" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full sm:col-span-2" />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <Skeleton className="mb-5 h-5 w-40" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <Skeleton className="mb-5 h-5 w-40" />
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </div>
      ) : error || !product ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
          <EmptyState
            icon={Package}
            title="Không tìm thấy thông tin sản phẩm"
            description={(error as { data?: { message?: string } })?.data?.message ?? "Sản phẩm có thể đã bị xóa hoặc không tồn tại."}
            action={
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Thử lại
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
                <Package className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Thông tin định danh
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoField label="Tên sản phẩm" value={product.name} />
                <InfoField label="SKU" value={product.sku} mono />
                <InfoField label="Barcode" value={product.barcodeEan13 || "--"} mono />
                <InfoField label="Đơn vị cơ bản" value={product.baseUnit || "--"} />
                <InfoField label="ID danh mục" value={product.categoryId || "--"} mono />
                <InfoField label="ID nhà cung cấp chính" value={product.primarySupplierId || "--"} mono />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
                <Ruler className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Quy cách vận hành
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <InfoField label="Nặng (kg)" value={String(product.weightKg ?? "--")} compact />
                <InfoField label="Dài (cm)" value={String(product.lengthCm ?? "--")} compact />
                <InfoField label="Rộng (cm)" value={String(product.widthCm ?? "--")} compact />
                <InfoField label="Cao (cm)" value={String(product.heightCm ?? "--")} compact />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Trạng thái
                </h3>
              </div>

              <div className="space-y-3">
                <InfoField
                  label="Hoạt động"
                  value={product.status === "ACTIVE" ? "Đang hoạt động" : "Không hoạt động"}
                />
                <InfoField label="Theo dõi lô" value={product.isLotTracked ? "Có" : "Không"} />
                <InfoField label="Theo dõi hạn dùng" value={product.isExpiryTracked ? "Có" : "Không"} />
                <InfoField label="Tồn tối thiểu" value={String(product.minStockQty ?? "--")} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
                <CalendarClock className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Nhật ký
                </h3>
              </div>
              <div className="space-y-3">
                <InfoField label="Tạo lúc" value={formatDateTime(product.createdAt)} />
                <InfoField label="Cập nhật lúc" value={formatDateTime(product.updatedAt)} />
                <InfoField label="Người tạo" value={product.createdBy || "--"} mono />
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 shadow-sm dark:border-indigo-900/30 dark:bg-indigo-950/20">
              <div className="flex items-start gap-3">
                <Truck className="mt-0.5 h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                <div>
                  <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">Gợi ý thao tác</p>
                  <p className="mt-1 text-xs text-indigo-700/80 dark:text-indigo-300/80">
                    Có thể thêm tab tồn kho theo kho, lịch sử nhập/xuất và biến động giá để phục vụ vận hành.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({
  label,
  value,
  mono = false,
  compact = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50 ${compact ? "text-center" : ""}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 break-all text-sm font-semibold text-slate-800 dark:text-slate-100 ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </p>
    </div>
  );
}
