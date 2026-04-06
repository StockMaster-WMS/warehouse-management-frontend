"use client";

import { Loader2, Play, Box, Truck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { salesOrderStatusLabel } from "@/types/sales-order";
import type { SalesOrderStatus } from "@/types/sales-order";
import { cn } from "@/lib/utils";

function statusBadgeClass(status: SalesOrderStatus): string {
  switch (status) {
    case "PENDING":
      return "border-primary/20 bg-primary/10 text-primary";
    case "PICKING":
      return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200";
    case "PICKED":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-800 dark:text-cyan-200";
    case "PACKED":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
    case "SHIPPED":
      return "border-border bg-muted text-muted-foreground";
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
  deletingOrder: boolean;
  onDeleteSalesOrder: () => void;
  onStartPicking: () => void;
  onMarkPacked: () => void;
  onMarkShipped: () => void;
};

export function OrderSidebar({
  status,
  lineCount,
  starting,
  packing,
  shipping,
  deletingOrder,
  onDeleteSalesOrder,
  onStartPicking,
  onMarkPacked,
  onMarkShipped,
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
            {status === "PENDING" ? (
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
            <Button type="button" onClick={onStartPicking} disabled={starting || status !== "PENDING" || lineCount === 0} className="w-full justify-center">
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