"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiErrMessage } from "@/types/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGetWarehousesQuery } from "@/store/services/warehouse.service";
import { useCreateSalesOrderMutation } from "@/store/services/order.service";
import { useGetCustomersQuery } from "@/store/services/customer.service";
import { type AddressValue } from "@/components/features/AddressForm";
import { newOrderSchema } from "@/components/features/orders/schemas/newOrderSchema";
import type { Customer, CustomerAddress } from "@/types/customer";

export type NewOrderFormErrors = Partial<Record<"customerId" | "customerName" | "line1" | "ward" | "district" | "city" | "country" | "warehouseId" | "priority", string>>;

function getAddressText(
  address: CustomerAddress | string | null | undefined,
  keys: string[],
) {
  if (!address) return "";
  if (typeof address === "string") return address.trim();

  for (const key of keys) {
    const value = address[key];
    if (typeof value === "string" || typeof value === "number") {
      const text = String(value).trim();
      if (text) return text;
    }
  }

  return "";
}

function customerToAddressValue(customer: Customer): AddressValue {
  const address = customer.address;

  return {
    street: getAddressText(address, ["line1", "street", "address"]),
    provinceCode: getAddressText(address, ["provinceCode", "cityCode"]),
    provinceName: getAddressText(address, ["provinceName", "city", "province"]),
    districtCode: getAddressText(address, ["districtCode"]),
    districtName: getAddressText(address, ["districtName", "district"]),
    wardCode: getAddressText(address, ["wardCode"]),
    wardName: getAddressText(address, ["wardName", "ward"]),
  };
}

export function useCreateOrderForm(warehouseIdFromUrl = "") {
  const { push } = useRouter();

  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const debouncedCustomerKeyword = useDebouncedValue(customerSearch.trim());
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
  const [warehouseId, setWarehouseIdState] = useState(warehouseIdFromUrl);
  const [priority, setPriority] = useState("1");
  const [errors, setErrors] = useState<NewOrderFormErrors>({});
  const [addressFormKey, setAddressFormKey] = useState(0);

  const { data: customersRes, isFetching: customersLoading } = useGetCustomersQuery({
    page: 0,
    size: 20,
    sort: "name",
    sortDir: "asc",
    keyword: debouncedCustomerKeyword || undefined,
    isActive: true,
  });

  const { data: warehousesRes, isFetching: warehousesLoading } = useGetWarehousesQuery({
    page: 0,
    size: 200,
    sort: "name",
    sortDir: "asc",
  });

  const [createSalesOrder, { isLoading: creating }] = useCreateSalesOrderMutation();

  const warehouses = useMemo(() => warehousesRes?.data?.content ?? [], [warehousesRes]);
  const customers = useMemo(() => customersRes?.data?.content ?? [], [customersRes]);

  const warehouseOptions = useMemo(
    () => warehouses.map((w) => ({ value: String(w.id), label: String(w.name ?? w.id) })),
    [warehouses],
  );

  const customerOptions = useMemo(() => {
    const optionCustomers = selectedCustomer && !customers.some((customer) => customer.id === selectedCustomer.id)
      ? [selectedCustomer, ...customers]
      : customers;

    return optionCustomers.map((customer) => ({
      value: customer.id,
      label: `${customer.code} · ${customer.name}`,
      hint: [customer.phone, customer.email].filter(Boolean).join(" · "),
    }));
  }, [customers, selectedCustomer]);

  const clearFieldError = (field: keyof NewOrderFormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const setWarehouseId = (nextWarehouseId: string) => {
    setWarehouseIdState(nextWarehouseId);
  };

  const handleCustomerChange = (nextCustomerId: string) => {
    setCustomerId(nextCustomerId);
    clearFieldError("customerId");
    clearFieldError("customerName");

    const customer =
      customers.find((item) => item.id === nextCustomerId) ??
      (selectedCustomer?.id === nextCustomerId ? selectedCustomer : null);
    if (!customer) return;

    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setPhone(customer.phone ?? "");

    const nextAddress = customerToAddressValue(customer);
    setAddress(nextAddress);
    setAddressFormKey((key) => key + 1);
  };

  const validate = () => {
    const parsed = newOrderSchema.safeParse({
      customerId,
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
      if (path === "customerId") next.customerId = issue.message;
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
        customerId,
        customerName: customerName.trim(),
        shippingAddress: {
          line1: address.street.trim(),
          ward: address.wardName,
          district: address.districtName,
          city: address.provinceName,
          country: country.trim().toUpperCase(),
          phone: phone.trim() || undefined,
        },
        warehouseId,
        priority: Number(priority),
      }).unwrap();

      if (!res.success) {
        toast.error(res.message || "Tạo đơn xuất thất bại");
        return;
      }

      const orderId = res.data?.id;
      if (!orderId) {
        toast.error("Đã tạo đơn xuất nhưng không nhận được mã đơn để mở chi tiết.");
        return;
      }

      toast.success(res.message || "Đã tạo đơn xuất thành công");

      push(`/orders/${orderId}`);
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể tạo đơn xuất"));
    }
  };

  return {
    customerId,
    customerSearch,
    setCustomerSearch,
    customerOptions,
    customersLoading,
    handleCustomerChange,
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
    addressFormKey,
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
