"use client";

import {
  Bot,
  Palette,
  Settings,
  Shield,
  UserCog,
} from "lucide-react";
import { useSettingsPage } from "@/components/features/settings";
import { SettingsContent } from "@/components/features/settings/components/SettingsContent";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";
import type { SettingsTab } from "@/components/features/settings/types";

const tabs = [
  {
    key: "personal",
    label: "Hồ sơ người dùng",
    description: "Thông tin tài khoản",
    group: "Cá nhân",
    icon: UserCog,
  },
  {
    key: "appearance",
    label: "Giao diện",
    description: "Chế độ màu, mật độ, hiển thị",
    group: "Cá nhân",
    icon: Palette,
  },
  {
    key: "ai",
    label: "Trợ lý kho",
    description: "Khóa kết nối và nhà cung cấp",
    group: "Quản trị hệ thống",
    icon: Bot,
  },
  {
    key: "security",
    label: "Bảo mật & phân quyền",
    description: "Mật khẩu, quyền và nhật ký",
    group: "Quản trị hệ thống",
    icon: Shield,
  },
] as const satisfies Array<{
  key: SettingsTab;
  label: string;
  description: string;
  group: string;
  icon: typeof UserCog;
}>;

const tabGroups = ["Cá nhân", "Quản trị hệ thống"] as const;

const tabDetails: Record<SettingsTab, { title: string; description: string }> = {
  personal: {
    title: "Hồ sơ người dùng",
    description: "Quản lý thông tin cá nhân và điều hướng đến hồ sơ tài khoản.",
  },
  appearance: {
    title: "Giao diện hệ thống",
    description: "Thiết lập chế độ màu, mật độ hiển thị, ngôn ngữ và định dạng ngày.",
  },
  ai: {
    title: "Cấu hình trợ lý kho",
    description: "Quản lý nhà cung cấp và khóa kết nối dùng cho trợ lý đám mây.",
  },
  security: {
    title: "Bảo mật & phân quyền",
    description: "Quản lý mật khẩu, quyền truy cập và nhật ký kiểm toán.",
  },
};

export default function SettingsPage() {
  const {
    activeTab,
    setActiveTab,
    appearance,
    gotoProfile,
    updateAppearance,
  } = useSettingsPage();

  const activeItem = tabs.find((item) => item.key === activeTab) ?? tabs[0];
  const ActiveIcon = activeItem.icon;
  const activeDetails = tabDetails[activeTab];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cài đặt hệ thống"
        description="Quản lý cấu hình vận hành, bảo mật và tích hợp của StockMaster-WMS."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="rounded-lg border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Settings className="size-4 text-primary" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">Danh mục cài đặt</h2>
              <p className="text-xs text-muted-foreground">Theo nhóm cấu hình</p>
            </div>
          </div>

          <nav className="p-3">
            {tabGroups.map((group, groupIndex) => (
              <div key={group} className={groupIndex === 0 ? undefined : "mt-4"}>
                <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group}
                </p>
                <div className="space-y-1">
                  {tabs
                    .filter((item) => item.group === group)
                    .map((item) => {
                      const Icon = item.icon;
                      const selected = activeTab === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setActiveTab(item.key)}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                            selected
                              ? "bg-primary/5 text-foreground ring-1 ring-primary/10"
                              : "text-foreground hover:bg-muted",
                          )}
                        >
                          <Icon
                            className={cn(
                              "mt-0.5 size-4 shrink-0",
                              selected ? "text-primary" : "text-muted-foreground",
                            )}
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{item.label}</span>
                            <span
                              className={cn(
                                "mt-0.5 block text-xs leading-4",
                                selected ? "text-primary" : "text-muted-foreground",
                              )}
                            >
                              {item.description}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 space-y-4">
          <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:px-5">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ActiveIcon className="size-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-foreground">{activeDetails.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{activeDetails.description}</p>
              </div>
            </div>
          </section>

          <SettingsContent
            activeTab={activeTab}
            appearance={appearance}
            gotoProfile={gotoProfile}
            updateAppearance={updateAppearance}
          />
        </main>
      </div>
    </div>
  );
}
