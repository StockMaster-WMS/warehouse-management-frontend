"use client";

import { Loader2, Play, Box, Truck, Trash2, Printer, Check, ClipboardCheck } from "lucide-react";
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
    case "CONFIRMED":
      return "border-blue-500/30 bg-blue-500/10 text-blue-800 dark:text-blue-200";
    case "PENDING":
      return "border-primary/20 bg-primary/10 text-primary";
    case "PICKING":
      return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200";
    case "PICKED":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-800 dark:text-cyan-200";
    case "PACKED":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
    case "SHIPPED":
      return "border-purple-200 bg-purple-50 text-purple-700";
    case "DELIVERED":
      return "border-emerald-600/50 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 font-bold";
    case "CANCELLED":
      return "border-border bg-muted/80 text-muted-foreground";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

type OrderSidebarProps = {
  status: SalesOrderStatus;
  lineCount: number;
  starting: boolean;
  packing: boolean;
  shipping: boolean;
  confirming: boolean;
  delivering: boolean;
  deletingOrder: boolean;
  onDeleteSalesOrder: () => void;
  onStartPicking: () => void;
  onMarkPacked: () => void;
  onMarkShipped: () => void;
  onConfirmOrder: () => void;
  onMarkDelivered: () => void;
  onOpenPrint: () => void;
};

export function OrderSidebar({
  status,
  lineCount,
  starting,
  packing,
  shipping,
  confirming,
  delivering,
  deletingOrder,
  onDeleteSalesOrder,
  onStartPicking,
  onMarkPacked,
  onMarkShipped,
  onConfirmOrder,
  onMarkDelivered,
  onOpenPrint,
}: OrderSidebarProps) {
  return (
    <aside className="lg:sticky lg:top-5 lg:self-start">
      <Card className="gap-0 py-0 shadow-sm">
        <CardHeader className="gap-2 border-b border-border/70 bg-slate-50/70 pb-3 pt-4 dark:bg-slate-900/30">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Thao tác nhanh</CardTitle>
          <div className="flex flex-row items-center justify-between gap-2">
            <Badge variant="outline" className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold", statusBadgeClass(status))}>
              {salesOrderStatusLabel(status)}
            </Badge>
            <span className="text-[11px] text-muted-foreground">{lineCount} dòng</span>
          </div>
        </CardHeader>

        <CardContent className="pb-4 pt-3">
          <div className="grid gap-2">
            {status === "PENDING" || status === "DRAFT" ? (
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                disabled={deletingOrder}
                onClick={onDeleteSalesOrder}
              >
                {deletingOrder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Xóa đơn
              </Button>
            ) : null}

            {status === "DRAFT" || status === "PENDING" ? (
              <Button type="button" onClick={onConfirmOrder} disabled={confirming || lineCount === 0} className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white">
                {confirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardCheck className="mr-2 h-4 w-4" />}
                Xác nhận đơn
              </Button>
            ) : null}

            <Button type="button" onClick={onStartPicking} disabled={starting || status !== "CONFIRMED" || lineCount === 0} className="w-full justify-center">
              {starting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Bắt đầu lấy hàng
            </Button>
            <Button
              type="button"
              onClick={onMarkPacked}
              disabled={packing || status !== "PICKED"}
              variant="outline"
              className="w-full justify-center"
            >
              {packing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Box className="mr-2 h-4 w-4" />}
              Đóng gói
            </Button>
            <Button type="button" onClick={onMarkShipped} disabled={shipping || status !== "PACKED"} variant="outline" className="w-full justify-center">
              {shipping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}
              Xuất kho
            </Button>

            <Button type="button" onClick={onMarkDelivered} disabled={delivering || status !== "SHIPPED"} variant="outline" className="w-full justify-center font-semibold text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400">
              {delivering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Hoàn thành giao hàng
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={onOpenPrint}
              className="w-full justify-center bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
            >
              <Printer className="mr-2 h-4 w-4" />
              In phiếu xuất
            </Button>
          </div>
          <Separator className="my-3" />
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            Chỉ xóa/sửa khi PENDING. Các thao tác tiếp theo sẽ tự khóa theo trạng thái.
          </p>
        </CardContent>
      </Card>
    </aside>
  );
}