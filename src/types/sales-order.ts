import type { SoItem } from "./so-item";

export type SalesOrderStatus = "DRAFT" | "PENDING" | "ON_HOLD" | "PICKING" | "PACKED" | "SHIPPED" | "CANCELLED";

export type SalesOrderAction = 
  | "confirm" 
  | "start-picking" 
  | "resume" 
  | "mark-packed" 
  | "mark-shipped" 
  | "hold" 
  | "cancel";

export type ShippingAddress = {
  line1: string;
  ward: string;
  district: string;
  city: string;
  country: string;
  phone?: string | null;
};

export interface SalesOrder {
  id: string;
  soNumber?: string | null;
  customerId?: string | null;
  customerName: string;
  shippingAddress: ShippingAddress;
  warehouseId: string;
  priority?: number | null;
  status: SalesOrderStatus;
  items?: SoItem[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type UpdateSalesOrderPayload = {
  soNumber: string;
  customerId?: string | null;
  customerName: string;
  shippingAddress: ShippingAddress;
  warehouseId: string;
  priority?: number | null;
  status?: string | null;
};

export function salesOrderStatusLabel(status: SalesOrderStatus | null | undefined): string {
  switch (status) {
    case "DRAFT": return "Bản nháp";
    case "PENDING": return "Sẵn sàng";
    case "PICKING": return "Đang lấy hàng";
    case "PACKED": return "Đã đóng gói";
    case "SHIPPED": return "Đã xuất kho";
    case "CANCELLED": return "Đã hủy";
    case "ON_HOLD": return "Tạm dừng";
    default: return status ?? "—";
  }
}

export function salesOrderStatusColor(status: SalesOrderStatus | null | undefined): string {
  switch (status) {
    case "DRAFT": return "bg-gray-100 text-gray-600";
    case "PENDING": return "bg-blue-50 text-blue-600";
    case "PICKING": return "bg-amber-50 text-amber-600";
    case "PACKED": return "bg-emerald-50 text-emerald-600 font-medium";
    case "SHIPPED": return "bg-purple-50 text-purple-600";
    case "CANCELLED": return "bg-slate-100 text-slate-500";
    case "ON_HOLD": return "bg-rose-50 text-rose-600";
    default: return "bg-slate-100 text-slate-500";
  }
}

export function formatShippingShort(addr: ShippingAddress | null | undefined): string {
  if (!addr) return "";
  const parts = [addr.line1, addr.ward, addr.district, addr.city].flatMap((s) => {
    const value = (s ?? "").trim();
    return value ? [value] : [];
  });
  return parts.join(", ");
}

