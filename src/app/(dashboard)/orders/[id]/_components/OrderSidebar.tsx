"use client";

import { Loader2, Play, Box, Truck, Trash2, Printer, ClipboardCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SalesOrderStatus } from "@/types/sales-order";

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
    <div className="flex flex-wrap items-center gap-2">
            {canManageOrder && status === "DRAFT" ? (
              <Button 
                type="button" 
                size="sm"
                onClick={onConfirmOrder} 
                disabled={isExecuting || lineCount === 0} 
                className="bg-blue-600 text-white shadow-sm hover:bg-blue-700"
              >
                {isExecuting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ClipboardCheck className="mr-2 size-4" />}
                Xác nhận đơn
              </Button>
            ) : null}

            {canManageOrder && status === "PENDING" ? (
              <Button 
                type="button" 
                size="sm"
                onClick={onStartPicking} 
                disabled={isExecuting || lineCount === 0} 
                className="bg-amber-600 text-white shadow-sm hover:bg-amber-700"
              >
                {isExecuting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Play className="mr-2 size-4" />}
                Bắt đầu lấy hàng
              </Button>
            ) : null}

            {canManageOrder && status === "PICKING" ? (
              <Button
                type="button"
                size="sm"
                onClick={onMarkPacked}
                disabled={isExecuting}
                className="bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
              >
                {isExecuting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Box className="mr-2 size-4" />}
                Hoàn tất đóng gói
              </Button>
            ) : null}

            {canManageOrder && status === "PACKED" ? (
              <Button 
                type="button" 
                size="sm"
                onClick={onMarkShipped} 
                disabled={isExecuting} 
                className="bg-purple-600 text-white shadow-sm hover:bg-purple-700"
              >
                {isExecuting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Truck className="mr-2 size-4" />}
                Xác nhận xuất kho
              </Button>
            ) : null}

            {canManageOrder && status === "SHIPPED" ? (
              <Button
                type="button"
                size="sm"
                onClick={onCompleteOrder}
                disabled={isExecuting}
                className="bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
              >
                {isExecuting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ClipboardCheck className="mr-2 size-4" />}
                Hoàn tất đơn xuất
              </Button>
            ) : null}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenPrint}
                className="bg-white text-xs"
              >
                <Printer className="mr-1.5 size-3.5" />
                In phiếu
              </Button>

              {canManageOrder && status === "DRAFT" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-rose-200 text-xs text-rose-600 hover:bg-rose-50"
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
                  className="border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
                  disabled={isExecuting || status === "CANCELLED" || status === "SHIPPED" || status === "COMPLETED"}
                  onClick={onCancelOrder}
                >
                  {isExecuting ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <XCircle className="mr-1.5 size-3.5" />}
                  Hủy đơn
                </Button>
              ) : null}
    </div>
  );
}
