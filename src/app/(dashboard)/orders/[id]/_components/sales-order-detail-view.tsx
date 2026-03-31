"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiErrMessage } from "@/types/api";
import type { Product } from "@/types/product";

import {
  useGetSalesOrderByIdQuery,
  useDeleteSalesOrderMutation,
  useStartPickingMutation,
  useMarkPackedMutation,
  useMarkShippedMutation,
} from "@/store/services/order.service";
import { useGetSoItemsQuery } from "@/store/services/so-item.service";
import { useGetProductsQuery } from "@/store/services/product.service";
import { useGetWarehousesQuery } from "@/store/services/warehouse.service";

import { OrderDetailSkeleton } from "./order-detail-skeleton";
import { OrderDetailError } from "./order-detail-error";
import { OrderHero } from "./order-hero";
import { OrderLinesSection } from "./order-lines-section";
import { OrderPickingSection } from "./order-picking-section";
import { OrderSidebar } from "./order-sidebar";

type SalesOrderDetailViewProps = {
  salesOrderId: string;
};

export function SalesOrderDetailView({ salesOrderId }: SalesOrderDetailViewProps) {
  const router = useRouter();
  const { data: soRes, isLoading, isError, error, refetch, isFetching } = useGetSalesOrderByIdQuery(salesOrderId);
  const so = soRes?.data;

  const { data: itemsRes, isFetching: itemsFetching } = useGetSoItemsQuery(
    { salesOrderId },
    { skip: !so }
  );
  const soItems = useMemo(() => itemsRes?.data?.content ?? [], [itemsRes]);

  const { data: productsRes } = useGetProductsQuery({ page: 0, size: 200, sort: "updatedAt" });
  const products = useMemo(() => productsRes?.data?.content ?? [], [productsRes]);
  const productsById = useMemo(() => new Map(products.map((p) => [String(p.id), p as Product])), [products]);

  const { data: warehousesRes } = useGetWarehousesQuery(
    { page: 0, size: 200, sort: "name", sortDir: "asc" },
    { skip: !so }
  );
  const warehouses = useMemo(() => warehousesRes?.data?.content ?? [], [warehousesRes]);
  const warehouseOptions = useMemo(
    () => warehouses.map((w) => ({ value: String(w.id), label: String(w.name ?? w.id) })),
    [warehouses]
  );
  const warehouseById = useMemo(() => {
    const m = new Map<string, { name: string; code?: string }>();
    for (const w of warehousesRes?.data?.content ?? []) {
      m.set(w.id, { name: w.name, code: w.code });
    }
    return m;
  }, [warehousesRes]);

  const warehouseLabel = useMemo(() => {
    if (!so) return "—";
    const w = warehouseById.get(so.warehouseId);
    if (!w) return "—";
    return w.code ? `${w.name} (${w.code})` : w.name;
  }, [so, warehouseById]);

  const [deleteSalesOrder, { isLoading: deletingOrder }] = useDeleteSalesOrderMutation();
  const [startPicking, { isLoading: starting }] = useStartPickingMutation();
  const [markPacked, { isLoading: packing }] = useMarkPackedMutation();
  const [markShipped, { isLoading: shipping }] = useMarkShippedMutation();

  async function onDeleteSalesOrder() {
    if (!so) return;
    const ok = window.confirm(
      "Xóa đơn xuất? Chỉ thực hiện được khi đơn PENDING và chưa có dòng picking (theo backend)."
    );
    if (!ok) return;
    try {
      const res = await deleteSalesOrder(so.id).unwrap();
      if (!res.success) {
        toast.error(typeof res.message === "string" ? res.message : "Xóa đơn thất bại");
        return;
      }
      toast.success("Đã xóa đơn");
      router.push("/orders");
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  async function onStartPicking() {
    if (!so) return;
    if (soItems.length === 0) {
      toast.error("Thêm ít nhất 1 dòng hàng trước khi bắt đầu lấy hàng.");
      return;
    }
    try {
      const res = await startPicking({ salesOrderId: so.id }).unwrap();
      if (!res.success) toast.error(res.message || "Không thể bắt đầu lấy hàng");
      else toast.success("Đã chuyển sang PICKING");
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  async function onMarkPacked() {
    if (!so) return;
    if (soItems.length === 0) {
      toast.error("Không thể đóng gói khi đơn chưa có dòng hàng.");
      return;
    }
    if (so.status === "PICKING") {
      const ok = window.confirm(
        "Đơn đang PICKING. Chỉ đóng gói khi đã lấy đủ (PICKED). Tiếp tục?"
      );
      if (!ok) return;
    }
    try {
      const res = await markPacked({ salesOrderId: so.id }).unwrap();
      if (!res.success) toast.error(res.message || "Đóng gói thất bại");
      else toast.success("Đã đóng gói");
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  async function onMarkShipped() {
    if (!so) return;
    if (soItems.length === 0) {
      toast.error("Không thể xuất kho khi đơn chưa có dòng hàng.");
      return;
    }
    const ok = window.confirm("Xác nhận xuất kho đơn này?");
    if (!ok) return;
    try {
      const res = await markShipped({ salesOrderId: so.id }).unwrap();
      if (!res.success) toast.error(res.message || "Xuất kho thất bại");
      else toast.success("Đã xuất kho");
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (isError || !so) {
    return <OrderDetailError error={error} onRetry={() => refetch()} />;
  }

  return (
    <div className="mx-auto max-w-8xl space-y-5">
      <OrderHero
        so={so}
        lineCount={soItems.length}
        warehouseLabel={warehouseLabel}
        warehouseOptions={warehouseOptions}
        isFetching={isFetching}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
        <div className="min-w-0 space-y-5">
          <OrderLinesSection
            salesOrder={so}
            soItems={soItems}
            products={products}
            itemsFetching={itemsFetching}
          />
          <OrderPickingSection
            soItems={soItems}
            salesOrderStatus={so.status}
            productsById={productsById}
          />
        </div>

        <OrderSidebar
          status={so.status}
          lineCount={soItems.length}
          starting={starting}
          packing={packing}
          shipping={shipping}
          deletingOrder={deletingOrder}
          onDeleteSalesOrder={onDeleteSalesOrder}
          onStartPicking={onStartPicking}
          onMarkPacked={onMarkPacked}
          onMarkShipped={onMarkShipped}
        />
      </div>
    </div>
  );
}
