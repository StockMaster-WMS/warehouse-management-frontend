"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ListOrdered, Package } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetProductByIdQuery } from "@/store/services/product.service";
import { useGetStocksQuery } from "@/store/services/stock.service";
import { useLazyGetLocationByIdQuery } from "@/store/services/location.service";
import { apiErrMessage } from "@/types/api";
import type { Location } from "@/types/location";
import type { Stock } from "@/types/stock";
import {
  ProductHero as ProductHeroSection,
  InfoField as ProductInfoField,
  StockByLocationList as ProductStockByLocationList,
} from "@/components/features/products/ProductDetailSections";

export default function ProductDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const { id } = params;

  const { data, error, isLoading, refetch, isFetching } = useGetProductByIdQuery(id);
  const product = data?.data;
  const {
    data: stocksResponse,
    error: stockError,
    isLoading: isStocksLoading,
  } = useGetStocksQuery(
    { productId: id },
    { skip: !id },
  );

  const [triggerGetLocationById] = useLazyGetLocationByIdQuery();
  const [locationMap, setLocationMap] = useState<Record<string, Location>>({});
  const [isLocationsLoading, setIsLocationsLoading] = useState(false);

  const formatDateTime = (value?: string) => {
    if (!value) return "--";
    return new Date(value).toLocaleString("vi-VN");
  };

  const copySku = async (sku: string) => {
    try {
      await navigator.clipboard.writeText(sku);
    } catch {
      // ignore
    }
  };

  const stocks = useMemo(() => stocksResponse?.data?.content ?? [], [stocksResponse]);

  useEffect(() => {
    const uniqueLocationIds = Array.from(new Set(stocks.map((item) => item.locationId).filter(Boolean)));
    if (uniqueLocationIds.length === 0) return;

    const missingLocationIds = uniqueLocationIds.filter((locationId) => !locationMap[locationId]);
    if (missingLocationIds.length === 0) return;

    let cancelled = false;

    const loadLocations = async () => {
      setIsLocationsLoading(true);
      try {
        const responses = await Promise.all(
          missingLocationIds.map((locationId) => triggerGetLocationById(locationId).unwrap()),
        );
        if (cancelled) return;
        setLocationMap((prev) => {
          const next = { ...prev };
          for (const response of responses) {
            const location = response?.data;
            if (!location?.id) continue;
            next[location.id] = location;
          }
          return next;
        });
      } catch {
        // Ignore location lookup failures and fall back to the location UUID.
      } finally {
        if (!cancelled) setIsLocationsLoading(false);
      }
    };

    loadLocations();

    return () => {
      cancelled = true;
    };
  }, [locationMap, stocks, triggerGetLocationById]);

  return (
    <div className="space-y-4 pb-20 sm:space-y-6">
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-6 md:col-span-2">
              <Skeleton className="h-72 w-full rounded-2xl" />
              <Skeleton className="h-56 w-full rounded-2xl" />
            </div>
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
        </div>
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

          <ProductHeroSection product={product} onCopySku={() => copySku(product.sku)} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-none">
                <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Thông tin vận hành
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ProductInfoField label="Mã vạch" value={product.barcodeEan13 || "—"} mono />
                  <ProductInfoField label="Đơn vị cơ bản (ĐVT)" value={product.baseUnit || "—"} />
                  <ProductInfoField
                    label="Nhóm hàng"
                    value={product.categoryName || product.categoryId || "—"}
                    className="sm:col-span-2"
                  />
                  <ProductInfoField
                    label="Nhà cung cấp chính"
                    value={product.primarySupplierId ?? "Chưa gán"}
                    mono
                  />
                  <ProductInfoField label="Người tạo" value={product.createdBy || "—"} mono />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-none">
                <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Quy cách & kích thước
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <ProductInfoField label="Nặng (kg)" value={String(product.weightKg ?? "—")} compact />
                  <ProductInfoField label="Dài (cm)" value={String(product.lengthCm ?? "—")} compact />
                  <ProductInfoField label="Rộng (cm)" value={String(product.widthCm ?? "—")} compact />
                  <ProductInfoField label="Cao (cm)" value={String(product.heightCm ?? "—")} compact />
                </div>
                <p className="mt-4 text-xs text-slate-400">
                  Thể tích hiển thị trên hệ thống: {" "}
                  <span className="font-mono font-medium text-slate-600 dark:text-slate-300">
                    {product.volumeCm3 != null ? `${product.volumeCm3} cm³` : "—"}
                  </span>
                </p>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-none">
                <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Trạng thái & tồn
                  </h2>
                </div>

                <div className="mb-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                      product.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {product.status === "ACTIVE" ? "Hoạt động" : "Ngưng"}
                  </span>
                </div>
                <div className="space-y-3">
                  <ProductInfoField label="Theo dõi lô" value={product.isLotTracked ? "Có" : "Không"} />
                  <ProductInfoField
                    label="Theo dõi hạn dùng"
                    value={product.isExpiryTracked ? "Có" : "Không"}
                  />
                  <ProductInfoField label="Tồn tối thiểu" value={String(product.minStockQty ?? "—")} />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-none">
                <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Tồn theo vị trí
                  </h2>
                </div>
                <ProductStockByLocationList
                  stocks={stocks}
                  locationMap={locationMap}
                  isLoading={isStocksLoading || isLocationsLoading}
                  errorMessage={stockError ? apiErrMessage(stockError) : null}
                />
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-none">
                <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Lịch sử
                  </h2>
                </div>
                <div className="space-y-3">
                  <ProductInfoField label="Tạo lúc" value={formatDateTime(product.createdAt)} />
                  <ProductInfoField label="Cập nhật lúc" value={formatDateTime(product.updatedAt)} />
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
