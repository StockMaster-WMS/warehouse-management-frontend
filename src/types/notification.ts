export type NotificationType =
  | "PICKING_ASSIGNED"
  | "PICKING_EXCEPTION"
  | "LOW_STOCK"
  | "PURCHASE_ORDER_CREATED"
  | "RMA_RECEIVED"
  | "CYCLE_COUNT_CREATED"
  | "STOCK_DISCREPANCY"
  | "ROLE_CHANGED"
  | "SYSTEM_ALERT";

export type NotificationSeverity = "INFO" | "WARNING" | "CRITICAL";

export type NotificationTargetType =
  | "PICKING_ITEM"
  | "SALES_ORDER"
  | "PURCHASE_ORDER"
  | "RMA"
  | "CYCLE_COUNT"
  | "STOCK_LEVEL"
  | "USER"
  | string;

export type AppNotification = {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  targetType: NotificationTargetType | null;
  targetId: string | null;
  read: boolean;
  createdAt: string;
  readAt: string | null;
};

export type NotificationUnreadCount = {
  count: number;
};

export type NotificationReadAllResult = {
  updated: number;
};
