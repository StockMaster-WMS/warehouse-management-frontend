"use client";

import {
  Bell,
  ChevronDown,
  Command,
  CircleHelp,
  Languages,
  LogOut,
  Search,
  Settings,
  Sparkles,
  UserCog,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-indigo-500/20 bg-indigo-600 text-white shadow-sm transition-all duration-300 dark:border-indigo-500/20 dark:bg-indigo-950">
      <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="-ml-1 text-indigo-100 hover:bg-white/10 hover:text-white" />
          
          <div className="hidden items-center gap-2 md:flex">
             <div className="relative flex items-center">
                <Search className="absolute left-3 h-4 w-4 text-indigo-200" />
                <Input
                  type="search"
                  placeholder="Tìm kiếm nhanh... (Ctrl+K)"
                  className="h-9 w-64 rounded-full border-transparent bg-white/10 pl-10 pr-4 text-sm text-white placeholder:text-indigo-200 focus-visible:bg-white/20 focus-visible:ring-0 lg:w-80"
                />
                <kbd className="pointer-events-none absolute right-3 hidden h-5 items-center gap-1 rounded border border-white/20 bg-white/10 px-1.5 font-mono text-[10px] font-medium text-indigo-100 opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden items-center pr-2 md:flex">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-indigo-50">
              <Sparkles className="h-3.5 w-3.5 fill-indigo-300 text-indigo-300" />
              <span>Cập nhật mới: Quản lý kho thông minh đã sẵn sàng</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full text-indigo-100 hover:bg-white/10 hover:text-white"
              aria-label="Hỗ trợ"
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
                  <div className="hidden flex-col items-start pr-1 text-left md:flex">
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
              className="w-64 rounded-xl p-2 shadow-xl ring-1 ring-slate-200 dark:ring-slate-800"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-2 py-1.5 font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none">
                      An Nguyen
                    </p>
                    <p className="text-xs leading-none text-slate-500 font-medium">
                      an.nguyen@stockmaster.vn
                    </p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-lg py-2">
                <UserCog className="mr-2 h-4 w-4 text-slate-500" />
                <span>Trang cá nhân</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg py-2">
                <Settings className="mr-2 h-4 w-4 text-slate-500" />
                <span>Cài đặt hệ thống</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg py-2">
                <Languages className="mr-2 h-4 w-4 text-slate-500" />
                <span>Ngôn ngữ: Tiếng Việt</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-lg py-2 text-red-600 focus:bg-red-50 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

