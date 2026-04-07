"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiErrMessage } from "@/types/api";
import type { Product } from "@/types/product";
import {
  useGetSalesOrderByIdQuery,
  useDeleteSalesOrderMutation,
  useExecuteSalesOrderActionMutation,
} from "@/store/services/order.service";
import { useGetSoItemsQuery } from "@/store/services/so-item.service";
import { useGetProductsQuery } from "@/store/services/product.service";
import { useGetWarehousesQuery } from "@/store/services/warehouse.service";

export function useSalesOrderDetailLogic(salesOrderId: string) {
  const router = useRouter();

  const { data: soRes, isLoading, isError, error, refetch, isFetching } = useGetSalesOrderByIdQuery(salesOrderId);
  const so = soRes?.data;

  const { data: itemsRes, isFetching: itemsFetching } = useGetSoItemsQuery(
    { salesOrderId },
    { skip: !so },
  );
  const soItems = useMemo(() => itemsRes?.data?.content ?? [], [itemsRes]);

  const { data: productsRes } = useGetProductsQuery({ page: 0, size: 200, sort: "updatedAt" });
  const products = useMemo(() => productsRes?.data?.content ?? [], [productsRes]);
  const productsById = useMemo(() => new Map(products.map((p) => [String(p.id), p as Product])), [products]);

  const { data: warehousesRes } = useGetWarehousesQuery(
    { page: 0, size: 200, sort: "name", sortDir: "asc" },
    { skip: !so },
  );
  const warehouses = useMemo(() => warehousesRes?.data?.content ?? [], [warehousesRes]);
  const warehouseOptions = useMemo(
    () => warehouses.map((w) => ({ value: String(w.id), label: String(w.name ?? w.id) })),
    [warehouses],
  );

  const warehouseById = useMemo(() => {
    const map = new Map<string, { name: string; code?: string }>();
    for (const w of warehouses) {
      map.set(w.id, { name: w.name, code: w.code });
    }
    return map;
  }, [warehouses]);

  const warehouseLabel = useMemo(() => {
    if (!so) return "-";
    const warehouse = warehouseById.get(so.warehouseId);
    if (!warehouse) return "-";
    return warehouse.code ? `${warehouse.name} (${warehouse.code})` : warehouse.name;
  }, [so, warehouseById]);

  const [deleteSalesOrder, { isLoading: deletingOrder }] = useDeleteSalesOrderMutation();
  const [executeAction, { isLoading: isExecuting }] = useExecuteSalesOrderActionMutation();

  const onDeleteSalesOrder = async () => {
    if (!so) return;

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
  };

  const onConfirmOrder = async () => {
    if (!so) return;
    if (soItems.length === 0) {
      toast.error("Thêm ít nhất 1 dòng hàng trước khi xác nhận đơn.");
      return;
    }
    try {
      const res = await executeAction({ salesOrderId: so.id, action: "confirm" }).unwrap();
      if (!res.success) toast.error(res.message || "Xác nhận thất bại");
      else toast.success("Đã xác nhận đơn");
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  };

  const onStartPicking = async () => {
    if (!so) return;
    if (soItems.length === 0) {
      toast.error("Thêm ít nhất 1 dòng hàng trước khi bắt đầu lấy hàng.");
      return;
    }

    try {
      const res = await executeAction({ salesOrderId: so.id, action: "start-picking" }).unwrap();
      if (!res.success) toast.error(res.message || "Không thể bắt đầu lấy hàng");
      else toast.success("Đã chuyển sang PICKING");
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  };

  const onMarkPacked = async () => {
    if (!so) return;
    if (soItems.length === 0) {
      toast.error("Không thể đóng gói khi đơn chưa có dòng hàng.");
      return;
    }
    if (so.status !== "PICKING") {
      toast.error("Chỉ đóng gói khi đơn đang PICKING");
      return;
    }

    try {
      const res = await executeAction({ salesOrderId: so.id, action: "mark-packed" }).unwrap();
      if (!res.success) toast.error(res.message || "Đóng gói thất bại");
      else toast.success("Đã đóng gói");
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  };

  const onMarkShipped = async () => {
    if (!so) return;
    if (soItems.length === 0) {
      toast.error("Không thể xuất kho khi đơn chưa có dòng hàng.");
      return;
    }

    try {
      const res = await executeAction({ salesOrderId: so.id, action: "mark-shipped" }).unwrap();
      if (!res.success) toast.error(res.message || "Xuất kho thất bại");
      else toast.success("Đã xuất kho");
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  };

  return {
    so,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    soItems,
    itemsFetching,
    products,
    productsById,
    warehouseOptions,
    warehouseLabel,
    deletingOrder,
    isExecuting,
    onDeleteSalesOrder,
    onStartPicking,
    onMarkPacked,
    onMarkShipped,
    onConfirmOrder,
  };
}
