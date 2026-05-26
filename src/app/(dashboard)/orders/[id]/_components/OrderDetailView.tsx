"use client";

import { useSalesOrderDetailLogic } from "@/components/features/orders";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { OrderDetailSkeleton } from "./OrderDetailSkeleton";
import { OrderDetailError } from "./OrderDetailError";
import { OrderHero } from "./OrderHero";
import { OrderSidebar } from "./OrderSidebar";
import { OrderLinesSection } from "./OrderLinesSection";
import { OrderPickingSection } from "./OrderPickingSection";
import { OrderWorkflowStatus } from "./OrderWorkflowStatus";
import { LayoutGrid, ListChecks, RefreshCw, ScanBarcode } from "lucide-react";
import { useState } from "react";
import { OrderPrintModal } from "./OrderPrintModal";
import { DeleteConfirmDialog } from "@/components/features/DeleteConfirmDialog";
import { useHasPermissions } from "@/components/permission-control";
import { ADMIN_MANAGER_ROLES } from "@/lib/access-control";
import {
  DetailPageHeader,
  DetailPageLayout,
  DetailStatusBadge,
  type StatusConfig,
} from "@/components/detail-page";
import { salesOrderStatusLabel } from "@/types/sales-order";

const SALES_ORDER_STATUS_CONFIG: Record<string, StatusConfig> = {
  DRAFT: { label: "Bản nháp", color: "slate" },
  PENDING: { label: "Sẵn sàng", color: "blue" },
  ON_HOLD: { label: "Tạm dừng", color: "rose" },
  PICKING: { label: "Đang lấy hàng", color: "amber" },
  PACKED: { label: "Đã đóng gói", color: "emerald" },
  SHIPPED: { label: "Đã xuất kho", color: "indigo" },
  COMPLETED: { label: "Hoàn tất", color: "emerald" },
  CANCELLED: { label: "Đã hủy", color: "slate" },
};

type OrderDetailViewProps = {
  salesOrderId: string;
};

export function OrderDetailView({ salesOrderId }: OrderDetailViewProps) {
  const canManageOrder = useHasPermissions(ADMIN_MANAGER_ROLES);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "delete" | "ship" | "complete";
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
    onCompleteOrder,
    onConfirmOrder,
    onCancelOrder,
  } = useSalesOrderDetailLogic(salesOrderId);

  if (isLoading) {
    return (
      <DetailPageLayout>
        <OrderDetailSkeleton />
      </DetailPageLayout>
    );
  }

  if (isError || !so) {
    return (
      <DetailPageLayout>
        <OrderDetailError error={error} onRetry={() => refetch()} />
      </DetailPageLayout>
    );
  }

  return (
    <DetailPageLayout>
      <Tabs defaultValue="overview" className="space-y-3">
        <DetailPageHeader
          backHref="/orders"
          backLabel="Đơn xuất"
          eyebrow="Chi tiết đơn xuất"
          title={so.customerName || "Đơn xuất"}
          code={so.soNumber || `SO-${so.id.slice(0, 8).toUpperCase()}`}
          status={
            <DetailStatusBadge
              status={so.status}
              statusConfig={SALES_ORDER_STATUS_CONFIG}
              fallback={salesOrderStatusLabel(so.status)}
            />
          }
          description="Theo dõi tiến trình xử lý, dòng hàng, lấy hàng và thao tác vận hành trong một màn hình."
          actions={
            <div className="flex flex-wrap items-center gap-2">
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
                onCompleteOrder={() => setConfirmAction({
                  type: "complete",
                  title: "Hoàn tất đơn xuất",
                  description: "Đơn hàng đã xuất kho sẽ được chuyển sang trạng thái HOÀN TẤT. Bạn có chắc chắn muốn tiếp tục?",
                  confirmText: "Hoàn tất",
                  variant: "info"
                })}
                onConfirmOrder={onConfirmOrder}
                onCancelOrder={onCancelOrder}
                onOpenPrint={() => setIsPrintModalOpen(true)}
                canManageOrder={canManageOrder}
              />
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={isFetching ? "mr-2 size-4 animate-spin" : "mr-2 size-4"} />
                Làm mới
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <OrderWorkflowStatus status={so.status} lineCount={soItems.length} embedded />
            <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {salesOrderStatusLabel(so.status)}
                </Badge>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {soItems.length} dòng hàng
                </span>
              </div>

              <TabsList className="grid h-10 w-full grid-cols-3 gap-1 rounded-lg border border-border bg-muted/40 p-1 sm:w-auto">
                <TabsTrigger
                  value="overview"
                  className="h-8 gap-1.5 rounded-md px-3 text-xs font-semibold text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm sm:min-w-28"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <LayoutGrid className="size-4 shrink-0" />
                    Tổng quan
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="lines"
                  className="h-8 gap-1.5 rounded-md px-3 text-xs font-semibold text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm sm:min-w-28"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <ListChecks className="size-4 shrink-0" />
                    Dòng hàng
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="picking"
                  className="h-8 gap-1.5 rounded-md px-3 text-xs font-semibold text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm sm:min-w-28"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <ScanBarcode className="size-4 shrink-0" />
                    Lấy hàng
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="border-t border-border pt-4">
              <TabsContent value="overview" className="m-0">
                <OrderHero
                  so={so}
                  lineCount={soItems.length}
                  warehouseLabel={warehouseLabel}
                  warehouseOptions={warehouseOptions}
                  isFetching={isFetching}
                  embedded
                />
              </TabsContent>

              <TabsContent value="lines" className="m-0">
                <OrderLinesSection
                  salesOrder={so}
                  soItems={soItems}
                  products={products}
                  itemsFetching={itemsFetching}
                  canManageOrder={canManageOrder}
                  embedded
                />
              </TabsContent>

              <TabsContent value="picking" className="m-0">
                <OrderPickingSection
                  soItems={soItems}
                  salesOrderStatus={so.status}
                  warehouseId={so.warehouseId}
                  productsById={productsById}
                  embedded
                />
              </TabsContent>
            </div>
          </div>
        </DetailPageHeader>
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
          else if (confirmAction.type === "complete") await onCompleteOrder();
        }}
        title={confirmAction?.title}
        description={confirmAction?.description}
        confirmText={confirmAction?.confirmText}
        variant={confirmAction?.variant}
        itemName={confirmAction?.type === "delete" ? `Đơn hàng: ${so.soNumber}` : undefined}
      />
    </DetailPageLayout>
  );
}
