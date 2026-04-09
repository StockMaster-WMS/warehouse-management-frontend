"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  CircleHelp,
  Home,
  Languages,
  LogOut,
  Search,
  Settings,
  Sparkles,
  UserCog,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSearchShortcutLabel } from "@/hooks/use-search-shortcut-label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QuickSearchDialog } from "@/components/quick-search-dialog";
import { SidebarTrigger } from "@/components/ui/sidebar";

function toTitle(segment: string): string {
  const map: Record<string, string> = {
    dashboard: "Tổng quan kho",
    inventory: "Theo dõi tồn kho",
    warehouses: "Danh sách kho",
    products: "Sản phẩm",
    categories: "Nhóm / loại hàng",
    orders: "Xuất kho & giao hàng",
    inbound: "Nhập hàng",
    "purchase-orders": "Đơn nhập hàng",
    putaway: "Sắp xếp vào kho",
    customers: "Khách hàng",
    suppliers: "Nhà cung cấp",
    history: "Nhật ký hoạt động",
    reports: "Báo cáo",
    settings: "Cài đặt hệ thống",
    security: "Bảo mật & Phân quyền",
    profile: "Trang cá nhân",
    new: "Tạo mới",
  };

  return map[segment] ?? segment.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export function Navbar() {
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const searchShortcut = useSearchShortcutLabel();
  const pathname = usePathname();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;
      if (e.key !== "k" && e.key !== "K") return;
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return;

      e.preventDefault();
      setQuickSearchOpen((open) => !open);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  const pathSegments = useMemo(
    () => pathname.split("/").filter(Boolean),
    [pathname]
  );

  const pageTitle = useMemo(() => {
    const current = pathSegments[pathSegments.length - 1] ?? "dashboard";
    return toTitle(current);
  }, [pathSegments]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-indigo-500/20 bg-indigo-600 text-white shadow-sm transition-all duration-300 dark:border-indigo-500/20 dark:bg-indigo-950">
      {/* Mobile layout - single row */}
      <div className="flex h-16 items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4 md:hidden lg:hidden">
        <div className="flex min-w-0 items-center gap-2 flex-1">
          <SidebarTrigger className="-ml-1 text-indigo-100 hover:bg-white/10 hover:text-white" />

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-indigo-100 hover:bg-white/10 hover:text-white"
            onClick={() => setQuickSearchOpen(true)}
            aria-label={`Mở tìm kiếm nhanh (${searchShortcut})`}
          >
            <Search className="h-5 w-5" />
          </Button>

          <span className="text-xs sm:text-sm font-medium text-white truncate flex-1">
            {pageTitle}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <ThemeToggle />
          <Button
            render={<Link href="/settings" />}
            nativeButton={false}
            variant="ghost"
            size="icon-sm"
            className="rounded-full text-indigo-100 hover:bg-white/10 hover:text-white"
            aria-label="Cài đặt"
          >
            <CircleHelp className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative rounded-full text-indigo-100 hover:bg-white/10 hover:text-white"
            aria-label="Thông báo"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
            </span>
          </Button>
        </div>
      </div>

      {/* Tablet/Desktop layout */}
      <div className="hidden md:flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-4 flex-1">
          <SidebarTrigger className="-ml-1 text-indigo-100 hover:bg-white/10 hover:text-white" />

          <div className="hidden min-w-0 md:flex md:flex-col md:gap-0.5 flex-1">
            <div className="flex min-w-0 items-center gap-1 text-[11px] text-indigo-100">
              <Home className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">StockMaster</span>
              {pathSegments.slice(0, 2).map((segment) => (
                <div key={segment} className="flex min-w-0 items-center gap-1">
                  <span className="shrink-0">/</span>
                  <span className="truncate">{toTitle(segment)}</span>
                </div>
              ))}
            </div>
            <p className="truncate text-sm font-semibold text-white">{pageTitle}</p>
          </div>

          <div className="hidden items-center gap-2 lg:flex flex-1 lg:max-w-md">
            <div className="relative flex items-center w-full">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-indigo-200" />
              <button
                type="button"
                onClick={() => setQuickSearchOpen(true)}
                className="flex h-9 w-full cursor-pointer items-center rounded-full border border-transparent bg-white/10 py-0 pr-20 pl-10 text-left text-sm text-indigo-100/95 transition-colors hover:bg-white/15 focus-visible:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
                aria-label={`Mở tìm kiếm nhanh (${searchShortcut})`}
              >
                <span className="truncate text-xs sm:text-sm text-indigo-100/90">
                  Tìm kiếm…
                </span>
              </button>
              <kbd className="pointer-events-none absolute right-3 hidden h-5 items-center gap-1 rounded border border-white/20 bg-white/10 px-1.5 font-mono text-[10px] font-medium text-indigo-100 sm:flex">
                {searchShortcut}
              </kbd>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
          <div className="hidden items-center pr-2 xl:flex">
            <div className="flex max-w-[20rem] items-center gap-2 truncate rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-indigo-50">
              <Sparkles className="h-3.5 w-3.5 shrink-0 fill-indigo-300 text-indigo-300" />
              <span className="truncate">StockMaster — sẵn sàng vận hành</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              render={<Link href="/settings" />}
              nativeButton={false}
              variant="ghost"
              size="icon-sm"
              className="rounded-full text-indigo-100 hover:bg-white/10 hover:text-white"
              aria-label="Giúp đỡ"
            >
              <CircleHelp className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              className="relative rounded-full text-indigo-100 hover:bg-white/10 hover:text-white"
              aria-label="Thông báo"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
              </span>
            </Button>
          </div>

          <div className="h-6 w-px bg-white/20" />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="group h-10 gap-2 rounded-full px-1 pl-1 text-white hover:bg-white/10 aria-expanded:bg-white/20 aria-expanded:text-white"
                >
                  <Avatar
                    size="sm"
                    className="ring-2 ring-white/30 transition-all group-hover:ring-white"
                  >
                    <AvatarImage
                      src="https://ui-avatars.com/api/?name=An+Nguyen&background=fff&color=4F46E5"
                      alt="User avatar"
                    />
                    <AvatarFallback className="bg-white text-indigo-600">
                      AN
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden flex-col items-start pr-1 text-left lg:flex">
                    <span className="text-sm font-semibold leading-none text-white">
                      An Nguyen
                    </span>
                    <span className="text-[10px] font-medium text-indigo-100">
                      Người quản trị
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-indigo-200 transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              }
            />

            <DropdownMenuContent
              sideOffset={8}
              align="end"
              className="w-60 sm:w-64 rounded-xl p-2 shadow-xl ring-1 ring-slate-200 dark:ring-slate-800"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-2 py-1.5 font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none">
                      An Nguyen
                    </p>
                    <p className="text-xs leading-none text-slate-500 font-medium truncate">
                      an.nguyen@stockmaster.vn
                    </p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-lg py-2" render={<Link href="/profile" />}>
                <UserCog className="mr-2 h-4 w-4 shrink-0 text-slate-500" />
                <span className="truncate">Trang cá nhân</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg py-2" render={<Link href="/settings" />}>
                <Settings className="mr-2 h-4 w-4 shrink-0 text-slate-500" />
                <span className="truncate">Cài đặt hệ thống</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg py-2">
                <Languages className="mr-2 h-4 w-4 shrink-0 text-slate-500" />
                <span className="truncate">Ngôn ngữ: Tiếng Việt</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-lg py-2 text-red-600 focus:bg-red-50 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <QuickSearchDialog open={quickSearchOpen} onOpenChange={setQuickSearchOpen} />
    </header>
  );
}
