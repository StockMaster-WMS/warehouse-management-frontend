import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Bell,
  ClipboardCheck,
  ClipboardList,
  Info,
  PackageMinus,
  PackagePlus,
  RefreshCcw,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import type {
  AppNotification,
  NotificationSeverity,
  NotificationType,
} from "@/types/notification";

export const NOTIFICATION_SEVERITY_STYLE: Record<
  NotificationSeverity,
  { dot: string; iconWrap: string; label: string }
> = {
  INFO: {
    dot: "bg-blue-500",
    iconWrap: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    label: "Thông tin",
  },
  WARNING: {
    dot: "bg-amber-500",
    iconWrap:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    label: "Cảnh báo",
  },
  CRITICAL: {
    dot: "bg-rose-500",
    iconWrap: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    label: "Khẩn cấp",
  },
};

export const NOTIFICATION_SEVERITY_ICON: Record<NotificationSeverity, LucideIcon> = {
  INFO: Bell,
  WARNING: AlertTriangle,
  CRITICAL: AlertCircle,
};

export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  LOW_STOCK: "Tồn kho thấp",
  PURCHASE_ORDER_CREATED: "Đơn nhập",
  RMA_RECEIVED: "Hàng trả/RMA",
  PICKING_ASSIGNED: "Picking",
  PICKING_EXCEPTION: "Lỗi picking",
  CYCLE_COUNT_CREATED: "Kiểm kê",
  STOCK_DISCREPANCY: "Lệch tồn kho",
  ROLE_CHANGED: "Phân quyền",
  SYSTEM_ALERT: "Hệ thống",
};

export const NOTIFICATION_TYPE_ICON: Record<NotificationType, LucideIcon> = {
  LOW_STOCK: PackageMinus,
  PURCHASE_ORDER_CREATED: PackagePlus,
  RMA_RECEIVED: RefreshCcw,
  PICKING_ASSIGNED: ClipboardList,
  PICKING_EXCEPTION: AlertTriangle,
  CYCLE_COUNT_CREATED: ClipboardCheck,
  STOCK_DISCREPANCY: AlertOctagon,
  ROLE_CHANGED: UserCog,
  SYSTEM_ALERT: Info,
};

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

export function formatNotificationTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

export function formatNotificationRelativeTime(value: string) {
  const createdAt = new Date(value).getTime();
  if (Number.isNaN(createdAt)) return value;

  const diffSeconds = Math.max(0, Math.floor((Date.now() - createdAt) / 1000));
  if (diffSeconds < 60) return "vừa xong";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return formatNotificationTime(value);
}

export function getNotificationHref(
  notification: AppNotification,
  options?: { canNavigateUser?: boolean },
) {
  if (!notification.targetId) return null;

  const targetId = encodeURIComponent(notification.targetId);
  switch (notification.targetType) {
    case "PICKING_ITEM":
      return `/picking?itemId=${targetId}`;
    case "SALES_ORDER":
      return `/orders/${targetId}`;
    case "PURCHASE_ORDER":
      return `/purchase-orders/${targetId}`;
    case "RMA":
      return `/returns/${targetId}`;
    case "CYCLE_COUNT":
      return `/cycle-counts/${targetId}`;
    case "STOCK_LEVEL":
      return `/inventory?stockId=${targetId}`;
    case "USER":
      return options?.canNavigateUser ? `/security?userId=${targetId}` : null;
    default:
      return null;
  }
}
