export type CycleCountStatus =
  | "DRAFT"
  | "OPEN"
  | "COUNTING"
  | "REVIEW"
  | "APPROVED"
  | "CANCELLED"
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED";

export type CycleCountScope = "WAREHOUSE" | "ZONE" | "LOCATION" | "PRODUCT";

export type CycleCountLineStatus = "PENDING" | "COUNTED" | "VARIANCE" | "APPROVED" | "ADJUSTED";

export type CycleCountLine = {
  id: string;
  cycleCountId?: string;
  productId?: string | null;
  productSku?: string | null;
  productName?: string | null;
  locationId?: string | null;
  locationCode?: string | null;
  lotNumber?: string | null;
  systemQty: number;
  countedQty?: number | null;
  varianceQty?: number | null;
  status: CycleCountLineStatus;
  countedBy?: string | null;
  countedAt?: string | null;
  note?: string | null;
};

export type CycleCount = {
  id: string;
  countNumber: string;
  title?: string | null;
  status: CycleCountStatus;
  scope: CycleCountScope;
  warehouseId?: string | null;
  warehouseName?: string | null;
  zone?: string | null;
  locationId?: string | null;
  productId?: string | null;
  assignedTo?: string | null;
  createdBy?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  lines?: CycleCountLine[];
};

export type CreateCycleCountPayload = {
  title?: string;
  description?: string;
  scope: CycleCountScope;
  warehouseId: string;
  zone?: string;
  locationId?: string;
  productId?: string;
  assignedTo?: string;
  scheduledAt?: string;
  items?: Array<{
    productId: string;
    locationId: string;
    lotNumber?: string | null;
  }>;
};

export type SubmitCycleCountLinePayload = {
  cycleCountId: string;
  lineId: string;
  countedQty: number;
  note?: string;
};
