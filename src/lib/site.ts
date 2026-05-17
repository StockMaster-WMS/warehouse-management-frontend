export const SITE_NAME = "StockMaster WMS";

export const SITE_TITLE =
  "StockMaster WMS - Phần mềm quản lý kho cho doanh nghiệp";

export const SITE_DESCRIPTION =
  "StockMaster WMS hỗ trợ doanh nghiệp quản lý tồn kho, nhập xuất hàng, picking, putaway, kiểm kê và báo cáo kho trên một nền tảng web tập trung.";

export const SITE_KEYWORDS = [
  "phần mềm quản lý kho",
  "hệ thống quản lý kho",
  "quản lý tồn kho",
  "WMS",
  "warehouse management system",
  "quản lý nhập xuất kho",
  "kiểm kê kho",
  "picking putaway",
  "StockMaster",
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
