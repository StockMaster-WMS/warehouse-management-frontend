"use client";

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
  CreditCard,
  CircleHelp,
  ChevronLeft,
  ChevronRight,
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
};

const mainItems: MenuItem[] = [
  { label: "Bảng điều khiển", href: "/dashboard", icon: LayoutGrid },
  { label: "Quản lý tồn kho", href: "/inventory", icon: Boxes },
  { label: "Danh mục sản phẩm", href: "/products", icon: Package },
  { label: "Đơn hàng & Vận chuyển", href: "/orders", icon: Truck },
  { label: "Nhập hàng", href: "/inbound", icon: ClipboardList },
];

const secondaryItems: MenuItem[] = [
  { label: "Khách hàng", href: "/customers", icon: Users2 },
  { label: "Lịch sử hoạt động", href: "/history", icon: History },
  { label: "Báo cáo thống kê", href: "/reports", icon: BarChart3 },
];

const systemItems: MenuItem[] = [
  { label: "Cài đặt hệ thống", href: "/settings", icon: Settings },
  { label: "Bảo mật & Phân quyền", href: "/security", icon: ShieldCheck },
];

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950"
    >
      <SidebarHeader className="flex h-16 items-center border-b border-transparent px-6 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
        <Link href="/" className="flex items-center gap-3 transition-all hover:opacity-80">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-200 dark:shadow-none">
            <Warehouse className="h-5 w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              StockMaster
            </span>
            <span className="text-[10px] font-medium text-slate-500">WMS Platinum</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="no-scrollbar gap-0 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 group-data-[collapsible=icon]:hidden">
            Quản trị chính
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarItem key={item.href} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 group-data-[collapsible=icon]:hidden">
            Dữ liệu & Báo cáo
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarItem key={item.href} item={item} pathname={pathname} />
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
                <SidebarItem key={item.href} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-100 p-4 dark:border-slate-800">
        <div className="flex flex-col gap-2 group-data-[collapsible=icon]:items-center">
          <SidebarMenuButton
             tooltip="Trợ giúp"
             className="text-slate-500 hover:text-slate-900"
          >
            <CircleHelp className="h-4 w-4" />
            <span className="group-data-[collapsible=icon]:hidden">Trung tâm hỗ trợ</span>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>

      <SidebarRail className="absolute top-1/2 z-50 flex h-14 w-5 -translate-y-1/2 cursor-pointer items-center justify-center border border-slate-200 bg-white shadow-sm transition-all duration-300 after:hidden hover:bg-slate-50 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 ltr:translate-x-0 rtl:translate-x-0 group-data-[side=left]:left-full group-data-[side=right]:right-full group-data-[side=left]:[clip-path:polygon(0_0,100%_18%,100%_82%,0_100%)] group-data-[side=right]:[clip-path:polygon(0_18%,100%_0,100%_100%,0_82%)]">
        <ChevronLeft className="h-4 w-4 text-slate-500 transition-transform duration-500 group-data-[state=collapsed]:rotate-180 group-hover:text-indigo-600 dark:text-slate-400 dark:group-hover:text-indigo-400" />
      </SidebarRail>
    </Sidebar>
  );
}

function SidebarItem({ item, pathname }: { item: MenuItem; pathname: string }) {
  const active = isActivePath(pathname, item.href);
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={item.href} />}
        isActive={active}
        tooltip={item.label}
        className={cn(
          "relative h-10 w-full px-4 transition-all duration-200",
          "hover:bg-slate-100 hover:text-slate-900",
          "group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center",
          active && "bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-50 hover:text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400"
        )}
      >
        <Icon
          className={cn(
            "h-[18px] w-[18px] transition-colors",
            active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 group-hover:text-slate-900"
          )}
        />
        <span className="text-sm group-data-[collapsible=icon]:hidden">
          {item.label}
        </span>
        {active && (
          <div className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-indigo-600 group-data-[collapsible=icon]:hidden" />
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
