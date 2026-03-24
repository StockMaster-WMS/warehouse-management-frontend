export type OrderStatus = "PENDING" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";

export interface Order {
  id: string;
  code: string;
  destination?: string | null;
  status: OrderStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export function orderStatusLabel(status: OrderStatus | null | undefined): string {
  switch (status) {
    case "IN_TRANSIT": return "Đang vận chuyển";
    case "PENDING": return "Chờ lấy hàng";
    case "DELIVERED": return "Đã giao";
    case "CANCELLED": return "Đã hủy";
    default: return status ?? "—";
  }
}

export function orderStatusColor(status: OrderStatus | null | undefined): string {
  switch (status) {
    case "IN_TRANSIT": return "bg-amber-50 text-amber-600";
    case "PENDING": return "bg-indigo-50 text-indigo-600";
    case "DELIVERED": return "bg-emerald-50 text-emerald-600";
    case "CANCELLED": return "bg-slate-100 text-slate-500";
    default: return "bg-slate-100 text-slate-500";
  }
}
