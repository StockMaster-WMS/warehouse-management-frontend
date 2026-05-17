"use client";

import { useSalesOrderDetailLogic } from "@/components/features/orders";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderDetailSkeleton } from "./OrderDetailSkeleton";
import { OrderDetailError } from "./OrderDetailError";
import { OrderHero } from "./OrderHero";
import { OrderSidebar } from "./OrderSidebar";
import { OrderLinesSection } from "./OrderLinesSection";
import { OrderPickingSection } from "./OrderPickingSection";
import { LayoutGrid, ListChecks, ScanBarcode } from "lucide-react";
import { useState } from "react";
import { OrderPrintModal } from "./OrderPrintModal";
import { DeleteConfirmDialog } from "@/components/features/DeleteConfirmDialog";

type OrderDetailViewProps = {
  salesOrderId: string;
};

export function OrderDetailView({ salesOrderId }: OrderDetailViewProps) {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "delete" | "ship";
    title: string;
    description: string;
    confirmText: string;
    variant: "danger" | "info" | "warning";
  } | null>(null);
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
    isExecuting,
    onDeleteSalesOrder,
    onStartPicking,
    onMarkPacked,
    onMarkShipped,
    onConfirmOrder,
    onCancelOrder,
  } = useSalesOrderDetailLogic(salesOrderId);

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (isError || !so) {
    return <OrderDetailError error={error} onRetry={() => refetch()} />;
  }

  return (
    <div className="mx-auto max-w-8xl space-y-4">
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/90 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              {so.status}
            </Badge>
          </div>

          <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 sm:grid-cols-3">
            <TabsTrigger
              value="overview"
              className="group flex h-auto flex-col items-start gap-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-slate-600 shadow-none transition-all data-[state=active]:border-indigo-200 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300 dark:data-[state=active]:border-indigo-900/50 dark:data-[state=active]:bg-indigo-950/40 dark:data-[state=active]:text-indigo-200"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <LayoutGrid className="h-4 w-4 shrink-0" />
                Tổng quan
              </span>   
            </TabsTrigger>
            <TabsTrigger
              value="lines"
              className="group flex h-auto flex-col items-start gap-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-slate-600 shadow-none transition-all data-[state=active]:border-indigo-200 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300 dark:data-[state=active]:border-indigo-900/50 dark:data-[state=active]:bg-indigo-950/40 dark:data-[state=active]:text-indigo-200"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <ListChecks className="h-4 w-4 shrink-0" />
                Dòng hàng
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="picking"
              className="group flex h-auto flex-col items-start gap-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-slate-600 shadow-none transition-all data-[state=active]:border-indigo-200 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300 dark:data-[state=active]:border-indigo-900/50 dark:data-[state=active]:bg-indigo-950/40 dark:data-[state=active]:text-indigo-200"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <ScanBarcode className="h-4 w-4 shrink-0" />
                Lấy hàng
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
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
              isExecuting={isExecuting}
              deletingOrder={deletingOrder}
              onDeleteSalesOrder={() => setConfirmAction({
                type: "delete",
                title: "Xóa đơn xuất",
                description: "Bạn có chắc chắn muốn xóa đơn xuất hàng này? Mọi dữ liệu liên quan sẽ bị loại bỏ khỏi hệ thống.",
                confirmText: "Xác nhận xóa",
                variant: "danger"
              })}
              onStartPicking={onStartPicking}
              onMarkPacked={onMarkPacked}
              onMarkShipped={() => setConfirmAction({
                type: "ship",
                title: "Xác nhận xuất kho",
                description: "Đơn hàng sẽ được chuyển sang trạng thái ĐÃ XUẤT KHO. Bạn có chắc chắn muốn tiếp tục?",
                confirmText: "Xác nhận xuất",
                variant: "info"
              })}
              onConfirmOrder={onConfirmOrder}
              onCancelOrder={onCancelOrder}
              onOpenPrint={() => setIsPrintModalOpen(true)}
            />
          </div>
        </TabsContent>

        <TabsContent value="lines" className="space-y-2">
          <OrderLinesSection
            salesOrder={so}
            soItems={soItems}
            products={products}
            itemsFetching={itemsFetching}
          />
        </TabsContent>

        <TabsContent value="picking" className="space-y-2">
          <OrderPickingSection
            soItems={soItems}
            salesOrderStatus={so.status}
            warehouseId={so.warehouseId}
            productsById={productsById}
          />
        </TabsContent>
      </Tabs>

      <OrderPrintModal
        open={isPrintModalOpen}
        onOpenChange={setIsPrintModalOpen}
        salesOrder={so}
        warehouseLabel={warehouseLabel}
        items={soItems}
        products={products}
      />

      <DeleteConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        onConfirm={async () => {
          if (!confirmAction) return;
          if (confirmAction.type === "delete") await onDeleteSalesOrder();
          else if (confirmAction.type === "ship") await onMarkShipped();
        }}
        title={confirmAction?.title}
        description={confirmAction?.description}
        confirmText={confirmAction?.confirmText}
        variant={confirmAction?.variant}
        itemName={confirmAction?.type === "delete" ? `Đơn hàng: ${so.soNumber}` : undefined}
      />
    </div>
  );
}
