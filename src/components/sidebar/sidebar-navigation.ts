import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Boxes,
  Building2,
  ClipboardCheck,
  ClipboardList,
  FileStack,
  History,
  LayoutGrid,
  ListOrdered,
  MapPin,
  Package,
  PackageSearch,
  ReceiptText,
  RotateCcw,
  ScanLine,
  Scissors,
  Settings,
  ShieldCheck,
  Sparkles,
  Tags,
  Truck,
  Users2,
  Warehouse,
} from "lucide-react";

import {
  ADMIN_MANAGER_ROLES,
  ALL_ROLES,
  READ_OPERATION_ROLES,
  REPORT_ROLES,
  WAREHOUSE_OPERATION_ROLES,
  hasAnyRole,
} from "@/lib/access-control";
import type { UserRole } from "@/store/services/auth.service";

export const CHILD_ICON_COLOR_CLASSES = {
  indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
  rose: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400",
  orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400",
} as const;

type ChildIconColor = keyof typeof CHILD_ICON_COLOR_CLASSES;

export type SidebarChildItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  color?: ChildIconColor;
  roles: readonly UserRole[];
};

export type SidebarNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: readonly UserRole[];
  tag?: string;
  children?: readonly SidebarChildItem[];
};

export type SidebarSectionConfig = {
  label: string;
  className?: string;
  items: readonly SidebarNavItem[];
};

export const SIDEBAR_SECTIONS: readonly SidebarSectionConfig[] = [
  {
    label: "Trí tuệ nhân tạo",
    items: [
      { label: "Trợ lý AI", href: "/ai-assistant", icon: Sparkles, tag: "AI", roles: READ_OPERATION_ROLES },
    ],
  },
  {
    label: "Tổng quan & tác nghiệp",
    items: [
      { label: "Tổng quan kho", href: "/dashboard", icon: LayoutGrid, roles: ALL_ROLES },
      { label: "Theo dõi tồn kho", href: "/inventory", icon: Boxes, roles: READ_OPERATION_ROLES },
      { label: "Danh sách kho", href: "/warehouses", icon: Warehouse, roles: WAREHOUSE_OPERATION_ROLES },
      {
        label: "Sản phẩm",
        href: "/products",
        icon: Package,
        roles: READ_OPERATION_ROLES,
        children: [
          { label: "Tất cả sản phẩm", href: "/products", icon: PackageSearch, color: "indigo", roles: READ_OPERATION_ROLES },
          { label: "Nhóm / loại hàng", href: "/categories", icon: Tags, color: "violet", roles: READ_OPERATION_ROLES },
        ],
      },
      {
        label: "Nhập hàng",
        href: "/inbound",
        icon: ClipboardList,
        roles: READ_OPERATION_ROLES,
        tag: "Mới",
        children: [
          { label: "Đơn nhập hàng", href: "/purchase-orders", icon: FileStack, color: "blue", roles: READ_OPERATION_ROLES },
          { label: "Phiếu nhập kho", href: "/inbound", icon: ReceiptText, color: "emerald", roles: READ_OPERATION_ROLES },
          { label: "Sắp xếp vào kho", href: "/putaway", icon: ScanLine, color: "amber", roles: WAREHOUSE_OPERATION_ROLES },
        ],
      },
      {
        label: "Kho xuất",
        href: "/orders",
        icon: Truck,
        roles: READ_OPERATION_ROLES,
        children: [
          { label: "Đơn xuất", href: "/orders", icon: ListOrdered, color: "rose", roles: READ_OPERATION_ROLES },
          { label: "Lấy hàng", href: "/picking", icon: Scissors, color: "orange", roles: WAREHOUSE_OPERATION_ROLES },
          { label: "Hàng trả / RMA", href: "/returns", icon: RotateCcw, color: "amber", roles: READ_OPERATION_ROLES },
        ],
      },
    ],
  },
  {
    label: "Đối tác & nhật ký",
    className: "mt-2",
    items: [
      { label: "Khách hàng", href: "/customers", icon: Users2, roles: WAREHOUSE_OPERATION_ROLES },
      { label: "Nhà cung cấp", href: "/suppliers", icon: Building2, roles: WAREHOUSE_OPERATION_ROLES },
      { label: "Vị trí lưu trữ", href: "/locations", icon: MapPin, roles: WAREHOUSE_OPERATION_ROLES },
      { label: "Kiểm kê kho", href: "/cycle-counts", icon: ClipboardCheck, roles: WAREHOUSE_OPERATION_ROLES },
      { label: "Nhật ký hoạt động", href: "/history", icon: History, roles: READ_OPERATION_ROLES },
    ],
  },
  {
    label: "Báo cáo & phân tích",
    className: "mt-2",
    items: [
      { label: "Báo cáo", href: "/reports", icon: BarChart3, tag: "BI", roles: REPORT_ROLES },
    ],
  },
  {
    label: "Hệ thống",
    className: "mt-2",
    items: [
      { label: "Cài đặt hệ thống", href: "/settings", icon: Settings, roles: ADMIN_MANAGER_ROLES },
      { label: "Bảo mật & Phân quyền", href: "/security", icon: ShieldCheck, roles: ["ADMIN"] },
    ],
  },
];

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function stableHrefToId(href: string) {
  return `sidebar-link-${href.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function filterSidebarItems(
  items: readonly SidebarNavItem[],
  userRoles: readonly UserRole[],
): SidebarNavItem[] {
  return items.reduce<SidebarNavItem[]>((visibleItems, item) => {
    const children = item.children?.filter((child) =>
      hasAnyRole(userRoles, child.roles),
    );
    const canSeeItem = hasAnyRole(userRoles, item.roles);

    if (canSeeItem || children?.length) {
      visibleItems.push({ ...item, children });
    }

    return visibleItems;
  }, []);
}

export function filterSidebarSections(
  sections: readonly SidebarSectionConfig[],
  userRoles: readonly UserRole[],
): SidebarSectionConfig[] {
  return sections
    .map((section) => ({
      ...section,
      items: filterSidebarItems(section.items, userRoles),
    }))
    .filter((section) => section.items.length > 0);
}

export function findExpandedHref(
  sections: readonly SidebarSectionConfig[],
  pathname: string,
): string | null {
  for (const section of sections) {
    const activeParent = section.items.find(
      (item) => item.children?.length && isActivePath(pathname, item.href),
    );

    if (activeParent) {
      return activeParent.href;
    }
  }

  return null;
}
