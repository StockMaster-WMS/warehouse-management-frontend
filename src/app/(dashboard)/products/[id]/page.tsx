"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ListOrdered, Package } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetProductByIdQuery } from "@/store/services/product.service";
import { useGetStocksQuery } from "@/store/services/stock.service";
import { useGetLocationsByIdsQuery } from "@/store/services/location.service";
import { apiErrMessage } from "@/types/api";
import type { Location } from "@/types/location";
import { 
  ProductHeroSection, 
  ProductInfoField, 
  ProductStockByLocationList,
  ProductBarcodeModal,
  ProductStockLedger
} from "@/components/features/products";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();

  // 1. Fetch Product
  const { data, error, isLoading, refetch, isFetching } = useGetProductByIdQuery(id);
  const product = data?.data;

  // 2. Fetch Stocks for this product
  const {
    data: stocksResponse,
    error: stockError,
    isLoading: isStocksLoading,
  } = useGetStocksQuery(
    { productId: id },
    { skip: !id },
  );

  const stocks = useMemo(() => stocksResponse?.data?.content ?? [], [stocksResponse]);
  
  // 3. Batch fetch locations for all stocks
  const uniqueLocationIds = useMemo(
    () => Array.from(
      stocks.reduce((set, item) => {
        if (item.locationId) set.add(item.locationId);
        return set;
      }, new Set<string>()),
    ),
    [stocks],
  );

  const { data: locationsRes, isLoading: isLocationsLoading } = useGetLocationsByIdsQuery(
    uniqueLocationIds,
    { skip: uniqueLocationIds.length === 0 }
  );

  const locationMap = useMemo(() => {
    const map: Record<string, Location> = {};
    locationsRes?.data?.forEach(loc => {
      map[loc.id] = loc;
    });
    return map;
  }, [locationsRes]);

  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);

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

          <ProductHeroSection 
            product={product} 
            onCopySku={() => copySku(product.sku)} 
            onPrintBarcode={() => setIsBarcodeModalOpen(true)}
          />

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
                  <ProductInfoField label="Tạo lúc" value={formatDateTime(product.createdAt)} />
                  <ProductInfoField label="Cập nhật lúc" value={formatDateTime(product.updatedAt)} />
                  <ProductInfoField label="Người tạo" value={product.createdBy || "—"} mono />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-none">
                <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Quy cách sản phẩm
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <ProductInfoField label="Nặng (kg)" value={String(product.weightKg ?? "—")} compact />
                  <ProductInfoField
                    label="Thể tích (cm³)"
                    value={String(product.volumeCm3 ?? "—")}
                    compact
                  />
                  <ProductInfoField label="Tồn tối thiểu" value={String(product.minStockQty ?? "—")} compact />
                </div>
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
                  <ProductInfoField label="Đông lạnh" value={product.isFrozen ? "Có" : "Không"} />
                  <ProductInfoField label="Dễ vỡ" value={product.isFragile ? "Có" : "Không"} />
                  <ProductInfoField label="Hàng nguy hiểm" value={product.isHazmat ? "Có" : "Không"} />
                  <ProductInfoField label="Hàng nặng" value={product.isHeavy ? "Có" : "Không"} />
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
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-none">
            <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Lịch sử xuất / nhập (Thẻ Kho)
              </h2>
            </div>
            <ProductStockLedger productId={product.id} />
          </section>
          <ProductBarcodeModal 
             open={isBarcodeModalOpen} 
             onOpenChange={setIsBarcodeModalOpen} 
             product={product} 
          />
        </>
      )}
    </div>
  );
}
