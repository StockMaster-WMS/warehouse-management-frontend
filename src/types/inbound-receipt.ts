export type InboundReceiptStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED";

export interface InboundReceipt {
  id: string;
  code: string;
  supplierId?: string | null;
  supplierName?: string | null;
  warehouseId?: string | null;
  expectedDate?: string | null;
  totalItems?: number | null;
  receivedItems?: number | null;
  status: InboundReceiptStatus;
  type?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export function inboundStatusLabel(status: InboundReceiptStatus | null | undefined): string {
  switch (status) {
    case "COMPLETED": return "Đã hoàn thành";
    case "PROCESSING": return "Đang nhận hàng";
    case "PENDING": return "Đang chờ hàng";
    case "CANCELLED": return "Đã hủy";
    default: return status ?? "—";
  }
}

export function inboundStatusColor(status: InboundReceiptStatus | null | undefined): string {
  switch (status) {
    case "COMPLETED": return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400";
    case "PROCESSING": return "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400";
    case "PENDING": return "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400";
    case "CANCELLED": return "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
    default: return "bg-slate-100 text-slate-500";
  }
}
