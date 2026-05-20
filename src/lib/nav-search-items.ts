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
    id: "notifications",
    label: "Thông báo",
    href: "/notifications",
    group: "Tổng quan",
  },
  {
    id: "dashboard",
    label: "Tổng quan kho",
    href: "/dashboard",
    group: "Tổng quan",
  },
  {
    id: "ai-assistant",
    label: "Trợ lý thông minh",
    href: "/ai-assistant",
    group: "Tổng quan",
  },
  {
    id: "inventory",
    label: "Theo dõi tồn kho",
    href: "/inventory",
    group: "Kho & tồn kho",
  },
  {
    id: "warehouses",
    label: "Kho hàng",
    href: "/warehouses",
    group: "Kho & tồn kho",
  },
  {
    id: "locations",
    label: "Vị trí lưu trữ",
    href: "/locations",
    group: "Kho & tồn kho",
  },
  {
    id: "cycle-counts",
    label: "Kiểm kê kho",
    href: "/cycle-counts",
    group: "Kho & tồn kho",
  },
  {
    id: "products",
    label: "Danh sách sản phẩm",
    href: "/products",
    group: "Danh mục",
  },
  {
    id: "products-new",
    label: "Tạo sản phẩm mới",
    href: "/products/new",
    group: "Danh mục",
  },
  {
    id: "categories",
    label: "Nhóm hàng",
    href: "/categories",
    group: "Danh mục",
  },
  {
    id: "customers",
    label: "Khách hàng",
    href: "/customers",
    group: "Danh mục",
  },
  {
    id: "customers-new",
    label: "Thêm khách hàng",
    href: "/customers/new",
    group: "Danh mục",
  },
  {
    id: "suppliers",
    label: "Nhà cung cấp",
    href: "/suppliers",
    group: "Danh mục",
  },
  {
    id: "suppliers-new",
    label: "Thêm nhà cung cấp",
    href: "/suppliers/new",
    group: "Danh mục",
  },
  {
    id: "purchase-orders",
    label: "Đơn nhập hàng",
    href: "/purchase-orders",
    group: "Nhập kho",
  },
  {
    id: "purchase-orders-new",
    label: "Tạo đơn nhập",
    href: "/purchase-orders/new",
    group: "Nhập kho",
  },
  {
    id: "inbound",
    label: "Phiếu nhập kho",
    href: "/inbound",
    group: "Nhập kho",
  },
  {
    id: "inbound-new",
    label: "Tạo phiếu nhập",
    href: "/inbound/new",
    group: "Nhập kho",
  },
  {
    id: "putaway",
    label: "Xếp hàng lên kệ",
    href: "/putaway",
    group: "Nhập kho",
  },
  {
    id: "orders",
    label: "Đơn xuất",
    href: "/orders",
    group: "Xuất kho",
  },
  {
    id: "picking",
    label: "Lấy hàng",
    href: "/picking",
    group: "Xuất kho",
  },
  {
    id: "returns",
    label: "Hàng trả",
    href: "/returns",
    group: "Xuất kho",
  },
  {
    id: "history",
    label: "Nhật ký hoạt động",
    href: "/history",
    group: "Báo cáo & nhật ký",
  },
  {
    id: "reports",
    label: "Báo cáo vận hành",
    href: "/reports",
    group: "Báo cáo & nhật ký",
  },
  {
    id: "settings",
    label: "Cấu hình hệ thống",
    href: "/settings",
    group: "Quản trị hệ thống",
  },
  {
    id: "security",
    label: "Bảo mật & phân quyền",
    href: "/security",
    group: "Quản trị hệ thống",
  },
];
