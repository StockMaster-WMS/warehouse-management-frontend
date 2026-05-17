export type ReturnSourceType = "CUSTOMER" | "SUPPLIER" | "INTERNAL";

export type ReturnStatus =
  | "REQUESTED"
  | "APPROVED"
  | "RECEIVED"
  | "INSPECTING"
  | "RESTOCKED"
  | "SCRAPPED"
  | "REJECTED"
  | "CLOSED"
  | "COMPLETED";

export type ReturnReason =
  | "CUSTOMER_RETURN"
  | "DAMAGED"
  | "WRONG_ITEM"
  | "EXPIRED"
  | "QUALITY_CHECK"
  | "SUPPLIER_RETURN";

export type ReturnDisposition =
  | "RESTOCK"
  | "REPAIR"
  | "SCRAP"
  | "QUARANTINE"
  | "RETURN_TO_SUPPLIER";

export type ReturnLine = {
  id: string;
  productId: string;
  productSku?: string | null;
  productName?: string | null;
  expectedQty: number;
  receivedQty: number;
  receivedLocationId?: string | null;
  acceptedQty?: number;
  rejectedQty?: number;
  reason?: ReturnReason;
  disposition?: ReturnDisposition | null;
  note?: string | null;
  lotNumber?: string | null;
  condition?: string | null;
};

export type ReturnRequest = {
  id: string;
  rmaNumber: string;
  sourceType: ReturnSourceType;
  status: ReturnStatus;
  reason: ReturnReason;
  disposition?: ReturnDisposition | null;
  orderId?: string | null;
  orderNumber?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  warehouseId?: string | null;
  warehouseName?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  note?: string | null;
  lines?: ReturnLine[];
};

export type CreateReturnLinePayload = {
  productId: string;
  expectedQty: number;
  reason: ReturnReason;
  note?: string;
};

export type CreateReturnRequestPayload = {
  sourceType: ReturnSourceType;
  orderId?: string;
  customerId?: string;
  supplierId?: string;
  warehouseId: string;
  reason: ReturnReason;
  note?: string;
  lines: CreateReturnLinePayload[];
};

export type ReceiveReturnPayload = {
  itemId: string;
  receivedQty: number;
  locationId?: string;
  condition?: string;
  notes?: string;
};

export type InspectReturnLinePayload = {
  returnId: string;
  lineId: string;
  acceptedQty: number;
  rejectedQty: number;
  disposition: ReturnDisposition;
  note?: string;
};
