"use client";

import {
  Bell,
  Bot,
  Database,
  Package,
  Palette,
  Settings,
  Shield,
  UserCog,
  Warehouse,
  Workflow,
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
    key: "notifications",
    label: "Thông báo",
    description: "Kênh và lịch gửi",
    group: "Cá nhân",
    icon: Bell,
  },
  {
    key: "warehouse",
    label: "Kho & vị trí",
    description: "Kho, vị trí, phương pháp lưu trữ",
    group: "Nghiệp vụ kho",
    icon: Warehouse,
  },
  {
    key: "products",
    label: "Sản phẩm & mã hàng",
    description: "Mã hàng, danh mục, đơn vị tính",
    group: "Nghiệp vụ kho",
    icon: Package,
  },
  {
    key: "workflow",
    label: "Luồng xử lý",
    description: "Tự động hóa và phê duyệt",
    group: "Nghiệp vụ kho",
    icon: Workflow,
  },
  {
    key: "ai",
    label: "Trợ lý thông minh",
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
  {
    key: "data",
    label: "Dữ liệu hệ thống",
    description: "Xuất nhập, múi giờ, lưu trữ",
    group: "Quản trị hệ thống",
    icon: Database,
  },
] as const satisfies Array<{
  key: SettingsTab;
  label: string;
  description: string;
  group: string;
  icon: typeof UserCog;
}>;

const tabGroups = ["Cá nhân", "Nghiệp vụ kho", "Quản trị hệ thống"] as const;

const tabDetails: Record<SettingsTab, { title: string; description: string }> = {
  personal: {
    title: "Hồ sơ người dùng",
    description: "Quản lý thông tin cá nhân và điều hướng đến hồ sơ tài khoản.",
  },
  appearance: {
    title: "Giao diện hệ thống",
    description: "Thiết lập chế độ màu, mật độ hiển thị, ngôn ngữ và định dạng ngày.",
  },
  notifications: {
    title: "Thông báo vận hành",
    description: "Kiểm soát kênh thông báo, lịch gửi báo cáo và cảnh báo quan trọng.",
  },
  warehouse: {
    title: "Kho & vị trí lưu trữ",
    description: "Cấu hình kho, vị trí và phương pháp vận hành vị trí.",
  },
  products: {
    title: "Sản phẩm & mã hàng",
    description: "Thiết lập mã hàng, danh mục, đơn vị tính và cảnh báo sản phẩm.",
  },
  workflow: {
    title: "Luồng xử lý nghiệp vụ",
    description: "Quản lý tự động hóa, phê duyệt, cảnh báo và reorder.",
  },
  ai: {
    title: "Cấu hình trợ lý thông minh",
    description: "Quản lý nhà cung cấp và khóa kết nối dùng cho trợ lý đám mây.",
  },
  security: {
    title: "Bảo mật & phân quyền",
    description: "Quản lý mật khẩu, quyền truy cập và nhật ký kiểm toán.",
  },
  data: {
    title: "Dữ liệu hệ thống",
    description: "Cấu hình dữ liệu, múi giờ và các thiết lập lưu trữ.",
  },
};

export default function SettingsPage() {
  const {
    activeTab,
    setActiveTab,
    activeSubTab,
    setActiveSubTab,
    activeWarehouseSubTab,
    setActiveWarehouseSubTab,
    activeProductsSubTab,
    setActiveProductsSubTab,
    activeWorkflowSubTab,
    setActiveWorkflowSubTab,
    appearance,
    notificationData,
    emergencyPhone,
    dailyReportTime,
    weeklyReportDay,
    handleToggleNotification,
    gotoProfile,
    updateAppearance,
    setEmergencyPhone,
    setDailyReportTime,
    setWeeklyReportDay,
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
            <Settings className="h-4 w-4 text-primary" />
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
                              "mt-0.5 h-4 w-4 shrink-0",
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
          <section className="rounded-lg border border-border bg-card px-4 py-4 shadow-sm sm:px-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ActiveIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-foreground">{activeDetails.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{activeDetails.description}</p>
              </div>
            </div>
          </section>

          <SettingsContent
            activeTab={activeTab}
            activeSubTab={activeSubTab}
            activeWarehouseSubTab={activeWarehouseSubTab}
            activeProductsSubTab={activeProductsSubTab}
            activeWorkflowSubTab={activeWorkflowSubTab}
            appearance={appearance}
            notificationData={notificationData}
            emergencyPhone={emergencyPhone}
            dailyReportTime={dailyReportTime}
            weeklyReportDay={weeklyReportDay}
            handleToggleNotification={handleToggleNotification}
            gotoProfile={gotoProfile}
            updateAppearance={updateAppearance}
            setEmergencyPhone={setEmergencyPhone}
            setDailyReportTime={setDailyReportTime}
            setWeeklyReportDay={setWeeklyReportDay}
            setActiveSubTab={setActiveSubTab}
            setActiveWarehouseSubTab={setActiveWarehouseSubTab}
            setActiveProductsSubTab={setActiveProductsSubTab}
            setActiveWorkflowSubTab={setActiveWorkflowSubTab}
          />
        </main>
      </div>
    </div>
  );
}
