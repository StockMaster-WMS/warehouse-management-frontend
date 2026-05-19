export const SITE_NAME = "StockMaster WMS";

export const SITE_TITLE =
  "StockMaster WMS - Phần mềm quản lý kho hàng thông minh số 1 Việt Nam";

export const SITE_DESCRIPTION =
  "StockMaster WMS - Giải pháp quản lý kho hàng toàn diện. Tối ưu tồn kho, nhập xuất, picking, putaway, kiểm kê. Thử miễn phí! Hỗ trợ doanh nghiệp quản lý kho thông minh.";

export const SITE_KEYWORDS = [
  "phần mềm quản lý kho",
  "hệ thống quản lý kho hàng",
  "quản lý tồn kho",
  "WMS software",
  "warehouse management system",
  "quản lý nhập xuất kho",
  "kiểm kê kho hàng",
  "picking putaway",
  "StockMaster",
  "phần mềm WMS Việt Nam",
  "quản lý kho hàng Việt Nam",
  "hệ thống WMS online",
  "tối ưu tồn kho",
];

export const PROTECTED_APP_PATHS = [
  "/ai-assistant",
  "/categories",
  "/customers",
  "/cycle-counts",
  "/dashboard",
  "/history",
  "/inbound",
  "/inventory",
  "/locations",
  "/orders",
  "/picking",
  "/products",
  "/profile",
  "/purchase-orders",
  "/putaway",
  "/reports",
  "/returns",
  "/security",
  "/settings",
  "/suppliers",
  "/warehouses",
] as const;

export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!raw) {
    return "http://localhost:3000";
  }

  try {
    return new URL(raw).origin;
  } catch {
    return "http://localhost:3000";
  }
}

export function isProtectedAppPath(pathname: string) {
  return PROTECTED_APP_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
