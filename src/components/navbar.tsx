"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
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
import { NotificationBell } from "@/components/notifications/notification-bell";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getRoleLabel, getUserRoles } from "@/lib/access-control";
import { PermissionControl } from "@/components/permission-control";
import { clearToken, markExplicitLogout } from "@/lib/auth-token";
import { useAppDispatch } from "@/store/hooks";
import { baseApi } from "@/store/services/api";
import { useGetCurrentUserQuery, useLogoutMutation } from "@/store/services/auth.service";
import { toast } from "sonner";

function toTitle(segment: string): string {
  const map: Record<string, string> = {
    notifications: "Thông báo",
    dashboard: "Tổng quan kho",
    inventory: "Theo dõi tồn kho",
    warehouses: "Kho hàng",
    products: "Sản phẩm & mã hàng",
    categories: "Nhóm hàng",
    orders: "Đơn xuất",
    returns: "Hàng trả",
    inbound: "Phiếu nhập kho",
    "purchase-orders": "Đơn nhập hàng",
    putaway: "Xếp hàng lên kệ",
    picking: "Lấy hàng",
    customers: "Khách hàng",
    suppliers: "Nhà cung cấp",
    locations: "Vị trí lưu trữ",
    "cycle-counts": "Kiểm kê kho",
    history: "Nhật ký hoạt động",
    reports: "Báo cáo vận hành",
    settings: "Cấu hình hệ thống",
    security: "Bảo mật & phân quyền",
    profile: "Hồ sơ người dùng",
    new: "Tạo mới",
  };

  return map[segment] ?? segment.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export function Navbar() {
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const searchShortcut = useSearchShortcutLabel();
  const pathname = usePathname();
  const { replace } = useRouter();
  const dispatch = useAppDispatch();

  const { data: user } = useGetCurrentUserQuery();
  const [logout] = useLogoutMutation();

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

  const roleLabel = useMemo(() => {
    const [primaryRole] = getUserRoles(user?.roles);
    return primaryRole ? getRoleLabel(primaryRole) : "Chưa phân quyền";
  }, [user?.roles]);

  const clearClientSession = () => {
    markExplicitLogout();
    clearToken();
    dispatch(baseApi.util.resetApiState());
    replace("/login");
  };

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      toast.success("Đã đăng xuất thành công");
    } catch {
      toast.error("Không thể hoàn tất đăng xuất trên máy chủ, đã xóa phiên trên trình duyệt.");
    } finally {
      clearClientSession();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-primary text-primary-foreground shadow-sm transition-all duration-300 dark:border-border dark:bg-primary">
      {/* Mobile layout - single row */}
      <div className="flex h-16 items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4 md:hidden lg:hidden">
        <div className="flex min-w-0 items-center gap-2 flex-1">
          <SidebarTrigger className="-ml-1 text-primary-foreground hover:bg-white/10 hover:text-white" />

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-primary-foreground hover:bg-white/10 hover:text-white"
            onClick={() => setQuickSearchOpen(true)}
            aria-label={`Mở tìm kiếm nhanh (${searchShortcut})`}
          >
            <Search className="size-5" />
          </Button>

          <span className="text-xs sm:text-sm font-medium text-primary-foreground truncate flex-1">
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
            className="rounded-full text-primary-foreground hover:bg-white/10 hover:text-white"
            aria-label="Cài đặt"
          >
            <CircleHelp className="size-5" />
          </Button>
          <NotificationBell compact />
        </div>
      </div>

      {/* Tablet/Desktop layout */}
      <div className="hidden md:flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-4 flex-1">
          <SidebarTrigger className="-ml-1 text-primary-foreground/85 hover:bg-white/10 hover:text-white" />

          <div className="hidden min-w-0 md:flex md:flex-col md:gap-0.5 flex-1">
            <div className="flex min-w-0 items-center gap-1 text-[11px] text-primary-foreground/85">
              <Home className="size-3.5 shrink-0" />
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
              <Search className="pointer-events-none absolute left-3 size-4 text-primary-foreground/70" />
              <button
                type="button"
                onClick={() => setQuickSearchOpen(true)}
                className="flex h-9 w-full cursor-pointer items-center rounded-full border border-transparent bg-white/10 py-0 pr-20 pl-10 text-left text-sm text-primary-foreground/95 transition-colors hover:bg-white/15 focus-visible:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
                aria-label={`Mở tìm kiếm nhanh (${searchShortcut})`}
              >
                <span className="truncate text-xs text-primary-foreground/90 sm:text-sm">
                  Tìm kiếm…
                </span>
              </button>
                <kbd className="pointer-events-none absolute right-3 hidden h-5 items-center gap-1 rounded border border-white/20 bg-white/10 px-1.5 font-mono text-[10px] font-medium text-primary-foreground sm:flex">
                {searchShortcut}
              </kbd>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
          <div className="hidden items-center pr-2 xl:flex">
            <div className="flex max-w-[20rem] items-center gap-2 truncate rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-primary-foreground/90">
              <Sparkles className="size-3.5 shrink-0 fill-primary-foreground/70 text-primary-foreground/70" />
              <span className="truncate">StockMaster: sẵn sàng vận hành</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              render={<Link href="/settings" />}
              nativeButton={false}
              variant="ghost"
              size="icon-sm"
              className="rounded-full text-primary-foreground/85 hover:bg-white/10 hover:text-white"
              aria-label="Giúp đỡ"
            >
              <CircleHelp className="size-5" />
            </Button>

            <NotificationBell />
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
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || user?.name || user?.username || "User")}&background=fff&color=111827`}
                      alt="User avatar"
                    />
                    <AvatarFallback className="bg-white text-primary">
                      {(user?.fullName || user?.name || user?.username || "US").substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden flex-col items-start pr-1 text-left lg:flex">
                    <span className="text-sm font-semibold leading-none text-white">
                      {user?.fullName || user?.name || user?.username || "Người dùng"}
                    </span>
                    <span className="text-[10px] font-medium text-primary-foreground/85">
                      {roleLabel}
                    </span>
                  </div>
                  <ChevronDown className="size-4 text-primary-foreground/70 transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              }
            />

            <DropdownMenuContent
              sideOffset={8}
              align="end"
              className="w-60 sm:w-64 rounded-xl p-2 shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-2 py-1.5 font-normal">
                  <div className="flex flex-col gap-y-1">
                    <p className="text-sm font-semibold leading-none">
                      {user?.fullName || user?.name || user?.username || "Người dùng"}
                    </p>
                    <p className="text-xs leading-none text-zinc-500 font-medium truncate">
                      {user?.email || "Email chưa cập nhật"}
                    </p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-lg py-2" render={<Link href="/profile" />}>
                <UserCog className="mr-2 size-4 shrink-0 text-zinc-500" />
                <span className="truncate">Hồ sơ người dùng</span>
              </DropdownMenuItem>
              <PermissionControl allowedRoles="ADMIN">
                <DropdownMenuItem className="rounded-lg py-2" render={<Link href="/settings" />}>
                  <Settings className="mr-2 size-4 shrink-0 text-zinc-500" />
                  <span className="truncate">Cấu hình hệ thống</span>
                </DropdownMenuItem>
              </PermissionControl>
              <DropdownMenuItem
                className="rounded-lg py-2"
                onSelect={(event) => {
                  event.preventDefault();
                  toast.info("StockMaster đang dùng Tiếng Việt làm ngôn ngữ mặc định.");
                }}
              >
                <Languages className="mr-2 size-4 shrink-0 text-zinc-500" />
                <span className="truncate">Ngôn ngữ: Tiếng Việt</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="rounded-lg py-2 text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 size-4 shrink-0" />
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
