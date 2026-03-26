export type SalesOrderStatus = "PENDING" | "PICKING" | "PICKED" | "PACKED" | "SHIPPED" | "CANCELLED";

export type ShippingAddress = {
  line1: string;
  ward: string;
  district: string;
  city: string;
  country: string;
};

export interface SalesOrder {
  id: string;
  soNumber?: string | null;
  customerName: string;
  shippingAddress: ShippingAddress;
  warehouseId: string;
  priority?: number | null;
  status: SalesOrderStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export function salesOrderStatusLabel(status: SalesOrderStatus | null | undefined): string {
  switch (status) {
    case "PENDING": return "Chờ xử lý";
    case "PICKING": return "Đang lấy hàng";
    case "PICKED": return "Đã lấy đủ";
    case "PACKED": return "Đã đóng gói";
    case "SHIPPED": return "Đã xuất kho";
    case "CANCELLED": return "Đã hủy";
    default: return status ?? "—";
  }
}

export function salesOrderStatusColor(status: SalesOrderStatus | null | undefined): string {
  switch (status) {
    case "PENDING": return "bg-indigo-50 text-indigo-600";
    case "PICKING": return "bg-amber-50 text-amber-600";
    case "PICKED": return "bg-cyan-50 text-cyan-600";
    case "PACKED": return "bg-emerald-50 text-emerald-600";
    case "SHIPPED": return "bg-slate-100 text-slate-600";
    case "CANCELLED": return "bg-slate-100 text-slate-500";
    default: return "bg-slate-100 text-slate-500";
  }
}

export function formatShippingShort(addr: ShippingAddress | null | undefined): string {
  if (!addr) return "";
  const parts = [addr.line1, addr.ward, addr.district, addr.city].map((s) => (s ?? "").trim()).filter(Boolean);
  return parts.join(", ");
}

