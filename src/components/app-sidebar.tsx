"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BadgePercent,
  Box,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  useSidebar,
} from "@/components/ui/sidebar";

type SidebarLeafItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

type SidebarBranchItem = {
  title: string;
  icon: LucideIcon;
  children: SidebarLeafItem[];
};

type SidebarItem = SidebarLeafItem | SidebarBranchItem;

type SidebarGroup = {
  title: string;
  items: SidebarItem[];
};

const sidebarGroups: SidebarGroup[] = [
  {
    title: "Tổng quan",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Báo cáo", href: "/reports", icon: BadgePercent },
    ],
  },
  {
    title: "Quản lý kho",
    items: [
      {
        title: "Sản phẩm",
        icon: Boxes,
        children: [
          { title: "Danh sách sản phẩm", href: "/products", icon: Box },
          { title: "Kiểm kho", href: "/inventory/audit", icon: ClipboardCheck },
        ],
      },
      { title: "Tồn kho", href: "/inventory", icon: Warehouse },
      { title: "Nhập kho", href: "/stock-in", icon: PackagePlus },
      { title: "Xuất kho", href: "/stock-out", icon: Truck },
    ],
  },
  {
    title: "Đối tác",
    items: [
      { title: "Khách hàng", href: "/customers", icon: Users },
      { title: "Nhà cung cấp", href: "/suppliers", icon: Truck },
    ],
  },
  {
    title: "Cấu hình",
    items: [
      { title: "Cài đặt hệ thống", href: "/settings", icon: Settings },
      { title: "Phân quyền", href: "/permissions", icon: ShieldCheck },
    ],
  },
];

function isBranchItem(item: SidebarItem): item is SidebarBranchItem {
  return "children" in item;
}

function getBranchKey(groupTitle: string, itemTitle: string): string {
  return `${groupTitle}::${itemTitle}`;
}

export function AppSidebar() {
  const pathname = usePathname();
  const { collapsed, setCollapsed } = useSidebar();
  const [openedBranches, setOpenedBranches] = useState<Record<string, boolean>>({});

  const isPathActive = (href: string): boolean => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const defaultOpenedBranches = useMemo(() => {
    const result: Record<string, boolean> = {};

    for (const group of sidebarGroups) {
      for (const item of group.items) {
        if (isBranchItem(item)) {
          result[getBranchKey(group.title, item.title)] = item.children.some((child) =>
            isPathActive(child.href)
          );
        }
      }
    }

    return result;
  }, [pathname]);

  useEffect(() => {
    setOpenedBranches((current) => ({ ...defaultOpenedBranches, ...current }));
  }, [defaultOpenedBranches]);

  return (
    <Sidebar>
      <SidebarHeader className="h-16">
        <div className="flex h-full items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-900">
              <Warehouse className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <p className="truncate text-sm font-semibold">WMS Enterprise</p>
                <p className="truncate text-xs text-slate-400">Warehouse Operations</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {sidebarGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>

            <SidebarMenu>
              {group.items.map((item) => {
                if (isBranchItem(item)) {
                  const key = getBranchKey(group.title, item.title);
                  const branchActive = item.children.some((child) => isPathActive(child.href));
                  const opened = openedBranches[key] ?? false;
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={key}>
                      <SidebarMenuButton
                        type="button"
                        onClick={() => {
                          if (collapsed) {
                            setCollapsed(false);
                            setOpenedBranches((current) => ({ ...current, [key]: true }));
                            return;
                          }

                          setOpenedBranches((current) => ({ ...current, [key]: !opened }));
                        }}
                        active={branchActive}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="ml-3 flex-1 truncate text-left">{item.title}</span>
                            <ChevronRight
                              className={cn(
                                "h-4 w-4 transition-transform",
                                opened ? "rotate-90" : "rotate-0"
                              )}
                            />
                          </>
                        )}
                      </SidebarMenuButton>

                      {!collapsed && opened && (
                        <SidebarMenuSub>
                          {item.children.map((child) => {
                            const childActive = isPathActive(child.href);
                            const ChildIcon = child.icon;

                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={cn(
                                  "flex h-9 items-center rounded-md px-2 text-sm transition-colors",
                                  childActive
                                    ? "bg-slate-700 text-white"
                                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                                )}
                              >
                                <ChildIcon className="h-4 w-4 shrink-0" />
                                <span className="ml-2 truncate">{child.title}</span>
                              </Link>
                            );
                          })}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  );
                }

                const Icon = item.icon;
                const active = isPathActive(item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex h-10 items-center rounded-md px-2 text-sm transition-colors",
                        active
                          ? "bg-slate-800 text-white"
                          : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="ml-3 truncate">{item.title}</span>}
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div
          className={cn(
            "flex items-center rounded-lg bg-slate-800/70 p-2",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-900">
              AD
            </div>

            {!collapsed && (
              <div className="truncate">
                <p className="truncate text-sm font-medium text-white">Admin WMS</p>
                <p className="truncate text-xs text-slate-400">admin@wms.local</p>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
