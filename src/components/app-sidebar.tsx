"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, CircleHelp, Warehouse } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarSection } from "@/components/sidebar/sidebar-section";
import {
  SIDEBAR_SECTIONS,
  filterSidebarSections,
  findExpandedHref,
} from "@/components/sidebar/sidebar-navigation";
import { getRoleLabel, getUserRoles } from "@/lib/access-control";
import { useGetCurrentUserQuery } from "@/store/services/auth.service";

export function AppSidebar() {
  const pathname = usePathname();
  const { data: user } = useGetCurrentUserQuery();
  const userRoles = useMemo(() => getUserRoles(user?.roles), [user?.roles]);
  const visibleSections = useMemo(
    () => filterSidebarSections(SIDEBAR_SECTIONS, userRoles),
    [userRoles],
  );
  const [expandedHref, setExpandedHref] = useState<string | null>(() =>
    findExpandedHref(visibleSections, pathname),
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
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Online
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          Cập nhật đồng bộ theo thời gian thực
        </p>
      </div>

      <SidebarContent className="no-scrollbar gap-0 py-4">
        {visibleSections.map((section) => (
          <SidebarSection
            key={section.label}
            section={section}
            pathname={pathname}
            expandedHref={expandedHref}
            setExpandedHref={setExpandedHref}
          />
        ))}
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
