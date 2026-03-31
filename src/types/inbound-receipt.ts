export type InboundReceiptStatus =
  | "RECEIVED"
  | "PUTAWAY_IN_PROGRESS"
  | "COMPLETED";

export interface InboundReceiptLine {
  id: string;
  inboundReceiptId: string;
  poItemId: string;
  productId?: string | null;
  productSku?: string | null;
  receivedQty: number;
  note?: string | null;
}

export interface InboundReceipt {
  id: string;
  receiptNumber: string;
  purchaseOrderId: string;
  poNumber?: string | null;
  warehouseId?: string | null;
  receivedDate?: string | null;
  locationId?: string | null;
  note?: string | null;
  status?: InboundReceiptStatus | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  items?: InboundReceiptLine[];
  lines?: InboundReceiptLine[];
}

export interface CreateInboundReceiptLine {
  poItemId: string;
  receivedQty: number;
  note?: string;
}

export interface CreateInboundReceiptRequest {
  purchaseOrderId: string;
  locationId: string;
  receivedDate?: string;
  note?: string;
  items: CreateInboundReceiptLine[];
}

export function inboundStatusLabel(
  status: InboundReceiptStatus | string | null | undefined,
): string {
  switch (status) {
    case "RECEIVED":
      return "Đã nhận hàng";
    case "PUTAWAY_IN_PROGRESS":
      return "Đang lên kệ";
    case "COMPLETED":
      return "Hoàn tất";
    default:
      return status ?? "—";
  }
}

export function inboundStatusColor(
  status: InboundReceiptStatus | string | null | undefined,
): string {
  switch (status) {
    case "RECEIVED":
      return "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400";
    case "PUTAWAY_IN_PROGRESS":
      return "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400";
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400";
    default:
      return "bg-slate-100 text-slate-500";
  }
}
