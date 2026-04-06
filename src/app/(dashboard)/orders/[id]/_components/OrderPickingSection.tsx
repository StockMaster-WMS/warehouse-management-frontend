"use client";

import { ScanLine } from "lucide-react";
import type { Product } from "@/types/product";
import type { SoItem } from "@/types/so-item";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderItemPickingBlock } from "./OrderItemPickingBlock";
type OrderPickingSectionProps = {
  soItems: SoItem[];
  salesOrderStatus: string;
  warehouseId: string;
  productsById: Map<string, Product>;
};

export function OrderPickingSection({ soItems, salesOrderStatus, warehouseId, productsById }: OrderPickingSectionProps) {
  return (
    <Card className="gap-0 py-0 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-start gap-3 pb-3 pt-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-emerald-500/20 bg-emerald-500/5">
          <ScanLine className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
        </div>
        <div className="min-w-0">
          <CardTitle className="text-base">Lấy hàng</CardTitle>
          <CardDescription>Xác nhận từng vị trí/lô sau khi lấy đúng số lượng.</CardDescription>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-3 pb-5 pt-4">
        {soItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Thêm dòng hàng để xem lệnh lấy.</p>
        ) : (
          soItems.map((l) => (
            <OrderItemPickingBlock
              key={`pick-${l.id}`}
              soItem={l}
              salesOrderStatus={salesOrderStatus}
              warehouseId={warehouseId}
              productsById={productsById}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
