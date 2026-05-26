import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Boxes,
  Building2,
  ClipboardCheck,
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
  Users2,
  Warehouse,
} from "lucide-react";

import {
  AUDIT_LOG_ROLES,
  ADMIN_MANAGER_ROLES,
  INBOUND_RECEIVE_ROLES,
  INVENTORY_READ_ROLES,
  MANAGEMENT_READ_ROLES,
  MANAGEMENT_OPERATION_ROLES,
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
    label: "Tổng quan",
    items: [
      { label: "Tổng quan kho", href: "/dashboard", icon: LayoutGrid, roles: MANAGEMENT_READ_ROLES },
      // { label: "Thông báo", href: "/notifications", icon: Bell, roles: ALL_ROLES },
      { label: "Trợ lý thông minh", href: "/ai-assistant", icon: Sparkles, roles: MANAGEMENT_READ_ROLES },
    ],
  },
  {
    label: "Vận hành kho",
    className: "mt-2",
    items: [
      { label: "Theo dõi tồn kho", href: "/inventory", icon: Boxes, roles: INVENTORY_READ_ROLES },
      { label: "Kho hàng", href: "/warehouses", icon: Warehouse, roles: MANAGEMENT_READ_ROLES },
      { label: "Vị trí lưu trữ", href: "/locations", icon: MapPin, roles: WAREHOUSE_OPERATION_ROLES },
      { label: "Kiểm kê kho", href: "/cycle-counts", icon: ClipboardCheck, roles: WAREHOUSE_OPERATION_ROLES },
    ],
  },
  {
    label: "Nhập kho",
    className: "mt-2",
    items: [
      { label: "Đơn nhập hàng", href: "/purchase-orders", icon: FileStack, roles: INBOUND_RECEIVE_ROLES },
      { label: "Phiếu nhập kho", href: "/inbound", icon: ReceiptText, roles: READ_OPERATION_ROLES },
      { label: "Xếp hàng lên kệ", href: "/putaway", icon: ScanLine, roles: WAREHOUSE_OPERATION_ROLES },
    ],
  },
  {
    label: "Xuất kho",
    className: "mt-2",
    items: [
      { label: "Đơn xuất hàng", href: "/orders", icon: ListOrdered, roles: MANAGEMENT_OPERATION_ROLES },
      { label: "Lấy hàng", href: "/picking", icon: Scissors, roles: WAREHOUSE_OPERATION_ROLES },
      { label: "Hàng trả", href: "/returns", icon: RotateCcw, roles: READ_OPERATION_ROLES },
    ],
  },
  {
    label: "Danh mục",
    className: "mt-2",
    items: [
      {
        label: "Sản phẩm & mã hàng",
        href: "/products",
        icon: Package,
        roles: MANAGEMENT_OPERATION_ROLES,
        children: [
          { label: "Danh sách sản phẩm", href: "/products", icon: PackageSearch, color: "indigo", roles: MANAGEMENT_OPERATION_ROLES },
          { label: "Nhóm hàng", href: "/categories", icon: Tags, color: "violet", roles: ADMIN_MANAGER_ROLES },
        ],
      },
      { label: "Khách hàng", href: "/customers", icon: Users2, roles: ADMIN_MANAGER_ROLES },
      { label: "Nhà cung cấp", href: "/suppliers", icon: Building2, roles: ADMIN_MANAGER_ROLES },
    ],
  },
  {
    label: "Báo cáo & nhật ký",
    className: "mt-2",
    items: [
      { label: "Báo cáo vận hành", href: "/reports", icon: BarChart3, roles: REPORT_ROLES },
      { label: "Nhật ký hoạt động", href: "/history", icon: History, roles: AUDIT_LOG_ROLES },
    ],
  },
  {
    label: "Quản trị hệ thống",
    className: "mt-2",
    items: [
      { label: "Cấu hình hệ thống", href: "/settings", icon: Settings, roles: ["ADMIN"] },
      { label: "Bảo mật & phân quyền", href: "/security", icon: ShieldCheck, roles: ["ADMIN"] },
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
      const label =
        item.href === "/history"
          ? hasAnyRole(userRoles, ["ADMIN"])
            ? "Nhật ký hệ thống"
            : "Nhật ký nghiệp vụ kho"
          : item.label;

      visibleItems.push({ ...item, label, children });
    }

    return visibleItems;
  }, []);
}

export function filterSidebarSections(
  sections: readonly SidebarSectionConfig[],
  userRoles: readonly UserRole[],
): SidebarSectionConfig[] {
  const visibleSections: SidebarSectionConfig[] = [];
  for (const section of sections) {
    const items = filterSidebarItems(section.items, userRoles);
    if (items.length > 0) {
      visibleSections.push({ ...section, items });
    }
  }
  return visibleSections;
}

export function findExpandedHref(
  sections: readonly SidebarSectionConfig[],
  pathname: string,
): string | null {
  for (const section of sections) {
    for (const item of section.items) {
      if (item.children?.length && isActivePath(pathname, item.href)) {
        return item.href;
      }
    }
  }

  return null;
}
