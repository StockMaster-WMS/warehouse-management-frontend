"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, Package, User, Building2 } from "lucide-react";
import { formatShippingShort, salesOrderStatusColor, salesOrderStatusLabel } from "@/types/sales-order";
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
              <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Khách hàng</p>
                <p className="mt-0.5 font-semibold leading-snug">{so.customerName}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border/70 bg-background px-3 py-2">
            <div className="flex items-start gap-2">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
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
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Địa chỉ giao hàng</p>
                <p className="mt-0.5 leading-snug text-foreground/90">{formatShippingShort(so.shippingAddress)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border/70 bg-background px-3 py-2 sm:col-span-2">
            <div className="flex items-start gap-2">
              <Package className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Quy mô đơn</p>
                <p className="mt-0.5 leading-snug text-foreground/90">
                  <span className="font-semibold tabular-nums">{lineCount}</span> dòng hàng
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border/70 bg-background px-3 py-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5" />
            Giảm số khu vực luôn mở để đọc nhanh trạng thái hiện tại.
          </span>
          <Link href="/inventory" className="font-medium text-primary underline-offset-2 hover:underline">
            Xem tồn kho
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
