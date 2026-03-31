"use client";

import { memo, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  Dot,
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

type MenuItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  tag?: string;
  children?: Array<{
    label: string;
    href: string;
  }>;
};

const mainItems: MenuItem[] = [
  { label: "Tổng quan kho", href: "/dashboard", icon: LayoutGrid },
  { label: "Theo dõi tồn kho", href: "/inventory", icon: Boxes },
  { label: "Danh sách kho", href: "/warehouses", icon: Warehouse },
  {
    label: "Sản phẩm",
    href: "/products",
    icon: Package,
    children: [
      { label: "Tất cả sản phẩm", href: "/products" },
      { label: "Tạo sản phẩm mới", href: "/products/new" },
      { label: "Nhóm / loại hàng", href: "/categories" },
    ],
  },
  { label: "Xuất kho & giao hàng", href: "/orders", icon: Truck },
  {
    label: "Nhập hàng",
    href: "/inbound",
    icon: ClipboardList,
    tag: "Mới",
    children: [
      { label: "Tạo đơn nhập", href: "/purchase-orders/new" },
      { label: "Đơn nhập hàng (PO)", href: "/purchase-orders" },
      { label: "Tạo phiếu nhập", href: "/inbound/new" },
      { label: "Danh sách phiếu nhập", href: "/inbound" },
      { label: "Putaway", href: "/putaway" },
    ],
  },
];

const secondaryItems: MenuItem[] = [
  { label: "Khách hàng", href: "/customers", icon: Users2 },
  { label: "Nhà cung cấp", href: "/suppliers", icon: Building2 },
  { label: "Nhật ký hoạt động", href: "/history", icon: History },
];

const reportItems: MenuItem[] = [
  { label: "Báo cáo", href: "/reports", icon: BarChart3, tag: "BI" },
];

const systemItems: MenuItem[] = [
  { label: "Cài đặt hệ thống", href: "/settings", icon: Settings },
  { label: "Bảo mật & Phân quyền", href: "/security", icon: ShieldCheck },
];

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function stableHrefToId(href: string) {
  // Keep it deterministic across SSR and client.
  // Also sanitize to a valid HTML id-friendly string.
  return `sidebar-link-${href.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

export function AppSidebar() {
  const pathname = usePathname();
  const allItems = [
    ...mainItems,
    ...secondaryItems,
    ...reportItems,
    ...systemItems,
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
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
            <Dot className="-ml-1 h-3.5 w-3.5" />
            Online
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          Cập nhật đồng bộ theo thời gian thực
        </p>
      </div>

      <SidebarContent className="no-scrollbar gap-0 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 group-data-[collapsible=icon]:hidden">
            Tổng quan & tác nghiệp
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
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

        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 group-data-[collapsible=icon]:hidden">
            Đối tác & nhật ký
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
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

        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 group-data-[collapsible=icon]:hidden">
            Báo cáo & phân tích
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {reportItems.map((item) => (
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

        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 group-data-[collapsible=icon]:hidden">
            Hệ thống
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
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
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-100 p-4 dark:border-slate-800">
        <div className="flex flex-col gap-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 group-data-[collapsible=icon]:hidden dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              An Nguyen
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Warehouse Manager
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
        <div className="mt-1 space-y-1 pl-11 pr-3 group-data-[collapsible=icon]:hidden">
          {item.children?.map((child) => {
            const childActive = isActivePath(pathname, child.href);

            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "flex h-8.5 items-center rounded-md px-2 text-[13px] transition-colors",
                  "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200",
                  childActive &&
                    "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
                )}
              >
                <Dot
                  className={cn(
                    "mr-1.5 h-4 w-4",
                    childActive ? "text-indigo-500" : "text-slate-300",
                  )}
                />
                <span className="truncate">{child.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </SidebarMenuItem>
  );
});
