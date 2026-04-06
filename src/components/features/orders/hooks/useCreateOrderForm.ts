"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { apiErrMessage } from "@/types/api";
import { useGetWarehousesQuery } from "@/store/services/warehouse.service";
import { useCreateSalesOrderMutation } from "@/store/services/order.service";
import { type AddressValue } from "@/components/features/AddressForm";
import { newOrderSchema } from "@/components/features/orders/schemas/newOrderSchema";

export type NewOrderFormErrors = Partial<Record<"customerName" | "line1" | "ward" | "district" | "city" | "country" | "warehouseId" | "priority", string>>;

export function useCreateOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const warehouseIdFromUrl = searchParams.get("warehouseId")?.trim() ?? "";
  const appliedWarehouseFromUrl = useRef(false);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState<AddressValue>({
    street: "",
    provinceCode: "",
    provinceName: "",
    districtCode: "",
    districtName: "",
    wardCode: "",
    wardName: "",
  });
  const [country, setCountry] = useState("VN");
  const [warehouseId, setWarehouseId] = useState("");
  const [priority, setPriority] = useState("5");
  const [errors, setErrors] = useState<NewOrderFormErrors>({});

  const { data: warehousesRes, isFetching: warehousesLoading } = useGetWarehousesQuery({
    page: 0,
    size: 200,
    sort: "name",
    sortDir: "asc",
  });

  const [createSalesOrder, { isLoading: creating }] = useCreateSalesOrderMutation();

  const warehouses = useMemo(() => warehousesRes?.data?.content ?? [], [warehousesRes]);

  useEffect(() => {
    if (appliedWarehouseFromUrl.current || !warehouseIdFromUrl || warehousesLoading) return;
    const exists = warehouses.some((w) => String(w.id) === warehouseIdFromUrl);
    if (exists) {
      setWarehouseId(warehouseIdFromUrl);
      appliedWarehouseFromUrl.current = true;
    }
  }, [warehouseIdFromUrl, warehousesLoading, warehouses]);

  const warehouseOptions = useMemo(
    () => warehouses.map((w) => ({ value: String(w.id), label: String(w.name ?? w.id) })),
    [warehouses],
  );

  const clearFieldError = (field: keyof NewOrderFormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const parsed = newOrderSchema.safeParse({
      customerName,
      street: address.street,
      wardCode: address.wardCode,
      provinceCode: address.provinceCode,
      country,
      warehouseId,
      priority: Number(priority),
    });

    if (parsed.success) {
      setErrors({});
      return true;
    }

    const next: NewOrderFormErrors = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      if (path === "customerName") next.customerName = issue.message;
      if (path === "street") next.line1 = issue.message;
      if (path === "wardCode") next.ward = issue.message;
      if (path === "provinceCode") next.city = issue.message;
      if (path === "country") next.country = issue.message;
      if (path === "warehouseId") next.warehouseId = issue.message;
      if (path === "priority") next.priority = issue.message;
    }
    setErrors(next);
    return false;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Vui lòng kiểm tra lại thông tin đơn xuất");
      return;
    }

    try {
      const res = await createSalesOrder({
        customerName: customerName.trim(),
        shippingAddress: {
          line1: address.street.trim(),
          ward: address.wardName,
          district: address.districtName,
          city: address.provinceName,
          country: country.trim().toUpperCase(),
        },
        warehouseId,
        priority: Number(priority),
      }).unwrap();

      if (!res.success) {
        toast.error(res.message || "Tạo đơn xuất thất bại");
        return;
      }

      toast.success(res.message || "Đã tạo đơn xuất thành công");
      router.push(`/orders/${res.data.id}`);
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể tạo đơn xuất"));
    }
  };

  return {
    customerName,
    setCustomerName,
    phone,
    setPhone,
    address,
    setAddress,
    country,
    setCountry,
    warehouseId,
    setWarehouseId,
    priority,
    setPriority,
    errors,
    clearFieldError,
    warehouses,
    warehousesLoading,
    warehouseOptions,
    warehouseIdFromUrl,
    creating,
    onSubmit,
  };
}
