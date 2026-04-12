"use client";

import { memo, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  LayoutGrid,
  Package,
  Settings,
  Truck,
  Users2,
  Warehouse,
  History,
  ShieldCheck,
  CircleHelp,
  ChevronLeft,
  ChevronRight,
  Building2,
  MapPin,
  PackageSearch,
  Tags,
  FileStack,
  ReceiptText,
  ScanLine,
  ListOrdered,
  Scissors,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  ADMIN_MANAGER_ROLES,
  ALL_ROLES,
  READ_OPERATION_ROLES,
  REPORT_ROLES,
  WAREHOUSE_OPERATION_ROLES,
  getRoleLabel,
  getUserRoles,
  hasAnyRole,
} from "@/lib/access-control";
import { useGetCurrentUserQuery } from "@/store/services/auth.service";
import type { UserRole } from "@/store/services/auth.service";

type MenuItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: readonly UserRole[];
  tag?: string;
  children?: Array<{
    label: string;
    href: string;
    icon: LucideIcon;
    color?: string;
    roles: readonly UserRole[];
  }>;
};

const mainItems: MenuItem[] = [
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
    ],
  },
];

const secondaryItems: MenuItem[] = [
  { label: "Khách hàng", href: "/customers", icon: Users2, roles: WAREHOUSE_OPERATION_ROLES },
  { label: "Nhà cung cấp", href: "/suppliers", icon: Building2, roles: WAREHOUSE_OPERATION_ROLES },
  { label: "Vị trí lưu trữ", href: "/locations", icon: MapPin, roles: WAREHOUSE_OPERATION_ROLES },
  { label: "Nhật ký hoạt động", href: "/history", icon: History, roles: READ_OPERATION_ROLES },
];

const reportItems: MenuItem[] = [
  { label: "Báo cáo", href: "/reports", icon: BarChart3, tag: "BI", roles: REPORT_ROLES },
];

const systemItems: MenuItem[] = [
  { label: "Cài đặt hệ thống", href: "/settings", icon: Settings, roles: ADMIN_MANAGER_ROLES },
  { label: "Bảo mật & Phân quyền", href: "/security", icon: ShieldCheck, roles: ["ADMIN"] },
];

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function stableHrefToId(href: string) {
  return `sidebar-link-${href.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function filterMenuItems(
  items: MenuItem[],
  userRoles: readonly UserRole[],
): MenuItem[] {
  const visibleItems: MenuItem[] = [];

  for (const item of items) {
    const children = item.children?.filter((child) =>
      hasAnyRole(userRoles, child.roles),
    );
    const canSeeItem = hasAnyRole(userRoles, item.roles);

    if (!canSeeItem && (!children || children.length === 0)) {
      continue;
    }

    visibleItems.push({ ...item, children });
  }

  return visibleItems;
}

export function AppSidebar() {
  const pathname = usePathname();
  const { data: user } = useGetCurrentUserQuery();
  const userRoles = getUserRoles(user?.roles);
  const visibleMainItems = filterMenuItems(mainItems, userRoles);
  const visibleSecondaryItems = filterMenuItems(secondaryItems, userRoles);
  const visibleReportItems = filterMenuItems(reportItems, userRoles);
  const visibleSystemItems = filterMenuItems(systemItems, userRoles);

  const allItems = [
    ...visibleMainItems,
    ...visibleSecondaryItems,
    ...visibleReportItems,
    ...visibleSystemItems,
  ];
  const [expandedHref, setExpandedHref] = useState<string | null>(
    () =>
      allItems.find(
        (item) => item.children && isActivePath(pathname, item.href),
      )?.href ?? null,
  );

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-slate-200/90 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950"
    >
      <SidebarHeader className="flex h-16 items-center border-b border-transparent px-6 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <Link
          href="/"
          className="flex items-center gap-3 transition-all hover:opacity-80"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-200 dark:shadow-none">
            <Warehouse className="h-5.5 w-5.5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              StockMaster
            </span>
            <span className="text-[10px] font-medium text-slate-500">
              WMS Platinum
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <div className="mx-4 mb-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 group-data-[collapsible=icon]:hidden dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Kho trung tâm
          </p>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          Cập nhật đồng bộ theo thời gian thực
        </p>
      </div>

      <SidebarContent className="no-scrollbar gap-0 py-4">
        {visibleMainItems.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 group-data-[collapsible=icon]:hidden">
              Tổng quan & tác nghiệp
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleMainItems.map((item) => (
                  <SidebarItem
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    expandedHref={expandedHref}
                    setExpandedHref={setExpandedHref}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {visibleSecondaryItems.length > 0 ? (
          <SidebarGroup className="mt-2">
            <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 group-data-[collapsible=icon]:hidden">
              Đối tác & nhật ký
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleSecondaryItems.map((item) => (
                  <SidebarItem
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    expandedHref={expandedHref}
                    setExpandedHref={setExpandedHref}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {visibleReportItems.length > 0 ? (
          <SidebarGroup className="mt-2">
            <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 group-data-[collapsible=icon]:hidden">
              Báo cáo & phân tích
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleReportItems.map((item) => (
                  <SidebarItem
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    expandedHref={expandedHref}
                    setExpandedHref={setExpandedHref}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {visibleSystemItems.length > 0 ? (
          <SidebarGroup className="mt-2">
            <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 group-data-[collapsible=icon]:hidden">
              Hệ thống
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleSystemItems.map((item) => (
                  <SidebarItem
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    expandedHref={expandedHref}
                    setExpandedHref={setExpandedHref}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-100 p-4 dark:border-slate-800">
        <div className="flex flex-col gap-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 group-data-[collapsible=icon]:hidden dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              {user?.username || user?.name || "Người dùng"}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {getRoleLabel(user?.roles)}
            </p>
          </div>

          <SidebarMenuButton
            tooltip="Trợ giúp"
            className="text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-900"
          >
            <CircleHelp className="h-4 w-4" />
            <span className="group-data-[collapsible=icon]:hidden">
              Trợ giúp & hỗ trợ
            </span>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>

      <SidebarRail className="absolute top-1/2 z-50 flex h-14 w-5 -translate-y-1/2 cursor-pointer items-center justify-center border border-slate-200 bg-white shadow-sm transition-all duration-300 after:hidden hover:bg-slate-50 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 ltr:translate-x-0 rtl:translate-x-0 group-data-[side=left]:left-full group-data-[side=right]:right-full group-data-[side=left]:[clip-path:polygon(0_0,100%_18%,100%_82%,0_100%)] group-data-[side=right]:[clip-path:polygon(0_18%,100%_0,100%_100%,0_82%)]">
        <ChevronLeft className="h-4 w-4 text-slate-500 transition-transform duration-500 group-data-[state=collapsed]:rotate-180 group-hover:text-indigo-600 dark:text-slate-400 dark:group-hover:text-indigo-400" />
      </SidebarRail>
    </Sidebar>
  );
}

const SidebarItem = memo(function SidebarItem({
  item,
  pathname,
  expandedHref,
  setExpandedHref,
}: {
  item: MenuItem;
  pathname: string;
  expandedHref: string | null;
  setExpandedHref: (href: string | null) => void;
}) {
  const active = isActivePath(pathname, item.href);
  const Icon = item.icon;
  const hasChildren = !!item.children?.length;
  const expanded = expandedHref === item.href;

  useEffect(() => {
    if (active && hasChildren) {
      setExpandedHref(item.href);
    }
  }, [active, hasChildren, setExpandedHref, item.href]);

  const showChildren = hasChildren && expanded;

  const handleToggleChildren = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedHref(expanded ? null : item.href);
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={item.href} id={stableHrefToId(item.href)} />}
        isActive={active}
        tooltip={item.label}
        onClick={() => {
          if (!hasChildren) setExpandedHref(null);
        }}
        className={cn(
          "relative h-10 w-full px-4 pr-9 transition-all duration-200",
          "hover:bg-slate-100/90 hover:text-slate-900",
          "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
          active &&
          "bg-indigo-50 text-indigo-700 font-semibold shadow-[inset_0_0_0_1px_rgba(99,102,241,0.12)] hover:bg-indigo-50 hover:text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400",
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5 transition-colors group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-6",
            active
              ? "text-indigo-600 dark:text-indigo-400"
              : "text-slate-500 group-hover:text-slate-900",
          )}
        />
        <span className="text-sm group-data-[collapsible=icon]:hidden">
          {item.label}
        </span>

        {item.tag && (
          <span className="ml-auto mr-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 group-data-[collapsible=icon]:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {item.tag}
          </span>
        )}

        {hasChildren ? (
          <span
            role="button"
            tabIndex={0}
            aria-label={showChildren ? "Thu gọn mục con" : "Mở rộng mục con"}
            onClick={handleToggleChildren}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleToggleChildren(e);
              }
            }}
            className="absolute right-2 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 group-data-[collapsible=icon]:hidden dark:hover:bg-slate-900 dark:hover:text-slate-200"
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                showChildren ? "rotate-90 text-indigo-500" : "rotate-0",
              )}
            />
          </span>
        ) : null}

        {active && (
          <div className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-indigo-600 group-data-[collapsible=icon]:hidden" />
        )}
      </SidebarMenuButton>

      {showChildren && (
        <div className="mb-1 mt-0.5 space-y-0.5 pl-4 pr-3 group-data-[collapsible=icon]:hidden">
          {item.children?.map((child) => {
            const childActive = isActivePath(pathname, child.href);
            const ChildIcon = child.icon;
            const colorMap: Record<string, string> = {
              indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400",
              violet: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
              blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
              emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
              amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
              rose: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400",
              orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400",
            };
            const iconCls = child.color ? (colorMap[child.color] ?? "bg-slate-100 text-slate-500") : "bg-slate-100 text-slate-500";
            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "flex h-9 items-center gap-2.5 rounded-xl px-2.5 text-[12.5px] font-medium transition-all",
                  "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200",
                  childActive &&
                  "bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-950/40 dark:text-indigo-300",
                )}
              >
                <span className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-all",
                  childActive ? iconCls : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                )}>
                  <ChildIcon className="h-3.5 w-3.5" />
                </span>
                <span className="truncate">{child.label}</span>
                {childActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />}
              </Link>
            );
          })}
        </div>
      )}
    </SidebarMenuItem>
  );
});
