import type { SortDirection, WarehouseSortField } from "@/types/warehouse";

export const WAREHOUSES_PAGE_SIZE = 20;

export const STATUS_LABEL_ALL = "Tất cả trạng thái";
export const STATUS_LABEL_ACTIVE = "Đang hoạt động";
export const STATUS_LABEL_INACTIVE = "Ngừng hoạt động";

export const SORT_FIELD_LABELS: Record<string, WarehouseSortField> = {
  "Ngày tạo": "createdAt",
  "Tên kho": "name",
  "Mã kho": "code",
  "Trạng thái": "isActive",
};

export const SORT_FIELD_OPTIONS = Object.keys(SORT_FIELD_LABELS);

export const SORT_DIR_LABELS: Record<string, SortDirection> = {
  "Tăng dần": "asc",
  "Giảm dần": "desc",
};

export const SORT_DIR_OPTIONS = Object.keys(SORT_DIR_LABELS);
