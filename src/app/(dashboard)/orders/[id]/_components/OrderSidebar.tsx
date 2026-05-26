"use client";

import { Loader2, Play, Box, Truck, Trash2, Printer, ClipboardCheck, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { salesOrderStatusLabel } from "@/types/sales-order";
import type { SalesOrderStatus } from "@/types/sales-order";
import { cn } from "@/lib/utils";
import { DetailSection } from "@/components/detail-page";

function statusBadgeClass(status: SalesOrderStatus): string {
  switch (status) {
    case "DRAFT":
      return "border-gray-200 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    case "PENDING":
      return "border-blue-500/30 bg-blue-500/10 text-blue-800 dark:text-blue-200";
    case "PICKING":
      return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200";
    case "PACKED":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
    case "SHIPPED":
      return "border-purple-200 bg-purple-50 text-purple-700";
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "ON_HOLD":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "CANCELLED":
      return "border-border bg-muted/80 text-muted-foreground";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

type OrderSidebarProps = {
  status: SalesOrderStatus;
  lineCount: number;
  isExecuting: boolean;
  deletingOrder: boolean;
  onDeleteSalesOrder: () => void;
  onStartPicking: () => void;
  onMarkPacked: () => void;
  onMarkShipped: () => void;
  onCompleteOrder: () => void;
  onConfirmOrder: () => void;
  onCancelOrder: () => void;
  onOpenPrint: () => void;
  canManageOrder?: boolean;
};

export function OrderSidebar({
  status,
  lineCount,
  isExecuting,
  deletingOrder,
  onDeleteSalesOrder,
  onStartPicking,
  onMarkPacked,
  onMarkShipped,
  onCompleteOrder,
  onConfirmOrder,
  onCancelOrder,
  onOpenPrint,
  canManageOrder = false,
}: OrderSidebarProps) {
  return (
    <aside className="lg:sticky lg:top-5 lg:self-start">
      <DetailSection title="Trạng thái vận hành" icon={<AlertCircle className="size-4" />}>
        <div className="space-y-4">
          <div className="flex flex-row items-center justify-between gap-2">
            <Badge variant="outline" className={cn("rounded-md px-2.5 py-0.5 text-[11px] font-bold", statusBadgeClass(status))}>
              {salesOrderStatusLabel(status)}
            </Badge>
            <span className="text-[11px] font-medium text-muted-foreground tabular-nums">{lineCount} dòng hàng</span>
          </div>
          <div className="grid gap-2.5">
            {canManageOrder && status === "DRAFT" ? (
              <Button 
                type="button" 
                onClick={onConfirmOrder} 
                disabled={isExecuting || lineCount === 0} 
                className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                {isExecuting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ClipboardCheck className="mr-2 size-4" />}
                Xác nhận đơn
              </Button>
            ) : null}

            {canManageOrder && status === "PENDING" ? (
              <Button 
                type="button" 
                onClick={onStartPicking} 
                disabled={isExecuting || lineCount === 0} 
                className="w-full justify-center bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
              >
                {isExecuting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Play className="mr-2 size-4" />}
                Bắt đầu lấy hàng / tạo lệnh lấy
              </Button>
            ) : null}

            {canManageOrder && status === "PICKING" ? (
              <Button
                type="button"
                onClick={onMarkPacked}
                disabled={isExecuting}
                className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                {isExecuting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Box className="mr-2 size-4" />}
                Hoàn tất đóng gói
              </Button>
            ) : null}

            {canManageOrder && status === "PACKED" ? (
              <Button 
                type="button" 
                onClick={onMarkShipped} 
                disabled={isExecuting} 
                className="w-full justify-center bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
              >
                {isExecuting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Truck className="mr-2 size-4" />}
                Xác nhận xuất kho
              </Button>
            ) : null}

            {canManageOrder && status === "SHIPPED" ? (
              <Button
                type="button"
                onClick={onCompleteOrder}
                disabled={isExecuting}
                className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                {isExecuting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ClipboardCheck className="mr-2 size-4" />}
                Hoàn tất đơn xuất
              </Button>
            ) : null}

            <Separator className="my-1.5 opacity-50" />

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenPrint}
                className="justify-center text-xs h-9 bg-white"
              >
                <Printer className="mr-1.5 size-3.5" />
                In phiếu
              </Button>

              {canManageOrder && (status === "DRAFT" || status === "PENDING") ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="justify-center text-xs h-9 border-rose-200 text-rose-600 hover:bg-rose-50"
                  disabled={deletingOrder}
                  onClick={onDeleteSalesOrder}
                >
                  {deletingOrder ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <Trash2 className="mr-1.5 size-3.5" />}
                  Xóa đơn
                </Button>
              ) : canManageOrder ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="justify-center text-xs h-9 border-slate-200 text-slate-600 hover:bg-slate-50"
                  disabled={isExecuting || status === "CANCELLED" || status === "SHIPPED" || status === "COMPLETED"}
                  onClick={onCancelOrder}
                >
                  {isExecuting ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <XCircle className="mr-1.5 size-3.5" />}
                  Hủy đơn
                </Button>
              ) : null}
            </div>
          </div>
          
          <div className="rounded-lg border border-border bg-muted/45 p-2.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 size-3.5 text-muted-foreground" />
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Chỉ cho phép thêm/sửa hàng khi đơn ở trạng thái <strong>NHÁP</strong> hoặc <strong>SẴN SÀNG</strong>. Các bước vận hành tiếp theo sẽ tự động khóa dữ liệu.
              </p>
            </div>
          </div>
        </div>
      </DetailSection>
    </aside>
  );
}
