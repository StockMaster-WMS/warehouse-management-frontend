export const ORDERS_PAGE_SIZE = 20;

export const ORDER_STATUS_FILTER_OPTIONS = [
  "Tất cả trạng thái",
  "Chờ xử lý",
  "Đang lấy hàng",
  "Đã lấy đủ",
  "Đã đóng gói",
  "Đã xuất kho",
] as const;

export const ORDER_STATUS_LABEL_TO_API: Record<string, string> = {
  "Chờ xử lý": "PENDING",
  "Đang lấy hàng": "PICKING",
  "Đã lấy đủ": "PICKED",
  "Đã đóng gói": "PACKED",
  "Đã xuất kho": "SHIPPED",
};
