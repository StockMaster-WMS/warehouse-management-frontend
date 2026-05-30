"use client";

import { useState } from "react";
import { MapPin, Package, Phone, User, Building2 } from "lucide-react";
import { formatShippingShort, salesOrderStatusColor, salesOrderStatusLabel } from "@/types/sales-order";
import type { SalesOrder } from "@/types/sales-order";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OrderEditDialog } from "./OrderEditDialog";
import { DetailSection } from "@/components/detail-page";

type WarehouseOption = { value: string; label: string };

type OrderHeroProps = {
  so: SalesOrder;
  lineCount: number;
  warehouseLabel: string;
  warehouseOptions: WarehouseOption[];
  isFetching?: boolean;
  embedded?: boolean;
};

export function OrderHero({ so, lineCount, warehouseLabel, warehouseOptions, isFetching, embedded = false }: OrderHeroProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <DetailSection
      title="Tổng quan đơn xuất"
      description="Thông tin cốt lõi, trạng thái và các điểm điều phối quan trọng."
      icon={<Package className="size-4" />}
      surface={!embedded}
      className={embedded ? "rounded-none" : undefined}
      headerAction={
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
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="ui-label">Mã đơn</p>
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
                <p className="ui-label">Khách hàng</p>
                <p className="mt-0.5 font-semibold leading-snug">{so.customerName}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border/70 bg-background px-3 py-2">
            <div className="flex items-start gap-2">
              <Building2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="ui-label">Kho xuất</p>
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
                <p className="ui-label">Địa chỉ giao hàng</p>
                <p className="mt-0.5 leading-snug text-foreground/90">{formatShippingShort(so.shippingAddress)}</p>
              </div>
            </div>
          </div>
          {so.shippingAddress.phone ? (
            <div className="rounded-lg border border-border/70 bg-background px-3 py-2 sm:col-span-2">
              <div className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="ui-label">SĐT người nhận</p>
                  <p className="mt-0.5 leading-snug text-foreground/90">{so.shippingAddress.phone}</p>
                </div>
              </div>
            </div>
          ) : null}
          <div className="rounded-lg border border-border/70 bg-background px-3 py-2 sm:col-span-2">
            <div className="flex items-start gap-2">
              <Package className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="ui-label">Quy mô đơn</p>
                <p className="mt-0.5 leading-snug text-foreground/90">
                  <span className="font-semibold tabular-nums">{lineCount}</span> dòng hàng
                </p>
              </div>
            </div>
          </div>
        </div>

        {so.status === "CANCELLED" ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
            <span className="font-semibold">Đơn hàng này đã bị hủy.</span>
          </div>
        ) : null}
      </div>
    </DetailSection>
  );
}
