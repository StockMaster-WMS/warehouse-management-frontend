export type ReturnType = "CUSTOMER" | "SUPPLIER";
export type ReturnSourceType = ReturnType | "INTERNAL";

export type ReturnStatus =
  | "REQUESTED"
  | "RECEIVED"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED"
  | "CANCELLED"
  // Legacy values kept so older responses do not break the UI.
  | "INSPECTING"
  | "RESTOCKED"
  | "SCRAPPED"
  | "CLOSED";

export type ReturnReason =
  | "CUSTOMER_RETURN"
  | "DAMAGED"
  | "WRONG_ITEM"
  | "EXPIRED"
  | "QUALITY_CHECK"
  | "SUPPLIER_RETURN"
  | string;

export type ReturnCondition = "GOOD" | "DAMAGED" | "DEFECTIVE" | string;

export type ReturnDispositionAction =
  | "RESTOCK"
  | "KEEP_QUARANTINE"
  | "SCRAP"
  | "RETURN_TO_SUPPLIER"
  | string;

export type ReturnDisposition =
  | "RESTOCK"
  | "REPAIR"
  | "SCRAP"
  | "QUARANTINE"
  | "RETURN_TO_SUPPLIER";

export type ReturnLine = {
  id: string;
  productId: string;
  salesOrderItemId?: string | null;
  productSku?: string | null;
  productName?: string | null;
  expectedQty: number;
  receivedQty: number;
  remainingQty?: number | null;
  receivedLocationId?: string | null;
  receivedLocationCode?: string | null;
  returnLocationId?: string | null;
  returnLocationCode?: string | null;
  acceptedQty?: number;
  rejectedQty?: number;
  reason?: ReturnReason;
  disposition?: ReturnDisposition | null;
  note?: string | null;
  notes?: string | null;
  lotNumber?: string | null;
  condition?: ReturnCondition | null;
  dispositionAction?: ReturnDispositionAction | null;
  dispositionLocationId?: string | null;
  dispositionLocationCode?: string | null;
  dispositionAt?: string | null;
  dispositionBy?: string | null;
  dispositionNote?: string | null;
  supplierReturnRmaId?: string | null;
};

export type ReturnRequest = {
  id: string;
  rmaNumber: string;
  returnType: ReturnType;
  sourceType: ReturnSourceType;
  status: ReturnStatus;
  reason: ReturnReason;
  disposition?: ReturnDisposition | null;
  salesOrderId?: string | null;
  orderId?: string | null;
  orderNumber?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  warehouseId?: string | null;
  warehouseName?: string | null;
  createdBy?: string | null;
  receivedBy?: string | null;
  completedBy?: string | null;
  approvedBy?: string | null;
  rejectedBy?: string | null;
  cancelledBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  receivedAt?: string | null;
  completedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  cancelledAt?: string | null;
  rejectionReason?: string | null;
  cancelReason?: string | null;
  note?: string | null;
  totalExpectedQty?: number | null;
  totalReceivedQty?: number | null;
  totalRemainingQty?: number | null;
  lines?: ReturnLine[];
};

export type CreateReturnLinePayload = {
  productId: string;
  salesOrderItemId?: string | null;
  expectedQty: number;
  lotNumber?: string;
  locationId?: string;
  maxReturnQty?: number;
  shippedQty?: number;
  alreadyReturnedQty?: number;
  returnableQty?: number;
  reason?: ReturnReason;
  note?: string;
};

export type CreateReturnRequestPayload = {
  returnType: ReturnType;
  sourceType?: ReturnSourceType;
  salesOrderId?: string | null;
  orderId?: string | null;
  customerId?: string | null;
  customerName?: string;
  supplierId?: string;
  supplierName?: string;
  warehouseId: string;
  reason: string;
  note?: string;
  lines: CreateReturnLinePayload[];
};

export type ReceiveReturnPayload = {
  itemId: string;
  receivedQty: number;
  locationId: string;
  condition?: ReturnCondition;
  notes?: string;
};

export type DispositionReturnPayload = {
  action: ReturnDispositionAction;
  targetLocationId?: string | null;
  supplierId?: string | null;
  note?: string | null;
};

export type InspectReturnLinePayload = {
  returnId: string;
  lineId: string;
  acceptedQty: number;
  rejectedQty: number;
  disposition: ReturnDisposition;
  note?: string;
};

export type ReturnReportBucket = {
  key: string;
  label: string;
  documents: number;
  quantity: number;
};

export type ReturnReport = {
  totalReturns: number;
  customerReturns: number;
  supplierReturns: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  completed: number;
  totalExpectedQty: number;
  totalReceivedQty: number;
  totalSupplierReturnedQty: number;
  topSuppliers: ReturnReportBucket[];
  topReasons: ReturnReportBucket[];
};

export type SupplierReturnProduct = {
  productId: string;
  sku: string;
  name: string;
  supplierId: string;
  supplierName: string;
  totalQtyAvailable: number;
  locationCount: number;
};

export type SupplierReturnLocation = {
  stockLevelId: string;
  locationId: string;
  locationCode: string;
  zone?: string | null;
  productId: string;
  lotNumber?: string | null;
  expiryDate?: string | null;
  qtyOnHand: number;
  qtyReserved: number;
  qtyAvailable: number;
  maxReturnQty: number;
};
