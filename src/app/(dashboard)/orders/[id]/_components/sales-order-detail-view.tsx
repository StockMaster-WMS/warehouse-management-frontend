"use client";

import { useSalesOrderDetailLogic } from "@/components/features/orders";

import { OrderDetailSkeleton } from "./order-detail-skeleton";
import { OrderDetailError } from "./order-detail-error";
import { OrderHero } from "./order-hero";
import { OrderLinesSection } from "./order-lines-section";
import { OrderPickingSection } from "./order-picking-section";
import { OrderSidebar } from "./order-sidebar";

type SalesOrderDetailViewProps = {
  salesOrderId: string;
};

export function SalesOrderDetailView({ salesOrderId }: SalesOrderDetailViewProps) {
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
    <div className="mx-auto max-w-8xl space-y-5">
      <OrderHero
        so={so}
        lineCount={soItems.length}
        warehouseLabel={warehouseLabel}
        warehouseOptions={warehouseOptions}
        isFetching={isFetching}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
        <div className="min-w-0 space-y-5">
          <OrderLinesSection
            salesOrder={so}
            soItems={soItems}
            products={products}
            itemsFetching={itemsFetching}
          />
          <OrderPickingSection
            soItems={soItems}
            salesOrderStatus={so.status}
            productsById={productsById}
          />
        </div>

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
    </div>
  );
}
