export interface SoItem {
  id: string;
  salesOrderId: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  orderedQty: number;
  unitPrice?: number | null;
  shippedQty?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type CreateSoItemPayload = {
  salesOrderId: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  orderedQty: number;
  unitPrice?: number;
};

