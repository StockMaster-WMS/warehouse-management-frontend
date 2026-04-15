export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

export const STATUS_TONE: Record<string, StatusTone> = {
  ACTIVE: "success",
  INACTIVE: "neutral",
  active: "success",
  inactive: "neutral",
  suspended: "warning",
  DRAFT: "neutral",
  PENDING: "info",
  APPROVED: "success",
  PARTIAL: "warning",
  COMPLETED: "success",
  PICKING: "warning",
  PICKED: "success",
  PACKED: "success",
  SHIPPED: "info",
  CANCELLED: "danger",
  ON_HOLD: "danger",
  CREATE: "success",
  UPDATE: "info",
  DELETE: "danger",
  APPROVE: "success",
  ADJUST: "warning",
  PICK: "warning",
  PUTAWAY: "success",
};

export function statusTone(status: string | null | undefined): StatusTone {
  if (!status) return "neutral";
  return STATUS_TONE[status] ?? STATUS_TONE[status.toUpperCase()] ?? "neutral";
}

export const uiText = {
  loading: "Đang tải dữ liệu...",
  updating: "Đang cập nhật dữ liệu...",
  retry: "Thử lại",
  clearFilters: "Xóa bộ lọc",
  noData: "Chưa có dữ liệu",
  loadError: "Không thể tải dữ liệu",
} as const;
