"use client";

import { useState } from "react";
import { type LucideIcon, MapPin, Package, User, Building2, Clock, Search, CheckCircle2, Box, Truck } from "lucide-react";
import { formatShippingShort, salesOrderStatusColor, salesOrderStatusLabel } from "@/types/sales-order";
import { cn } from "@/lib/utils";
import type { SalesOrder } from "@/types/sales-order";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderEditDialog } from "./OrderEditDialog";

type WarehouseOption = { value: string; label: string };

type OrderHeroProps = {
  so: SalesOrder;
  lineCount: number;
  warehouseLabel: string;
  warehouseOptions: WarehouseOption[];
  isFetching?: boolean;
};

export function OrderHero({ so, lineCount, warehouseLabel, warehouseOptions, isFetching }: OrderHeroProps) {
  const [editOpen, setEditOpen] = useState(false);

  const steps = ["DRAFT", "CONFIRMED", "PICKING", "PACKED", "SHIPPED", "DELIVERED"];
  const stepIcons: Record<string, LucideIcon> = {
    DRAFT: Clock,
    CONFIRMED: CheckCircle2,
    PICKING: Search,
    PACKED: Box,
    SHIPPED: Truck,
    DELIVERED: CheckCircle2,
  };
  const stepLabels: Record<string, string> = {
    DRAFT: "Nháp",
    CONFIRMED: "Xác nhận",
    PICKING: "Lấy hàng",
    PACKED: "Đóng gói",
    SHIPPED: "Xuất kho",
    DELIVERED: "Hoàn tất",
  };

  const currentStepIndex = so.status === "CANCELLED" ? -1 : steps.indexOf(so.status);
  const getProgressPercentage = () => {
    if (currentStepIndex <= 0) return 0;
    return (currentStepIndex / (steps.length - 1)) * 100;
  };

  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-sm">
      <CardHeader className="gap-3 border-b border-border/70 bg-slate-50/70 pb-4 pt-5 dark:bg-slate-900/30">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Tổng quan đơn xuất</CardTitle>
            <CardDescription className="text-xs">Thông tin cốt lõi, trạng thái và các điểm điều phối quan trọng.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 whitespace-nowrap">
            <Badge
              variant="outline"
              className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${salesOrderStatusColor(so.status)}`}
            >
              {salesOrderStatusLabel(so.status)}
            </Badge>
            <Badge variant="secondary" className="rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums">
              {lineCount} dòng
            </Badge>
            {isFetching ? <span className="text-[11px] text-muted-foreground">Đang đồng bộ…</span> : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-5 pt-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mã đơn</p>
            <p className="mt-1 text-xl font-black tracking-tight text-foreground">
              {so.soNumber || `SO-${so.id.slice(0, 8)}`}
            </p>
          </div>
          {so.status === "PENDING" && warehouseOptions.length > 0 ? (
            <>
              <Button type="button" variant="outline" size="sm" className="shrink-0 border-slate-200" onClick={() => setEditOpen(true)}>
                Sửa đơn
              </Button>
              <OrderEditDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                salesOrder={so}
                warehouseOptions={warehouseOptions}
              />
            </>
          ) : null}
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-3 text-sm text-foreground sm:grid-cols-2">
          <div className="rounded-lg border border-border/70 bg-background px-3 py-2">
            <div className="flex items-start gap-2">
              <User className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Khách hàng</p>
                <p className="mt-0.5 font-semibold leading-snug">{so.customerName}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border/70 bg-background px-3 py-2">
            <div className="flex items-start gap-2">
              <Building2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Kho xuất</p>
                <p className="mt-0.5 font-semibold leading-snug" title={so.warehouseId}>
                  {warehouseLabel}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border/70 bg-background px-3 py-2 sm:col-span-2">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Địa chỉ giao hàng</p>
                <p className="mt-0.5 leading-snug text-foreground/90">{formatShippingShort(so.shippingAddress)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border/70 bg-background px-3 py-2 sm:col-span-2">
            <div className="flex items-start gap-2">
              <Package className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Quy mô đơn</p>
                <p className="mt-0.5 leading-snug text-foreground/90">
                  <span className="font-semibold tabular-nums">{lineCount}</span> dòng hàng
                </p>
              </div>
            </div>
          </div>
        </div>

        {so.status !== "CANCELLED" ? (
          <div className="pt-2 pb-5 mt-2">
            <p className="mb-5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Tiến trình vận hành</p>
            <div className="relative flex items-center justify-between px-2 sm:px-6">
              <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-slate-100 dark:bg-slate-800" />
              <div 
                className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-indigo-500 transition-all duration-500" 
                style={{ width: `${getProgressPercentage()}%` }} 
              />
              {steps.map((step, index) => {
                const Icon = stepIcons[step];
                const isActive = index === currentStepIndex;
                const isPast = index < currentStepIndex;
                return (
                  <div key={step} className="relative flex flex-col items-center">
                    <div className={cn(
                      "flex size-8 relative z-10 items-center justify-center rounded-full border-2 bg-background transition-colors",
                      isActive ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : isPast ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-200 text-slate-300 dark:border-slate-800 dark:text-slate-600"
                    )}>
                      <Icon className="size-4" />
                    </div>
                    <span className={cn(
                      "absolute -bottom-6 w-24 text-center text-[10px] font-semibold uppercase tracking-wider",
                      isActive ? "text-indigo-600 dark:text-indigo-400" : isPast ? "text-slate-600 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"
                    )}>
                      {stepLabels[step]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
            <span className="font-semibold">Đơn hàng này đã bị hủy.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
