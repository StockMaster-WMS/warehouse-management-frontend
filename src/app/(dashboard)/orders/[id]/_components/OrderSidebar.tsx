"use client";

import { Loader2, Play, Box, Truck, Trash2, Printer, ClipboardCheck, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { salesOrderStatusLabel } from "@/types/sales-order";
import type { SalesOrderStatus } from "@/types/sales-order";
import { cn } from "@/lib/utils";

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
  onConfirmOrder: () => void;
  onCancelOrder: () => void;
  onOpenPrint: () => void;
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
  onConfirmOrder,
  onCancelOrder,
  onOpenPrint,
}: OrderSidebarProps) {
  return (
    <aside className="lg:sticky lg:top-5 lg:self-start">
      <Card className="gap-0 py-0 shadow-sm overflow-hidden border-border/50">
        <CardHeader className="gap-2 border-b border-border/70 bg-slate-50/70 pb-3 pt-4 dark:bg-slate-900/30">
          <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Trạng thái vận hành</CardTitle>
          <div className="flex flex-row items-center justify-between gap-2">
            <Badge variant="outline" className={cn("rounded-md px-2.5 py-0.5 text-[11px] font-bold", statusBadgeClass(status))}>
              {salesOrderStatusLabel(status)}
            </Badge>
            <span className="text-[11px] font-medium text-muted-foreground tabular-nums">{lineCount} dòng hàng</span>
          </div>
        </CardHeader>

        <CardContent className="pb-4 pt-4">
          <div className="grid gap-2.5">
            {status === "DRAFT" ? (
              <Button 
                type="button" 
                onClick={onConfirmOrder} 
                disabled={isExecuting || lineCount === 0} 
                className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                {isExecuting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardCheck className="mr-2 h-4 w-4" />}
                Xác nhận đơn
              </Button>
            ) : null}

            {status === "PENDING" ? (
              <Button 
                type="button" 
                onClick={onStartPicking} 
                disabled={isExecuting || lineCount === 0} 
                className="w-full justify-center bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
              >
                {isExecuting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                Bắt đầu lấy hàng
              </Button>
            ) : null}

            {status === "PICKING" ? (
              <Button
                type="button"
                onClick={onMarkPacked}
                disabled={isExecuting}
                className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                {isExecuting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Box className="mr-2 h-4 w-4" />}
                Hoàn tất đóng gói
              </Button>
            ) : null}

            {status === "PACKED" ? (
              <Button 
                type="button" 
                onClick={onMarkShipped} 
                disabled={isExecuting} 
                className="w-full justify-center bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
              >
                {isExecuting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}
                Xác nhận xuất kho
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
                <Printer className="mr-1.5 h-3.5 w-3.5" />
                In phiếu
              </Button>

              {status === "DRAFT" || status === "PENDING" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="justify-center text-xs h-9 border-rose-200 text-rose-600 hover:bg-rose-50"
                  disabled={deletingOrder}
                  onClick={onDeleteSalesOrder}
                >
                  {deletingOrder ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1.5 h-3.5 w-3.5" />}
                  Xóa đơn
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="justify-center text-xs h-9 border-slate-200 text-slate-600 hover:bg-slate-50"
                  disabled={isExecuting || status === "CANCELLED" || status === "SHIPPED"}
                  onClick={onCancelOrder}
                >
                  {isExecuting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <XCircle className="mr-1.5 h-3.5 w-3.5" />}
                  Hủy đơn
                </Button>
              )}
            </div>
          </div>
          
          <div className="mt-4 rounded-lg bg-slate-50 p-2.5 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-slate-400 mt-0.5" />
              <p className="text-[10px] leading-relaxed text-slate-500">
                Chỉ cho phép thêm/sửa hàng khi đơn ở trạng thái <strong>NHÁP</strong> hoặc <strong>SẴN SÀNG</strong>. Các bước vận hành tiếp theo sẽ tự động khóa dữ liệu.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}