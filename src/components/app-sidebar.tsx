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
import {
  useGetWarehousesQuery,
  useGetWarehouseSummaryQuery,
} from "@/store/services/warehouse.service";

function compactText(parts: Array<string | null | undefined>) {
  return parts.flatMap((part) => {
    const trimmed = part?.trim();
    return trimmed ? [trimmed] : [];
  }).join(" · ");
}

export function AppSidebar() {
  const pathname = usePathname();
  const { data: user } = useGetCurrentUserQuery();
  const userRoles = useMemo(() => getUserRoles(user?.roles), [user?.roles]);
  const isAdmin = userRoles.includes("ADMIN");
  const isManager = userRoles.includes("WAREHOUSE_MANAGER");
  const isReportViewer = userRoles.includes("REPORT_VIEWER");
  const shouldLoadWarehouseList = !isAdmin && !isReportViewer && userRoles.length > 0;
  const shouldLoadWarehouseSummary = (isAdmin || isManager || isReportViewer) && userRoles.length > 0;
  const {
    data: warehouseSummaryRes,
    isLoading: summaryLoading,
    isError: summaryError,
  } = useGetWarehouseSummaryQuery(undefined, {
    skip: !shouldLoadWarehouseSummary,
  });
  const {
    data: warehousesRes,
    isLoading: warehousesLoading,
    isError: warehousesError,
  } = useGetWarehousesQuery({
    page: 0,
    size: isManager ? 2 : 1,
    sort: "name",
    sortDir: "asc",
    isActive: true,
  }, {
    skip: !shouldLoadWarehouseList,
  });
  const warehouses = useMemo(
    () => warehousesRes?.data?.content ?? [],
    [warehousesRes],
  );
  const primaryWarehouse = warehouses[0];
  const summary = warehouseSummaryRes?.data;
  const warehousePanel = useMemo(() => {
    if (isAdmin) {
      return {
        title: "Tổng quan hệ thống",
        status: summaryLoading
          ? "Đang tải"
          : `${summary?.activeWarehouses ?? 0}/${summary?.totalWarehouses ?? 0} kho hoạt động`,
        statusTone: "info" as const,
        description: summaryError
          ? "Không tải được tổng quan mạng lưới kho"
          : summaryLoading
          ? "Đang lấy thông tin mạng lưới kho"
          : `${summary?.warehousesWithStock ?? 0} kho đang có tồn kho`,
      };
    }

    if (isReportViewer) {
      return {
        title: "Tổng quan báo cáo",
        status: summaryLoading ? "Đang tải" : `${summary?.activeWarehouses ?? 0} kho active`,
        statusTone: summaryError ? "error" as const : "info" as const,
        description: summaryError
          ? "Không tải được số liệu kho"
          : "Chỉ xem số liệu vận hành và báo cáo",
      };
    }

    if (isManager) {
      const totalWarehouses = summary?.totalWarehouses ?? warehousesRes?.data?.total_elements ?? warehouses.length;
      const visibleWarehouseNames = warehouses
        .flatMap((warehouse) => {
          const label = warehouse.code || warehouse.name;
          return label ? [label] : [];
        })
        .slice(0, 2)
        .join(", ");

      return {
        title: totalWarehouses > 1 ? "Kho phụ trách" : primaryWarehouse?.name || "Kho phụ trách",
        status: summaryLoading || warehousesLoading ? "Đang tải" : `${summary?.activeWarehouses ?? totalWarehouses} kho active`,
        statusTone: summaryError || warehousesError ? "error" as const : totalWarehouses > 0 ? "success" as const : "warning" as const,
        description:
          summaryError || warehousesError
            ? "Không tải được kho được phân quyền"
            : visibleWarehouseNames
              ? `${visibleWarehouseNames}${totalWarehouses > 2 ? ` +${totalWarehouses - 2}` : ""}`
              : "Chưa có kho được phân quyền",
      };
    }

    if (warehousesLoading) {
      return {
        title: "Đang tải kho",
        status: "Đồng bộ",
        statusTone: "info" as const,
        description: "Đang lấy thông tin kho được phân quyền",
      };
    }

    if (warehousesError) {
      return {
        title: "Không tải được kho",
        status: "Lỗi",
        statusTone: "error" as const,
        description: "Kiểm tra kết nối hoặc quyền truy cập kho",
      };
    }

    if (!primaryWarehouse) {
      return {
        title: "Chưa có kho",
        status: "Chưa gán",
        statusTone: "warning" as const,
        description: "Tài khoản chưa được phân quyền kho hoạt động",
      };
    }

    return {
      title: primaryWarehouse.name || primaryWarehouse.code || "Kho chưa đặt tên",
      status: primaryWarehouse.isActive ? "Đang hoạt động" : "Ngừng hoạt động",
      statusTone: primaryWarehouse.isActive ? "success" as const : "warning" as const,
      description:
        compactText([
          primaryWarehouse.code,
          primaryWarehouse.managerName ? `QL: ${primaryWarehouse.managerName}` : null,
          primaryWarehouse.address,
        ]) || primaryWarehouse.timezone || "Thông tin kho đang được cập nhật",
    };
  }, [
    isAdmin,
    isManager,
    isReportViewer,
    primaryWarehouse,
    summary,
    summaryError,
    summaryLoading,
    warehouses,
    warehousesError,
    warehousesLoading,
    warehousesRes,
  ]);
  const statusClassName =
    warehousePanel.statusTone === "success"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
      : warehousePanel.statusTone === "warning"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
        : warehousePanel.statusTone === "error"
          ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
          : "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300";
  const statusDotClassName =
    warehousePanel.statusTone === "success"
      ? "bg-emerald-500"
      : warehousePanel.statusTone === "warning"
        ? "bg-amber-500"
        : warehousePanel.statusTone === "error"
          ? "bg-rose-500"
          : "bg-indigo-500";
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
          <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-200 dark:shadow-none">
            <Warehouse className="size-5.5" />
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
          <p className="min-w-0 truncate text-xs font-semibold text-slate-800 dark:text-slate-200" title={warehousePanel.title}>
            {warehousePanel.title}
          </p>
          <span className={`ml-2 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClassName}`}>
            <span className={`size-1.5 rounded-full ${statusDotClassName}`} />
            {warehousePanel.status}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500" title={warehousePanel.description}>
          {warehousePanel.description}
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
            render={
              <a href="mailto:admin@stockmaster.local?subject=Can%20ho%20tro%20StockMaster" />
            }
            tooltip="Trợ giúp"
            className="text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-900"
          >
            <CircleHelp className="size-4" />
            <span className="group-data-[collapsible=icon]:hidden">
              Trợ giúp & hỗ trợ
            </span>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>

      <SidebarRail className="absolute top-1/2 z-50 flex h-14 w-5 -translate-y-1/2 cursor-pointer items-center justify-center border border-slate-200 bg-white shadow-sm transition-all duration-300 after:hidden hover:bg-slate-50 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 ltr:translate-x-0 rtl:translate-x-0 group-data-[side=left]:left-full group-data-[side=right]:right-full group-data-[side=left]:[clip-path:polygon(0_0,100%_18%,100%_82%,0_100%)] group-data-[side=right]:[clip-path:polygon(0_18%,100%_0,100%_100%,0_82%)]">
        <ChevronLeft className="size-4 text-slate-500 transition-transform duration-500 group-data-[state=collapsed]:rotate-180 group-hover:text-indigo-600 dark:text-slate-400 dark:group-hover:text-indigo-400" />
      </SidebarRail>
    </Sidebar>
  );
}
