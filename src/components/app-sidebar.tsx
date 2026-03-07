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
  SidebarMenu,
    BarChart3,
    Boxes,
    FileStack,
    FolderKanban,
    LayoutGrid,
    Package,
    Settings,
    ShoppingCart,
    UserCircle2,
    UserRound,
    Users,
    Workflow,
  } from "lucide-react";
  import type { LucideIcon } from "lucide-react";
  import { cn } from "@/lib/utils";

  type MenuItem = {
    label: string;
    href: string;
    icon: LucideIcon;
  };

  const primaryMenu: MenuItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { label: "Landing Pages", href: "/landing-pages", icon: FileStack },
    { label: "Don hang", href: "/orders", icon: ShoppingCart },
    { label: "San pham", href: "/products", icon: Package },
    { label: "Khach hang", href: "/customers", icon: Users },
    { label: "Segments", href: "/segments", icon: Workflow },
    { label: "Bao cao", href: "/reports", icon: BarChart3 },
    { label: "Cai dat", href: "/settings", icon: Settings },
  ];

  const appMenu: MenuItem[] = [
    { label: "CRM", href: "/apps/crm", icon: UserCircle2 },
    { label: "Kho", href: "/apps/warehouse", icon: Boxes },
    { label: "Cong viec", href: "/apps/tasks", icon: FolderKanban },
  ];

  function isActivePath(pathname: string, href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  export function AppSidebar() {
    const pathname = usePathname();

    return (
      <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6366F1]/10 text-[#5B5BD6]">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">Nguyen Van Admin</p>
              <p className="truncate text-xs text-slate-500">Warehouse Manager</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {primaryMenu.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex h-10 items-center rounded-lg px-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-[#EEF0FF] text-[#5B5BD6]"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "text-[#5B5BD6]" : "text-slate-500 group-hover:text-slate-700"
                      )}
                    />
                    <span className="ml-3 truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 border-t border-slate-200 pt-4">
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Ung dung
            </p>
            <ul className="space-y-1">
              {appMenu.map((item) => {
                const active = isActivePath(pathname, item.href);
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex h-9 items-center rounded-lg px-2.5 text-xs font-medium transition-colors",
                        active
                          ? "bg-[#EEF0FF] text-[#5B5BD6]"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          active ? "text-[#5B5BD6]" : "text-slate-400 group-hover:text-slate-600"
                        )}
                      />
                      <span className="ml-2 truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </aside>
    );
  }
          </button>
