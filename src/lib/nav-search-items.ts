export type NavSearchItem = {
  id: string;
  label: string;
  href: string;
  /** Nhóm hiển thị trong dialog (theo sidebar) */
  group: string;
};

/** Các trang có thể tìm và điều hướng nhanh — đồng bộ với menu sidebar. */
export const NAV_SEARCH_ITEMS: NavSearchItem[] = [
  {
    id: "dashboard",
    label: "Tổng quan kho",
    href: "/dashboard",
    group: "Tổng quan & tác nghiệp",
  },
  {
    id: "inventory",
    label: "Theo dõi tồn kho",
    href: "/inventory",
    group: "Tổng quan & tác nghiệp",
  },
  {
    id: "warehouses",
    label: "Danh sách kho",
    href: "/warehouses",
    group: "Tổng quan & tác nghiệp",
  },
  {
    id: "products",
    label: "Tất cả sản phẩm",
    href: "/products",
    group: "Sản phẩm",
  },
  {
    id: "products-new",
    label: "Tạo sản phẩm mới",
    href: "/products/new",
    group: "Sản phẩm",
  },
  {
    id: "categories",
    label: "Nhóm / loại hàng",
    href: "/categories",
    group: "Sản phẩm",
  },
  {
    id: "orders",
    label: "Đơn hàng & giao nhận",
    href: "/orders",
    group: "Tổng quan & tác nghiệp",
  },
  {
    id: "inbound",
    label: "Danh sách phiếu nhập",
    href: "/inbound",
    group: "Nhập hàng",
  },
  {
    id: "inbound-new",
    label: "Tạo phiếu nhập",
    href: "/inbound/new",
    group: "Nhập hàng",
  },
  {
    id: "purchase-orders",
    label: "Đơn nhập hàng (PO)",
    href: "/purchase-orders",
    group: "Nhập hàng",
  },
  {
    id: "purchase-orders-new",
    label: "Tạo đơn nhập",
    href: "/purchase-orders/new",
    group: "Nhập hàng",
  },
  {
    id: "putaway",
    label: "Putaway",
    href: "/putaway",
    group: "Nhập hàng",
  },
  {
    id: "customers",
    label: "Khách hàng",
    href: "/customers",
    group: "Đối tác & nhật ký",
  },
  {
    id: "customers-new",
    label: "Thêm khách hàng",
    href: "/customers/new",
    group: "Đối tác & nhật ký",
  },
  {
    id: "suppliers",
    label: "Nhà cung cấp",
    href: "/suppliers",
    group: "Đối tác & nhật ký",
  },
  {
    id: "suppliers-new",
    label: "Thêm nhà cung cấp",
    href: "/suppliers/new",
    group: "Đối tác & nhật ký",
  },
  {
    id: "history",
    label: "Nhật ký hoạt động",
    href: "/history",
    group: "Đối tác & nhật ký",
  },
  {
    id: "reports",
    label: "Báo cáo",
    href: "/reports",
    group: "Báo cáo & phân tích",
  },
  {
    id: "settings",
    label: "Cài đặt hệ thống",
    href: "/settings",
    group: "Hệ thống",
  },
  {
    id: "security",
    label: "Bảo mật & Phân quyền",
    href: "/security",
    group: "Hệ thống",
  },
];
