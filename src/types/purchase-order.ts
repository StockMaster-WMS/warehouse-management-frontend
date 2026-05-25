// ============================================================
// Purchase Order – types & payloads
// ============================================================
import type { ApiResponse, PagedResponse } from "@/types/api";
import type { PutawayTask } from "@/types/putaway";

export type PurchaseOrderStatus =
  | "DRAFT"
  | "APPROVED"
  | "PARTIAL"
  | "COMPLETED"
  | "CANCELLED";

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  warehouseId: string;
  supplierName?: string | null;
  warehouseName?: string | null;
  orderDate: string;
  expectedDate?: string | null;
  status?: PurchaseOrderStatus | null;
  totalAmount?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseOrderProgress {
  totalOrderedQty: number;
  totalReceivedQty: number;
  fullyReceived: boolean;
}

export interface PurchaseOrderDetail {
  purchaseOrder: PurchaseOrder;
  items: PoItem[];
  putawayTasks: PutawayTask[];
  progress: PurchaseOrderProgress;
}

export interface CreatePurchaseOrderRequest {
  supplierId: string;
  warehouseId: string;
  orderDate: string;
  expectedDate?: string;
  totalAmount?: number;
}

export type CreatePurchaseOrderPayload = CreatePurchaseOrderRequest;

export interface UpdatePurchaseOrderPayload {
  id: string;
  body: Partial<{
    supplierId: string;
    warehouseId: string;
    orderDate: string;
    expectedDate: string | null;
    totalAmount: number | null;
  }>;
}

// ---- PO Line Items ----

export interface PoItem {
  id: string;
  purchaseOrderId: string;
  lineNumber: number;
  productId: string;
  productName?: string | null;
  productSku: string;
  orderedQty: number;
  receivedQty?: number | null;
  unitPrice?: number | null;
}

export interface CreatePoItemPayload {
  purchaseOrderId: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  orderedQty: number;
  unitPrice?: number;
}

export interface UpdatePoItemPayload {
  id: string;
  body: {
    productId?: string;
    productSku?: string;
    orderedQty?: number;
    unitPrice?: number | null;
  };
}

export type PurchaseOrderListResponse = ApiResponse<
  PurchaseOrder[] | PagedResponse<PurchaseOrder>
>;

// ---- Excel Import ----

export interface ImportProductsExcelResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  createdItems: Array<{
    lineNumber: number;
    productId: string;
    productSku: string;
    orderedQty: number;
    unitPrice?: number | null;
  }>;
  errors: Array<{
    row: number;
    field?: string;
    message: string;
  }>;
}

// ============================================================
// Re-exports for backward compatibility
// Các file cũ vẫn import từ "@/types/purchase-order" sẽ không bị lỗi
// ============================================================
export type {
  PutawayTask,
  PutawayTaskStatus,
  PatchPutawayTaskPayload,
  CompletePutawayPayload,
  PutawayLocationSuggestion,
} from "@/types/putaway";

export type { LocationOption } from "@/types/location";
