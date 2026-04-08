export const INVENTORY_PAGE_SIZE = 20;
export const NEAR_EXPIRY_DAYS_DEFAULT = 30;

export const ALL_WAREHOUSES_VALUE = "";
export const ALL_LOCATIONS_VALUE = "";

export const MOVEMENT_TYPE_OPTIONS = [
  { value: "", label: "Tất cả loại" },
  { value: "INBOUND", label: "Nhập kho" },
  { value: "OUTBOUND", label: "Xuất kho" },
  { value: "RESERVE", label: "Giữ chỗ" },
  { value: "RELEASE", label: "Nhả chỗ" },
] as const;

export type AdjustFormState = {
  warehouseId: string;
  locationId: string;
  productId: string;
  lotNumber: string;
  delta: string;
};

export const DEFAULT_ADJUST_FORM: AdjustFormState = {
  warehouseId: "",
  locationId: "",
  productId: "",
  lotNumber: "",
  delta: "",
};
