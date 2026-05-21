// Cycle Count status values as returned by backend
export type CycleCountStatus =
  | "PENDING"       // Vừa tạo, chờ bắt đầu
  | "IN_PROGRESS"   // Đang kiểm kê (sau khi bấm Start)
  | "PENDING_REVIEW" // Staff đã gửi kết quả, chờ duyệt
  | "APPROVED"      // Đã duyệt, tồn kho đã được điều chỉnh
  | "RECOUNT_REQUIRED" // Cần kiểm kê lại
  | "CANCELLED"     // Đã huỷ
  // Legacy statuses kept for backward compatibility
  | "COMPLETED"
  | "DRAFT"
  | "OPEN"
  | "COUNTING"
  | "REVIEW";

export type CycleCountScope = "WAREHOUSE" | "ZONE" | "LOCATION" | "PRODUCT";

export type CycleCountLineStatus = "PENDING" | "COUNTED" | "VARIANCE" | "APPROVED" | "ADJUSTED";

export type VarianceSeverity = "NONE" | "LOW" | "MEDIUM" | "HIGH";

export type CycleCountLine = {
  id: string;
  cycleCountId?: string;
  productId?: string | null;
  productSku?: string | null;
  productName?: string | null;
  locationId?: string | null;
  locationCode?: string | null;
  systemQty: number;
  expectedQty?: number | null;   // some backends use expectedQty
  countedQty?: number | null;
  receivedQty?: number | null;   // some backends use receivedQty
  varianceQty?: number | null;
  discrepancy?: number | null;
  varianceSeverity?: VarianceSeverity | null;
  status: CycleCountLineStatus;
  lotNumber?: string | null;
  countedBy?: string | null;
  countedAt?: string | null;
  note?: string | null;
  notes?: string | null;
};

export type CycleCount = {
  id: string;
  countNumber?: string | null;
  title?: string | null;
  description?: string | null;
  status: CycleCountStatus;
  scope?: CycleCountScope | null;
  warehouseId?: string | null;
  warehouseName?: string | null;
  zone?: string | null;
  locationId?: string | null;
  productId?: string | null;
  assignedTo?: string | null;
  createdBy?: string | null;
  approvedBy?: string | null;
  rejectedBy?: string | null;
  scheduledAt?: string | null;
  startedAt?: string | null;
  submittedAt?: string | null;
  completedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  totalLines?: number | null;
  countedLines?: number | null;
  discrepancyLines?: number | null;
  totalAbsDiscrepancy?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  lines?: CycleCountLine[];
};

export type CycleCountItem = {
  productId: string;
  locationId?: string;
  expectedQty?: number;
  lotNumber?: string;
};

export type ScopeBasedCycleCountPayload = {
  warehouseId: string;
  description: string;
  scheduledAt?: string;
  assignedTo: string;
  scope: CycleCountScope;
  scopeValue?: string | null;
  items?: null;
};

export type ManualCycleCountPayload = {
  warehouseId: string;
  description: string;
  scheduledAt?: string;
  assignedTo: string;
  scope?: null;
  scopeValue?: null;
  items: CycleCountItem[];
};

export type CreateCycleCountPayload = ScopeBasedCycleCountPayload | ManualCycleCountPayload;

export type RecordCycleCountResult = {
  itemId: string;
  actualQty: number;
  notes?: string;
};

export type SubmitCycleCountLinePayload = {
  cycleCountId: string;
  lineId: string;
  countedQty: number;
  note?: string;
};
