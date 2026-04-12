"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiErrMessage } from "@/types/api";
import type { Product } from "@/types/product";
import type { SalesOrderAction } from "@/types/sales-order";
import {
  useGetSalesOrderByIdQuery,
  useDeleteSalesOrderMutation,
  useExecuteSalesOrderActionMutation,
} from "@/store/services/order.service";
import { useGetSoItemsQuery } from "@/store/services/so-item.service";
import { useGetProductsByIdsQuery } from "@/store/services/product.service";
import {
  useGetWarehouseByIdQuery,
  useGetWarehousesQuery,
} from "@/store/services/warehouse.service";

export function useSalesOrderDetailLogic(salesOrderId: string) {
  const router = useRouter();

  const { data: soRes, isLoading, isError, error, refetch, isFetching } = useGetSalesOrderByIdQuery(salesOrderId);
  const so = soRes?.data;

  const { data: itemsRes, isFetching: itemsFetching } = useGetSoItemsQuery(
    { salesOrderId },
    { skip: !so },
  );
  const soItems = useMemo(() => itemsRes?.data?.content ?? [], [itemsRes]);

  const productIds = useMemo(
    () => [...new Set(soItems.map((item) => String(item.productId)).filter(Boolean))],
    [soItems],
  );
  const { data: productsRes } = useGetProductsByIdsQuery(productIds, {
    skip: productIds.length === 0,
  });
  const products = useMemo(() => productsRes?.data ?? [], [productsRes]);
  const productsById = useMemo(() => new Map(products.map((p) => [String(p.id), p as Product])), [products]);

  const { data: currentWarehouseRes } = useGetWarehouseByIdQuery(so?.warehouseId ?? "", {
    skip: !so?.warehouseId,
  });

  const { data: warehousesRes } = useGetWarehousesQuery(
    { page: 0, size: 200, sort: "name", sortDir: "asc" },
    { skip: !so },
  );
  const warehouses = useMemo(() => warehousesRes?.data?.content ?? [], [warehousesRes]);
  const warehouseOptions = useMemo(() => {
    const options = warehouses.map((w) => ({
      value: String(w.id),
      label: String(w.name ?? w.id),
    }));
    const currentWarehouse = currentWarehouseRes?.data;

    if (
      currentWarehouse &&
      !options.some((option) => option.value === String(currentWarehouse.id))
    ) {
      return [
        {
          value: String(currentWarehouse.id),
          label: String(currentWarehouse.name ?? currentWarehouse.id),
        },
        ...options,
      ];
    }

    return options;
  }, [warehouses, currentWarehouseRes]);

  const warehouseLabel = useMemo(() => {
    const warehouse = currentWarehouseRes?.data;
    if (!warehouse) return "-";
    return warehouse.code ? `${warehouse.name} (${warehouse.code})` : warehouse.name;
  }, [currentWarehouseRes]);

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

  const runOrderAction = async (
    action: SalesOrderAction,
    successMessage: string,
    fallbackError: string,
  ) => {
    if (!so) return;

    try {
      const res = await executeAction({ salesOrderId: so.id, action }).unwrap();
      if (!res.success) {
        toast.error(res.message || fallbackError);
        return;
      }
      toast.success(successMessage);
    } catch (err) {
      toast.error(apiErrMessage(err, fallbackError));
    }
  };

  const onConfirmOrder = async () => {
    if (soItems.length === 0) {
      toast.error("Thêm ít nhất 1 dòng hàng trước khi xác nhận đơn.");
      return;
    }
    await runOrderAction("confirm", "Đã xác nhận đơn", "Xác nhận thất bại");
  };

  const onStartPicking = async () => {
    if (soItems.length === 0) {
      toast.error("Thêm ít nhất 1 dòng hàng trước khi bắt đầu lấy hàng.");
      return;
    }

    await runOrderAction("start-picking", "Đã chuyển sang PICKING", "Không thể bắt đầu lấy hàng");
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

    await runOrderAction("mark-packed", "Đã đóng gói", "Đóng gói thất bại");
  };

  const onMarkShipped = async () => {
    if (soItems.length === 0) {
      toast.error("Không thể xuất kho khi đơn chưa có dòng hàng.");
      return;
    }

    await runOrderAction("mark-shipped", "Đã xuất kho", "Xuất kho thất bại");
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
