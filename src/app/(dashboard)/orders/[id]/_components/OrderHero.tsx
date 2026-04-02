"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Package, User, Building2 } from "lucide-react";
import { formatShippingShort, salesOrderStatusColor, salesOrderStatusLabel } from "@/types/sales-order";
import type { SalesOrder } from "@/types/sales-order";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderWorkflowStepper } from "./OrderWorkflowStepper";
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
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:items-center">
          <div className="min-w-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tiến trình xử lý đơn</CardTitle>
            <CardDescription className="mt-1 text-xs">Theo dõi vòng đời đơn xuất từ khởi tạo đến hoàn tất xuất kho.</CardDescription>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tóm tắt điều phối</span>
            <Badge
              variant="outline"
              className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${salesOrderStatusColor(so.status)}`}
            >
              {salesOrderStatusLabel(so.status)} · {lineCount} dòng
            </Badge>
            {isFetching ? <span className="text-[11px] text-muted-foreground">Đang đồng bộ…</span> : null}
          </div>
        </div>
        <OrderWorkflowStepper status={so.status} />
      </CardHeader>

      <CardContent className="pb-5 pt-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Đơn xuất</p>
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

        <Separator className="my-3" />

        <div className="grid grid-cols-1 gap-3 text-sm text-foreground sm:grid-cols-2">
          <div className="rounded-lg border border-border/70 bg-background px-3 py-2">
            <div className="flex items-start gap-2">
            <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="font-semibold leading-snug">{so.customerName}</span>
          </div>
          </div>
          <div className="rounded-lg border border-border/70 bg-background px-3 py-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>
                <span className="font-semibold tabular-nums">{lineCount}</span> dòng hàng
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-border/70 bg-background px-3 py-2 sm:col-span-2">
            <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="leading-snug text-foreground/90">{formatShippingShort(so.shippingAddress)}</span>
          </div>
          </div>
          <div className="rounded-lg border border-border/70 bg-background px-3 py-2 sm:col-span-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="font-semibold" title={so.warehouseId}>
                {warehouseLabel}
              </span>
              <Link
                href="/inventory"
                className="text-xs font-medium text-primary underline-offset-2 hover:underline"
              >
                Xem tồn kho
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
