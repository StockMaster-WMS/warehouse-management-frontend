"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Package, User, Building2 } from "lucide-react";
import { formatShippingShort } from "@/types/sales-order";
import type { SalesOrder } from "@/types/sales-order";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderWorkflowStepper } from "./order-workflow-stepper";
import { OrderEditDialog } from "./order-edit-dialog";

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
    <Card className="gap-0 py-0 shadow-sm">
      <CardHeader className="gap-3 pb-4 pt-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tiến trình</CardTitle>
            <CardDescription className="sr-only">Trạng thái xử lý đơn hàng qua các bước</CardDescription>
          </div>
          {isFetching ? <span className="text-[11px] text-muted-foreground">Đang đồng bộ…</span> : null}
        </div>
        <OrderWorkflowStepper status={so.status} />
      </CardHeader>

      <Separator />

      <CardContent className="pb-5 pt-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Đơn xuất</p>
            <p className="mt-1 text-lg font-black tracking-tight text-foreground">
              {so.soNumber || `SO-${so.id.slice(0, 8)}`}
            </p>
          </div>
          {so.status === "PENDING" && warehouseOptions.length > 0 ? (
            <>
              <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setEditOpen(true)}>
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
        <div className="mt-3 grid grid-cols-1 gap-2.5 text-sm text-foreground sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="font-semibold leading-snug">{so.customerName}</span>
          </div>
          <div className="flex items-start gap-2 sm:col-span-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="leading-snug text-foreground/90">{formatShippingShort(so.shippingAddress)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>
              <span className="font-semibold tabular-nums">{lineCount}</span> dòng
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:col-span-2">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="font-semibold" title={so.warehouseId}>
              {warehouseLabel}
            </span>
            <Link
              href="/inventory"
              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            >
              Tồn kho
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
