
export type PutawayTaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface PutawayTask {
  id: string;
  poItemId?: string | null;
  purchaseOrderId?: string | null;
  inboundReceiptId?: string | null;
  status: PutawayTaskStatus;
  suggestedLocationId?: string | null;
  actualLocationId?: string | null;
  assigneeId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatchPutawayTaskPayload {
  id: string;
  body: {
    suggestedLocationId?: string | null;
    assigneeId?: string | null;
    status?: PutawayTaskStatus;
  };
}

export interface CompletePutawayPayload {
  id: string;
  purchaseOrderId?: string;
  body: { actualLocationId: string };
}
