export type AuditActionType =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "APPROVE"
  | "CANCEL"
  | "STOCK_ADJUST"
  | "STOCK_RESERVE"
  | "PICK"
  | "PUTAWAY"
  | "START_PICKING"
  | "PACK"
  | "SHIP"
  | "HOLD"
  | "RESUME"
  | string;

export interface AuditLog {
  id: string;
  serviceName: string;
  module: string;
  actionType: AuditActionType;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityName?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  reason?: string | null;
  beforeSnapshot?: string | null;
  afterSnapshot?: string | null;
  metadata?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

