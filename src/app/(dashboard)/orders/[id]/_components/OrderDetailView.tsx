"use client";

import { useSalesOrderDetailLogic } from "@/components/features/orders";
import { OrderDetailSkeleton } from "./OrderDetailSkeleton";
import { OrderDetailError } from "./OrderDetailError";
import { OrderHero } from "./OrderHero";
import { OrderSidebar } from "./OrderSidebar";
import { OrderLinesSection } from "./OrderLinesSection";
import { OrderPickingSection } from "./OrderPickingSection";

type OrderDetailViewProps = {
  salesOrderId: string;
};

export function OrderDetailView({ salesOrderId }: OrderDetailViewProps) {
  const {
    so,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    soItems,
    itemsFetching,
    products,
    productsById,
    warehouseOptions,
    warehouseLabel,
    deletingOrder,
    starting,
    packing,
    shipping,
    onDeleteSalesOrder,
    onStartPicking,
    onMarkPacked,
    onMarkShipped,
  } = useSalesOrderDetailLogic(salesOrderId);

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (isError || !so) {
    return <OrderDetailError error={error} onRetry={() => refetch()} />;
  }

  return (
    <div className="mx-auto max-w-8xl space-y-4">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <OrderHero
          so={so}
          lineCount={soItems.length}
          warehouseLabel={warehouseLabel}
          warehouseOptions={warehouseOptions}
          isFetching={isFetching}
        />

        <OrderSidebar
          status={so.status}
          lineCount={soItems.length}
          starting={starting}
          packing={packing}
          shipping={shipping}
          deletingOrder={deletingOrder}
          onDeleteSalesOrder={onDeleteSalesOrder}
          onStartPicking={onStartPicking}
          onMarkPacked={onMarkPacked}
          onMarkShipped={onMarkShipped}
        />
      </div>
      <div className="min-w-0 space-y-4">
        <section className="space-y-2 rounded-xl border border-slate-200/70 bg-slate-50/60 p-2 dark:border-slate-800 dark:bg-slate-900/30">
          <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Quản lý dòng hàng</p>
          <OrderLinesSection
            salesOrder={so}
            soItems={soItems}
            products={products}
            itemsFetching={itemsFetching}
          />
        </section>

        <section className="space-y-2 rounded-xl border border-slate-200/70 bg-slate-50/60 p-2 dark:border-slate-800 dark:bg-slate-900/30">
          <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Thực thi lấy hàng</p>
          <OrderPickingSection
            soItems={soItems}
            salesOrderStatus={so.status}
            productsById={productsById}
          />
        </section>
      </div>

    </div>
  );
}
