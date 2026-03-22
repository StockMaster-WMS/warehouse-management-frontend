"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  ChevronRight,
  Copy,
  Edit2,
  Layers,
  ListOrdered,
  Package,
  Ruler,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetProductByIdQuery } from "@/store/services/product.service";
import { getProductCategoryDisplayName } from "@/types/product";
import type { Product } from "@/types/product";

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

  const copySku = async (sku: string) => {
    try {
      await navigator.clipboard.writeText(sku);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {isLoading ? (
        <>
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-full max-w-xl" />
            <Skeleton className="h-6 w-64" />
          </div>
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
                </div>
              </div>
            </div>
          </div>
        </>
      ) : error || !product ? (
        <>
          <PageHeader
            title="Chi tiết sản phẩm"
            description="Không tải được dữ liệu hoặc sản phẩm không tồn tại."
            actions={
              <Button
                render={<Link href="/products" />}
                nativeButton={false}
                variant="outline"
                size="sm"
                className="border-slate-200"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Về danh sách
              </Button>
            }
          />
          <div className="rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
            <EmptyState
              icon={Package}
              title="Không tìm thấy thông tin sản phẩm"
              description={
                (error as { data?: { message?: string } })?.data?.message ??
                "Sản phẩm có thể đã bị xóa hoặc không tồn tại."
              }
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    Thử lại
                  </Button>
                  <Button
                    render={<Link href="/products" />}
                    nativeButton={false}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <ListOrdered className="mr-2 h-4 w-4" />
                    Danh sách sản phẩm
                  </Button>
                </div>
              }
            />
          </div>
        </>
      ) : (
        <>
          {isFetching ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/30">
              Đang đồng bộ dữ liệu mới nhất...
            </p>
          ) : null}

          <ProductHero product={product} onCopySku={() => copySku(product.sku)} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-none">
                <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                  <Package className="h-4 w-4 shrink-0 text-indigo-600" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Thông tin vận hành
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoField label="Mã vạch" value={product.barcodeEan13 || "—"} mono />
                  <InfoField label="Đơn vị cơ bản (ĐVT)" value={product.baseUnit || "—"} />
                  <InfoField
                    label="Nhóm hàng"
                    value={getProductCategoryDisplayName(product) || "—"}
                    className="sm:col-span-2"
                  />
                  <InfoField
                    label="Nhà cung cấp chính"
                    value={product.primarySupplierId ?? "Chưa gán"}
                    mono
                  />
                  <InfoField label="Người tạo" value={product.createdBy || "—"} mono />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-none">
                <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                  <Ruler className="h-4 w-4 shrink-0 text-indigo-600" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Quy cách & kích thước
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <InfoField label="Nặng (kg)" value={String(product.weightKg ?? "—")} compact />
                  <InfoField label="Dài (cm)" value={String(product.lengthCm ?? "—")} compact />
                  <InfoField label="Rộng (cm)" value={String(product.widthCm ?? "—")} compact />
                  <InfoField label="Cao (cm)" value={String(product.heightCm ?? "—")} compact />
                </div>
                <p className="mt-4 text-xs text-slate-400">
                  Thể tích hiển thị trên hệ thống:{" "}
                  <span className="font-mono font-medium text-slate-600 dark:text-slate-300">
                    {product.volumeCm3 != null ? `${product.volumeCm3} cm³` : "—"}
                  </span>
                </p>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-none">
                <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Trạng thái & tồn
                  </h2>
                </div>

                <div className="mb-4">
                  <StatusBadge status={product.status} />
                </div>
                <div className="space-y-3">
                  <InfoField label="Theo dõi lô" value={product.isLotTracked ? "Có" : "Không"} />
                  <InfoField
                    label="Theo dõi hạn dùng"
                    value={product.isExpiryTracked ? "Có" : "Không"}
                  />
                  <InfoField label="Tồn tối thiểu" value={String(product.minStockQty ?? "—")} />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-none">
                <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                  <CalendarClock className="h-4 w-4 shrink-0 text-amber-500" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Lịch sử
                  </h2>
                </div>
                <div className="space-y-3">
                  <InfoField label="Tạo lúc" value={formatDateTime(product.createdAt)} />
                  <InfoField label="Cập nhật lúc" value={formatDateTime(product.updatedAt)} />
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ProductHero({ product, onCopySku }: { product: Product; onCopySku: () => void }) {
  const initials = (product.name || product.sku || "?").trim().slice(0, 2).toUpperCase();
  const category = getProductCategoryDisplayName(product);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/40 to-indigo-50/30 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 gap-4 sm:gap-5">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-sm font-bold text-white shadow-md shadow-indigo-600/25 sm:h-16 sm:w-16 sm:text-base"
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <nav className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Link
                href="/products"
                className="text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Sản phẩm
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
              <span className="truncate text-slate-600 dark:text-slate-300">Chi tiết</span>
            </nav>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              <span className="break-words">{product.name}</span>
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  SKU
                </span>
                <span className="font-mono">{product.sku}</span>
                <button
                  type="button"
                  onClick={onCopySku}
                  className="ml-0.5 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700 dark:hover:text-indigo-400"
                  title="Sao chép SKU"
                  aria-label="Sao chép mã SKU"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </span>
              <StatusBadge status={product.status} />
              {product.baseUnit ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  ĐVT: {product.baseUnit}
                </span>
              ) : null}
              {category ? (
                <span className="max-w-full truncate rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200">
                  {category}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
          <Button
            render={<Link href={`/products/${product.id}/edit`} />}
            nativeButton={false}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 shadow-sm sm:min-w-[140px]"
          >
            <Edit2 className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </Button>
          <Button
            render={<Link href="/products" />}
            nativeButton={false}
            variant="outline"
            size="sm"
            className="border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-900 sm:min-w-[140px]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Danh sách
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Product["status"] }) {
  const active = status === "ACTIVE";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
        active
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
          : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {active ? "Hoạt động" : "Ngưng"}
    </span>
  );
}

function InfoField({
  label,
  value,
  mono = false,
  compact = false,
  className = "",
}: {
  label: string;
  value: string;
  mono?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200/90 bg-slate-50/70 px-4 py-3 dark:border-slate-700/90 dark:bg-slate-900/55 ${compact ? "text-center" : ""} ${className}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 break-words text-sm font-semibold text-slate-800 dark:text-slate-100 ${mono ? "break-all font-mono text-xs" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
