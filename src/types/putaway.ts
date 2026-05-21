
export type PutawayTaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface PutawayTask {
  id: string;
  code?: string | null;
  taskNumber?: string | null;
  poItemId?: string | null;
  poItem?: {
    id?: string | null;
    productSku?: string | null;
    productName?: string | null;
    sku?: string | null;
    product?: {
      sku?: string | null;
      code?: string | null;
      name?: string | null;
      productSku?: string | null;
      productName?: string | null;
    } | null;
    receivedQty?: number | null;
    orderedQty?: number | null;
  } | null;
  purchaseOrderId?: string | null;
  purchaseOrderNumber?: string | null;
  poNumber?: string | null;
  inboundReceiptId?: string | null;
  inboundReceiptNumber?: string | null;
  receiptNumber?: string | null;
  warehouseId?: string | null;
  warehouseName?: string | null;
  productSku?: string | null;
  productName?: string | null;
  sku?: string | null;
  productCode?: string | null;
  quantity?: number | null;
  qty?: number | null;
  putawayQty?: number | null;
  receivedQty?: number | null;
  status: PutawayTaskStatus;
  suggestedLocationId?: string | null;
  actualLocationId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatchPutawayTaskPayload {
  id: string;
  body: {
    suggestedLocationId?: string | null;
    status?: PutawayTaskStatus;
  };
}

export interface CompletePutawayPayload {
  id: string;
  purchaseOrderId?: string;
  body: { actualLocationId: string };
}
