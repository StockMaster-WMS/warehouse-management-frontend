"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  UserCog, Database, Bell, Palette, Sun, Moon, Monitor, ArrowRight,
  Settings, Zap, Layout, Eye, Sparkles, AlertCircle, Languages,
  CheckCircle2, Warehouse, Package, Workflow, Shield, MapPin, 
  Ruler, Hash, AlertTriangle, Clock, Users, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { NotificationChannelSection } from "@/components/settings/notification-channel-section";
import { SettingsSubTabNav } from "@/components/settings/settings-sub-tab-nav";
import { ToggleOptionRow } from "@/components/settings/toggle-option-row";

const tabs = [
  { key: "personal", label: "Cá nhân", icon: UserCog },
  { key: "notifications", label: "Thông báo", icon: Bell },
  { key: "appearance", label: "Giao diện", icon: Palette },
  { key: "warehouse", label: "Kho & Vị trí", icon: Warehouse },
  { key: "products", label: "Sản phẩm", icon: Package },
  { key: "workflow", label: "Quy trình", icon: Workflow },
  { key: "security", label: "Bảo mật", icon: Shield },
  { key: "data", label: "Dữ liệu", icon: Database },
] as const;

// === THÊM SUB-TABS CHO PHẦN THÔNG BÁO ===
const notificationSubTabs = [
  { key: "email", label: "Email" },
  { key: "push", label: "Push" },
  { key: "sms", label: "SMS" },
  { key: "schedule", label: "Lịch trình" },
] as const;

const appearanceSubTabs = [
  { key: "theme", label: "Chế độ" },
  { key: "color", label: "Màu sắc" },
  { key: "density", label: "Mật độ" },
  { key: "fontSize", label: "Chữ" },
  { key: "extra", label: "Khác" },
] as const;

const warehouseSubTabs = [
  { key: "warehouses", label: "Danh sách kho" },
  { key: "locations", label: "Vị trí lưu trữ" },
  { key: "methods", label: "Phương pháp quản lý" },
] as const;

const productsSubTabs = [
  { key: "sku", label: "Mã SKU" },
  { key: "categories", label: "Danh mục" },
  { key: "units", label: "Đơn vị tính" },
  { key: "attributes", label: "Thuộc tính" },
  { key: "alerts", label: "Cảnh báo tồn kho" },
] as const;

const workflowSubTabs = [
  { key: "automation", label: "Tự động hóa" },
  { key: "approval", label: "Phê duyệt" },
  { key: "alerts", label: "Cảnh báo" },
  { key: "reorder", label: "Đặt hàng lại" },
] as const;

type SettingsTab = (typeof tabs)[number]["key"];
type NotificationSubTab = (typeof notificationSubTabs)[number]["key"];
type AppearanceSubTab = (typeof appearanceSubTabs)[number]["key"];
type WarehouseSubTab = (typeof warehouseSubTabs)[number]["key"];
type ProductsSubTab = (typeof productsSubTabs)[number]["key"];
type WorkflowSubTab = (typeof workflowSubTabs)[number]["key"];
type ThemeType = "light" | "dark" | "auto";
type ColorType = "indigo" | "blue" | "emerald" | "purple" | "rose" | "amber";
type DensityType = "compact" | "comfortable" | "spacious";
type SidebarType = "auto" | "expanded" | "collapsed";
type LocaleType = "vi" | "en";
type DateFormatType = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";

interface AppearanceSettings {
  theme: ThemeType;
  color: ColorType;
  fontSize: number;
  density: DensityType;
  sidebar: SidebarType;
  locale: LocaleType;
  rowsPerPage: number;
  dateFormat: DateFormatType;
  animations: boolean;
  tooltip: boolean;
  performance: boolean;
  shortcuts: boolean;
}

const defaultAppearanceSettings: AppearanceSettings = {
  theme: "light",
  color: "indigo",
  fontSize: 14,
  density: "comfortable",
  sidebar: "auto",
  locale: "vi",
  rowsPerPage: 20,
  dateFormat: "DD/MM/YYYY",
  animations: true,
  tooltip: true,
  performance: false,
  shortcuts: true,
};

// Mock data types cho Notifications (giữ nguyên)
interface NotificationItem {
  id: string;
  key: string;
  label: string;
  description: string;
  isEnabled: boolean;
  isUrgent: boolean;
  channel: "email" | "push" | "sms";
}

interface NotificationSetting {
  channelId: string;
  channelName: string;
  items: NotificationItem[];
}

// Mock data cho Notifications (giữ nguyên)
const mockNotificationData: NotificationSetting[] = [
  {
    channelId: "email",
    channelName: "Thông báo qua Email",
    items: [
      {
        id: "1",
        key: "low_stock_alert",
        label: "Cảnh báo tồn kho thấp",
        description: "Khi sản phẩm dưới mức tồn kho tối thiểu",
        isEnabled: true,
        isUrgent: true,
        channel: "email",
      },
      {
        id: "2",
        key: "new_inbound",
        label: "Thông báo nhập kho mới",
        description: "Khi có phiếu nhập hàng được tạo",
        isEnabled: true,
        isUrgent: false,
        channel: "email",
      },
      {
        id: "3",
        key: "outbound_notification",
        label: "Thông báo xuất kho",
        description: "Khi có đơn hàng xuất kho được xử lý",
        isEnabled: true,
        isUrgent: false,
        channel: "email",
      },
      {
        id: "4",
        key: "expiry_alert",
        label: "Cảnh báo hết hạn",
        description: "Khi sản phẩm sắp hết hạn sử dụng",
        isEnabled: true,
        isUrgent: true,
        channel: "email",
      },
      {
        id: "5",
        key: "weekly_report",
        label: "Báo cáo tồn kho hàng tuần",
        description: "Tóm tắt tồn kho và hoạt động hàng tuần",
        isEnabled: false,
        isUrgent: false,
        channel: "email",
      },
      {
        id: "6",
        key: "security_alert",
        label: "Cảnh báo bảo mật",
        description: "Đăng nhập bất thường, thay đổi quyền",
        isEnabled: true,
        isUrgent: true,
        channel: "email",
      },
    ],
  },
  {
    channelId: "push",
    channelName: "Thông báo đẩy trong ứng dụng",
    items: [
      {
        id: "7",
        key: "desktop_notification",
        label: "Thông báo desktop",
        description: "Hiển thị popup trên màn hình desktop",
        isEnabled: true,
        isUrgent: false,
        channel: "push",
      },
      {
        id: "8",
        key: "notification_sound",
        label: "Âm thanh thông báo",
        description: "Phát âm thanh khi có thông báo mới",
        isEnabled: false,
        isUrgent: false,
        channel: "push",
      },
      {
        id: "9",
        key: "device_vibration",
        label: "Rung thiết bị",
        description: "Rung thiết bị di động (nếu hỗ trợ)",
        isEnabled: true,
        isUrgent: false,
        channel: "push",
      },
      {
        id: "10",
        key: "urgent_notification",
        label: "Thông báo khẩn cấp",
        description: "Luôn hiển thị thông báo khẩn cấp",
        isEnabled: true,
        isUrgent: true,
        channel: "push",
      },
    ],
  },
  {
    channelId: "sms",
    channelName: "Thông báo khẩn cấp qua SMS",
    items: [
      {
        id: "11",
        key: "system_emergency",
        label: "Cảnh báo khẩn cấp hệ thống",
        description: "Hệ thống ngừng hoạt động, lỗi nghiêm trọng",
        isEnabled: true,
        isUrgent: true,
        channel: "sms",
      },
      {
        id: "12",
        key: "security_emergency",
        label: "Cảnh báo bảo mật",
        description: "Đăng nhập bất thường, thay đổi quyền quan trọng",
        isEnabled: true,
        isUrgent: true,
        channel: "sms",
      },
      {
        id: "13",
        key: "critical_stock",
        label: "Tồn kho khẩn cấp",
        description: "Sản phẩm quan trọng hết hàng hoàn toàn",
        isEnabled: true,
        isUrgent: true,
        channel: "sms",
      },
    ],
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>("personal");
  const [activeSubTab, setActiveSubTab] = useState<NotificationSubTab>("email"); // ← THÊM STATE CHO SUB-TAB
  const [activeAppearanceSubTab, setActiveAppearanceSubTab] = useState<AppearanceSubTab>("theme");
  const [activeWarehouseSubTab, setActiveWarehouseSubTab] = useState<WarehouseSubTab>("warehouses");
  const [activeProductsSubTab, setActiveProductsSubTab] = useState<ProductsSubTab>("sku");
  const [activeWorkflowSubTab, setActiveWorkflowSubTab] = useState<WorkflowSubTab>("automation");

  const [appearance, setAppearance] = useState<AppearanceSettings>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("appearanceSettings");
      if (saved) {
        try {
          return JSON.parse(saved) as AppearanceSettings;
        } catch (e) {
          console.error("Failed to parse appearance settings:", e);
        }
      }
    }
    return defaultAppearanceSettings;
  });
  const [notificationData, setNotificationData] = useState<NotificationSetting[]>(mockNotificationData);
  const [emergencyPhone, setEmergencyPhone] = useState("+84 123 456 789");
  const [dailyReportTime, setDailyReportTime] = useState("18:00");
  const [weeklyReportDay, setWeeklyReportDay] = useState("friday");

  // Handler toggle thông báo (đã di chuyển ra ngoài để dùng chung cho tất cả sub-tab)
  const handleToggleNotification = useCallback((itemId: string) => {
    setNotificationData((prevData) =>
      prevData.map((channel) => ({
        ...channel,
        items: channel.items.map((item) =>
          item.id === itemId ? { ...item, isEnabled: !item.isEnabled } : item
        ),
      }))
    );
  }, []);

  // Apply appearance settings to document
  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;

    if (appearance.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    root.setAttribute("data-density", appearance.density);
    root.setAttribute("data-sidebar", appearance.sidebar);
    root.style.fontSize = `${appearance.fontSize}px`;

    const primaryColorMap: Record<ColorType, string> = {
      indigo: "#4f46e5",
      blue: "#3b82f6",
      emerald: "#10b981",
      purple: "#8b5cf6",
      rose: "#f43f5e",
      amber: "#f59e0b",
    };

    root.style.setProperty("--primary", primaryColorMap[appearance.color]);
    root.style.setProperty("--primary-color", primaryColorMap[appearance.color]);
    root.style.setProperty("--date-format", appearance.dateFormat);
    root.style.setProperty("--lang", appearance.locale);

    localStorage.setItem("appearanceSettings", JSON.stringify(appearance));
  }, [appearance]);

  const updateAppearance = useCallback(
    (key: keyof AppearanceSettings, value: AppearanceSettings[keyof AppearanceSettings]) => {
      setAppearance((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const content = useMemo(() => {
    if (activeTab === "personal") {
      return (
        <div key={activeTab} className="space-y-6">
          {/* Link to Profile Page */}
          <button
            onClick={() => router.push("/profile")}
            className="w-full rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 p-4 text-left transition-all duration-200 hover:border-indigo-400 hover:shadow-md active:scale-95 dark:border-indigo-600/40 dark:bg-indigo-950/20 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/30"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-indigo-600" />
                  <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                    Xem trang cá nhân
                  </p>
                </div>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 ml-7">
                  Chỉnh sửa thông tin chi tiết hơn trên trang cá nhân của bạn
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            </div>
          </button>

          {/* Personal Info Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin cá nhân nhanh</CardTitle>
              <CardDescription>Cập nhật thông tin cơ bản trên trang cài đặt</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="full-name" className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <UserCog className="h-4 w-4 text-indigo-600" />
                    Họ tên
                  </label>
                  <Input 
                    id="full-name" 
                    defaultValue="An Nguyen"
                    className="rounded-lg border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <Bell className="h-4 w-4 text-indigo-600" />
                    Email
                  </label>
                  <Input 
                    id="email" 
                    defaultValue="an.nguyen@stockmaster.vn" 
                    type="email"
                    className="rounded-lg border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label htmlFor="warehouse-name" className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <Database className="h-4 w-4 text-indigo-600" />
                    Tên kho mặc định
                  </label>
                  <Input 
                    id="warehouse-name" 
                    defaultValue="Kho tong mien Nam"
                    className="rounded-lg border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (activeTab === "notifications") {
      return (
        <div key={activeTab} className="space-y-6">
          {/* === THANH NAVBAR SUB-TABS (phần thông báo được chia thành từng phần) === */}
          <SettingsSubTabNav
            tabs={notificationSubTabs}
            activeTab={activeSubTab}
            onTabChange={setActiveSubTab}
          />

          {/* Nội dung theo sub-tab */}
          {activeSubTab === "email" && notificationData[0] && (
            <NotificationChannelSection
              title={notificationData[0].channelName}
              items={notificationData[0].items}
              onToggle={handleToggleNotification}
            />
          )}

          {activeSubTab === "push" && notificationData[1] && (
            <NotificationChannelSection
              title={notificationData[1].channelName}
              items={notificationData[1].items}
              onToggle={handleToggleNotification}
            />
          )}

          {activeSubTab === "sms" && notificationData[2] && (
            <NotificationChannelSection
              title={notificationData[2].channelName}
              items={notificationData[2].items}
              onToggle={handleToggleNotification}
              showWarning
              warningText="SMS chỉ dành cho trường hợp khẩn cấp. SMS sẽ được gửi cho các trường hợp quan trọng như hệ thống ngừng hoạt động, cảnh báo bảo mật, hoặc tồn kho khẩn cấp."
              emergencyPhone={emergencyPhone}
              onEmergencyPhoneChange={setEmergencyPhone}
              showEmergencyPhoneInput
            />
          )}

          {activeSubTab === "schedule" && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Lịch gửi báo cáo
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="daily-report"
                    className="text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Báo cáo hàng ngày
                  </label>
                  <Input
                    id="daily-report"
                    type="time"
                    value={dailyReportTime}
                    onChange={(e) => setDailyReportTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="weekly-report"
                    className="text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Báo cáo hàng tuần
                  </label>
                  <select
                    id="weekly-report"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={weeklyReportDay}
                    onChange={(e) => setWeeklyReportDay(e.target.value)}
                  >
                    <option value="monday">Thứ Hai</option>
                    <option value="tuesday">Thứ Ba</option>
                    <option value="wednesday">Thứ Tư</option>
                    <option value="thursday">Thứ Năm</option>
                    <option value="friday">Thứ Sáu</option>
                    <option value="saturday">Thứ Bảy</option>
                    <option value="sunday">Chủ Nhật</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === "appearance") {
      return (
        <div key={activeTab} className="space-y-8">
          {/* Theme Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Chế độ giao diện</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Chọn chế độ hiển thị phù hợp với bạn</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { id: "light", label: "Nhẹ", icon: Sun, desc: "Nền sáng, chữ tối" },
                { id: "dark", label: "Tối", icon: Moon, desc: "Nền tối, chữ sáng" },
                { id: "auto", label: "Tự động", icon: Monitor, desc: "Theo hệ thống" },
              ].map((item) => {
                const ThemeIcon = item.icon;
                return (
                <button
                  key={item.id}
                  onClick={() => updateAppearance("theme", item.id as ThemeType)}
                  className={`group rounded-xl border-2 p-4 text-left transition-all duration-200 hover:shadow-md active:scale-95 ${
                    appearance.theme === item.id
                      ? "border-indigo-500 bg-indigo-50/80 shadow-md dark:border-indigo-400 dark:bg-indigo-950/40"
                      : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-indigo-600/50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <ThemeIcon className={`h-5 w-5 mt-1 transition-all ${appearance.theme === item.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400"}`} />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{item.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.desc}</p>
                    </div>
                  </div>
                </button>
              );
            })}
            </div>
          </div>

          <Separator className="dark:bg-slate-700" />

          {/* Color Scheme */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Màu sắc chính</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Chọn màu chủ đạo cho ứng dụng</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-6">
              {[
                { id: "indigo", name: "Indigo", color: "bg-indigo-600" },
                { id: "blue", name: "Blue", color: "bg-blue-600" },
                { id: "emerald", name: "Emerald", color: "bg-emerald-600" },
                { id: "purple", name: "Purple", color: "bg-purple-600" },
                { id: "rose", name: "Rose", color: "bg-rose-600" },
                { id: "amber", name: "Amber", color: "bg-amber-600" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => updateAppearance("color", item.id as ColorType)}
                  className={`group rounded-xl border-2 p-3 transition-all duration-200 hover:scale-105 active:scale-95 ${
                    appearance.color === item.id
                      ? "border-slate-900 shadow-lg dark:border-white"
                      : "border-slate-200 hover:border-indigo-300 dark:border-slate-700 dark:hover:border-indigo-600/50"
                  }`}
                >
                  <div className={`h-12 w-full rounded-lg ${item.color} mb-2 shadow-md transition-transform group-hover:scale-110`} />
                  <p className="text-xs font-medium text-center text-slate-700 dark:text-slate-200">{item.name}</p>
                </button>
              ))}
            </div>
          </div>

          <Separator className="dark:bg-slate-700" />

          {/* Language + Rows + Date Format */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Ngôn ngữ và hiển thị</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Cập nhật cài đặt cơ bản cho trải nghiệm cá nhân</p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Ngôn ngữ giao diện</label>
                <select
                  value={appearance.locale}
                  onChange={(e) => updateAppearance("locale", e.target.value as LocaleType)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Số dòng mỗi trang</label>
                <select
                  value={appearance.rowsPerPage}
                  onChange={(e) => updateAppearance("rowsPerPage", Number(e.target.value))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Định dạng ngày</label>
                <select
                  value={appearance.dateFormat}
                  onChange={(e) => updateAppearance("dateFormat", e.target.value as DateFormatType)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </div>

          <Separator className="dark:bg-slate-700" />

          {/* Density */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Layout className="h-5 w-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Mật độ hiển thị</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Điều chỉnh khoảng cách và kích cỡ phần tử</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { id: "compact", label: "Gọn", desc: "Hiển thị nhiều nội dung" },
                { id: "comfortable", label: "Thoải mái", desc: "Cân bằng" },
                { id: "spacious", label: "Rộng rãi", desc: "Ít nội dung, dễ đọc" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => updateAppearance("density", item.id as DensityType)}
                  className={`rounded-xl border-2 p-4 text-left transition-all duration-200 hover:shadow-md active:scale-95 ${
                    appearance.density === item.id
                      ? "border-indigo-500 bg-indigo-50/80 shadow-md dark:border-indigo-400 dark:bg-indigo-950/40"
                      : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-indigo-600/50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <p className="font-semibold text-slate-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <Separator className="dark:bg-slate-700" />

          {/* Font Size */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Kích thước chữ</h3>
              </div>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{appearance.fontSize}px</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Điều chỉnh kích thước chữ để dễ đọc hơn</p>
            <input
              type="range"
              min="12"
              max="18"
              step="1"
              value={appearance.fontSize}
              onChange={(e) => updateAppearance("fontSize", parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:bg-slate-700"
            />
            <Card className="bg-slate-50 dark:bg-slate-800/50">
              <CardContent className="p-4">
                <p style={{ fontSize: `${appearance.fontSize}px` }} className="text-slate-700 dark:text-slate-300 text-center font-medium">
                  Đây là ví dụ về kích thước chữ hiện tại
                </p>
              </CardContent>
            </Card>
          </div>

          <Separator className="dark:bg-slate-700" />

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Layout className="h-5 w-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Thanh bên</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Cấu hình cách hiển thị menu thanh bên</p>
            <div className="grid gap-3">
              {[
                { id: "auto", label: "Tự động", desc: "Thu gọn khi đủ không gian" },
                { id: "expanded", label: "Luôn mở rộng", desc: "Hiển thị toàn bộ menu" },
                { id: "collapsed", label: "Luôn thu gọn", desc: "Chỉ hiển thị biểu tượng" },
              ].map((item) => (
                <label
                  key={item.id}
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer ${
                    appearance.sidebar === item.id
                      ? "border-indigo-500 bg-indigo-50/80 dark:border-indigo-400 dark:bg-indigo-950/40"
                      : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-indigo-600/50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="sidebar"
                    checked={appearance.sidebar === item.id}
                    onChange={() => updateAppearance("sidebar", item.id as SidebarType)}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{item.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Separator className="dark:bg-slate-700" />

          {/* Additional Options */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Tùy chọn khác</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Bật/tắt các tính năng bổ sung</p>
            <div className="space-y-2">
              {[
                { key: "animations", label: "Hiệu ứng chuyển tiếp", desc: "Bật các hiệu ứng động khi chuyển trang", icon: Sparkles },
                { key: "tooltip", label: "Hiển thị tooltip", desc: "Gợi ý khi hover chuột", icon: AlertCircle },
                { key: "performance", label: "Thực hiện thao tác nhanh", desc: "Cải thiện hiệu suất", icon: Zap },
                { key: "shortcuts", label: "Hiện phím tắt", desc: "Hiển thị phím tắt bàn phím", icon: Settings },
              ].map((item) => (
                <ToggleOptionRow
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  description={item.desc}
                  checked={appearance[item.key as keyof AppearanceSettings] as boolean}
                  onCheckedChange={(checked) =>
                    updateAppearance(item.key as keyof AppearanceSettings, !!checked)
                  }
                />
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "warehouse") {
      return (
        <div key={activeTab} className="space-y-6">
          {/* Warehouse Sub-tabs */}
          <SettingsSubTabNav
            tabs={warehouseSubTabs}
            activeTab={activeWarehouseSubTab}
            onTabChange={setActiveWarehouseSubTab}
          />

          {/* Warehouse Content */}
          {activeWarehouseSubTab === "warehouses" && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Danh sách kho
              </h3>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quản lý kho</CardTitle>
                  <CardDescription>Thêm, sửa, xóa thông tin kho</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                        <Warehouse className="h-4 w-4 text-indigo-600" />
                        Tên kho mặc định
                      </label>
                      <Input defaultValue="Kho chính" />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                        <MapPin className="h-4 w-4 text-indigo-600" />
                        Địa chỉ kho
                      </label>
                      <Input defaultValue="123 Đường ABC, Quận 1, TP.HCM" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeWarehouseSubTab === "locations" && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Vị trí lưu trữ
              </h3>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cấu hình vị trí</CardTitle>
                  <CardDescription>Thiết lập kệ, ô, khu vực lưu trữ</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                        <Hash className="h-4 w-4 text-indigo-600" />
                        Format mã vị trí
                      </label>
                      <Input defaultValue="A-01-01" placeholder="Ví dụ: A-01-01" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Số kệ tối đa</label>
                      <Input type="number" defaultValue="10" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Số tầng/kệ</label>
                      <Input type="number" defaultValue="5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeWarehouseSubTab === "methods" && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Phương pháp quản lý kho
              </h3>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Chiến lược xuất kho</CardTitle>
                  <CardDescription>Chọn phương pháp quản lý hàng tồn kho</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    {[
                      { id: "fifo", label: "FIFO (First In, First Out)", desc: "Xuất hàng cũ trước" },
                      { id: "lifo", label: "LIFO (Last In, First Out)", desc: "Xuất hàng mới trước" },
                      { id: "fefo", label: "FEFO (First Expired, First Out)", desc: "Xuất hàng gần hết hạn trước" },
                      { id: "average", label: "Average Cost", desc: "Giá trị trung bình" },
                    ].map((method) => (
                      <label key={method.id} className="flex items-center gap-3 rounded-xl border-2 p-4 cursor-pointer border-slate-200 hover:border-indigo-300 dark:border-slate-700 dark:hover:border-indigo-600/50">
                        <input type="radio" name="warehouse-method" defaultChecked={method.id === "fifo"} className="w-4 h-4 accent-indigo-600" />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{method.label}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{method.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === "products") {
      return (
        <div key={activeTab} className="space-y-6">
          {/* Products Sub-tabs */}
          <SettingsSubTabNav
            tabs={productsSubTabs}
            activeTab={activeProductsSubTab}
            onTabChange={setActiveProductsSubTab}
          />

          {/* Products Content */}
          {activeProductsSubTab === "sku" && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Quy tắc mã SKU
              </h3>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tự động tạo SKU</CardTitle>
                  <CardDescription>Cấu hình format mã SKU tự động</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                        <Hash className="h-4 w-4 text-indigo-600" />
                        Format SKU
                      </label>
                      <Input defaultValue="PROD-{CATEGORY}-{NUMBER}" placeholder="Ví dụ: PROD-ELEC-0001" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Số chữ số</label>
                      <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="4">4 chữ số (0001)</option>
                        <option value="6">6 chữ số (000001)</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeProductsSubTab === "categories" && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Danh mục sản phẩm
              </h3>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Danh mục mặc định</CardTitle>
                  <CardDescription>Cấu hình danh mục sản phẩm cơ bản</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                      <Package className="h-4 w-4 text-indigo-600" />
                      Danh mục mặc định cho sản phẩm mới
                    </label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="general">Tổng hợp</option>
                      <option value="electronics">Điện tử</option>
                      <option value="clothing">Quần áo</option>
                      <option value="food">Thực phẩm</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeProductsSubTab === "units" && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Đơn vị tính
              </h3>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Đơn vị đo lường</CardTitle>
                  <CardDescription>Cấu hình đơn vị tính cho sản phẩm</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Đơn vị chính</label>
                      <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="piece">Cái</option>
                        <option value="kg">Kg</option>
                        <option value="box">Hộp</option>
                        <option value="lot">Lô</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Đơn vị phụ</label>
                      <Input placeholder="Ví dụ: Bao, Gói..." />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeProductsSubTab === "attributes" && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Thuộc tính sản phẩm
              </h3>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Thuộc tính tùy chỉnh</CardTitle>
                  <CardDescription>Cấu hình thuộc tính cho sản phẩm (size, màu sắc, hạn sử dụng...)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {[
                      { name: "Kích thước", enabled: true },
                      { name: "Màu sắc", enabled: true },
                      { name: "Hạn sử dụng", enabled: true },
                      { name: "Trọng lượng", enabled: false },
                      { name: "Xuất xứ", enabled: false },
                    ].map((attr) => (
                      <label key={attr.name} className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                        <span className="font-medium text-slate-900 dark:text-white">{attr.name}</span>
                        <Switch defaultChecked={attr.enabled} />
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeProductsSubTab === "alerts" && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Cảnh báo tồn kho
              </h3>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ngưỡng cảnh báo</CardTitle>
                  <CardDescription>Cấu hình mức tồn kho tối thiểu, tối đa và điểm đặt hàng lại</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        Tồn kho tối thiểu
                      </label>
                      <Input type="number" defaultValue="10" />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        Điểm đặt hàng lại
                      </label>
                      <Input type="number" defaultValue="20" />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                        <AlertTriangle className="h-4 w-4 text-blue-600" />
                        Tồn kho tối đa
                      </label>
                      <Input type="number" defaultValue="1000" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === "workflow") {
      return (
        <div key={activeTab} className="space-y-6">
          {/* Workflow Sub-tabs */}
          <SettingsSubTabNav
            tabs={workflowSubTabs}
            activeTab={activeWorkflowSubTab}
            onTabChange={setActiveWorkflowSubTab}
          />

          {/* Workflow Content */}
          {activeWorkflowSubTab === "automation" && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Tự động hóa quy trình
              </h3>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tự động tạo phiếu</CardTitle>
                  <CardDescription>Cấu hình tự động tạo phiếu nhập/xuất</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <ToggleOptionRow
                      icon={FileText}
                      label="Tự động tạo phiếu nhập khi nhận hàng"
                      description="Tạo phiếu nhập kho ngay khi có đơn đặt hàng được xác nhận"
                      checked={true}
                      onCheckedChange={() => {}}
                    />
                    <ToggleOptionRow
                      icon={FileText}
                      label="Tự động tạo phiếu xuất khi có đơn hàng"
                      description="Tạo phiếu xuất kho ngay khi có đơn hàng online"
                      checked={true}
                      onCheckedChange={() => {}}
                    />
                    <ToggleOptionRow
                      icon={Clock}
                      label="Tự động hoàn tất phiếu sau khi xử lý"
                      description="Đánh dấu phiếu là hoàn tất sau khi tất cả sản phẩm được xử lý"
                      checked={false}
                      onCheckedChange={() => {}}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeWorkflowSubTab === "approval" && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Quy tắc phê duyệt
              </h3>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Workflow phê duyệt</CardTitle>
                  <CardDescription>Cấu hình quy trình phê duyệt cho các thao tác quan trọng</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Phê duyệt phiếu nhập</label>
                      <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="auto">Tự động</option>
                        <option value="manager">Cần phê duyệt của quản lý</option>
                        <option value="admin">Cần phê duyệt của admin</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Phê duyệt phiếu xuất</label>
                      <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="auto">Tự động</option>
                        <option value="manager">Cần phê duyệt của quản lý</option>
                        <option value="admin">Cần phê duyệt của admin</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeWorkflowSubTab === "alerts" && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Cảnh báo hệ thống
              </h3>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cấu hình cảnh báo</CardTitle>
                  <CardDescription>Thiết lập cảnh báo cho các tình huống quan trọng</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <ToggleOptionRow
                      icon={AlertTriangle}
                      label="Cảnh báo hết hàng"
                      description="Thông báo khi sản phẩm hết hàng hoàn toàn"
                      checked={true}
                      onCheckedChange={() => {}}
                    />
                    <ToggleOptionRow
                      icon={AlertTriangle}
                      label="Cảnh báo sắp hết hạn"
                      description="Thông báo khi sản phẩm sắp đến hạn sử dụng"
                      checked={true}
                      onCheckedChange={() => {}}
                    />
                    <ToggleOptionRow
                      icon={AlertTriangle}
                      label="Cảnh báo tồn kho thấp"
                      description="Thông báo khi tồn kho dưới mức tối thiểu"
                      checked={true}
                      onCheckedChange={() => {}}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeWorkflowSubTab === "reorder" && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Tự động đặt hàng lại
              </h3>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Reorder Point</CardTitle>
                  <CardDescription>Cấu hình tự động tạo đơn đặt hàng khi tồn kho thấp</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <ToggleOptionRow
                      icon={Package}
                      label="Bật tự động reorder"
                      description="Tự động tạo đơn đặt hàng khi đạt ngưỡng reorder point"
                      checked={true}
                      onCheckedChange={() => {}}
                    />
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Số lượng đặt hàng mặc định</label>
                      <Input type="number" defaultValue="50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Nhà cung cấp mặc định</label>
                      <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="supplier1">Nhà cung cấp A</option>
                        <option value="supplier2">Nhà cung cấp B</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === "security") {
      return (
        <div key={activeTab} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quyền truy cập</CardTitle>
              <CardDescription>Cấu hình quyền hạn theo vai trò người dùng</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <Users className="h-4 w-4 text-indigo-600" />
                    Vai trò mặc định cho nhân viên mới
                  </label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="staff">Nhân viên kho</option>
                    <option value="manager">Quản lý kho</option>
                    <option value="viewer">Người xem</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit Log</CardTitle>
              <CardDescription>Lịch sử hoạt động và thay đổi hệ thống</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <ToggleOptionRow
                  icon={FileText}
                  label="Bật audit log"
                  description="Ghi lại tất cả thay đổi quan trọng trong hệ thống"
                  checked={true}
                  onCheckedChange={() => {}}
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Thời gian lưu audit log</label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="90">90 ngày</option>
                    <option value="180">180 ngày</option>
                    <option value="365">1 năm</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div key={activeTab} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Cấu hình dữ liệu</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý thời gian lưu trữ và múi giờ hệ thống</p>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Log hệ thống</CardTitle>
              <CardDescription>Cấu hình thời gian lưu trữ nhật ký hoạt động</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="retention" className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  Số ngày lưu log
                </label>
                <Input 
                  id="retention" 
                  type="number" 
                  defaultValue="90"
                  className="rounded-lg border border-slate-200 dark:border-slate-700"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  🔔 Log cũ hơn thời gian này sẽ được tự động xóa
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Múi giờ & Khu vực</CardTitle>
              <CardDescription>Cấu hình múi giờ cho toàn bộ hệ thống</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="timezone" className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <Settings className="h-4 w-4 text-indigo-600" />
                  Múi giờ hệ thống
                </label>
                <select
                  id="timezone"
                  defaultValue="Asia/Ho_Chi_Minh"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh</option>
                  <option value="Asia/Bangkok">Asia/Bangkok</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="UTC">UTC</option>
                </select>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ℹ️ Múi giờ sẽ áp dụng cho toàn bộ hệ thống
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }, [
    activeTab,
    activeSubTab,
    activeAppearanceSubTab,
    activeWarehouseSubTab,
    activeProductsSubTab,
    activeWorkflowSubTab,
    appearance,
    updateAppearance,
    notificationData,
    emergencyPhone,
    dailyReportTime,
    weeklyReportDay,
    handleToggleNotification,
    router,
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cài đặt hệ thống"
        description="Tùy chỉnh cấu hình hoạt động của kho và quản lý ứng dụng."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="h-4 w-4 text-indigo-600" />
                Danh mục
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {tabs.map((item, index) => (
                  <div key={item.key}>
                    <button
                      type="button"
                      onClick={() => setActiveTab(item.key)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold transition-all duration-150 ${
                        activeTab === item.key
                          ? "border-l-4 border-indigo-600 bg-indigo-50/80 text-indigo-600 dark:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-400"
                          : "border-l-4 border-transparent text-slate-700 hover:bg-slate-50/80 dark:text-slate-300 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </button>
                    {index < tabs.length - 1 && <Separator className="my-0" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {activeTab === "personal" && <UserCog className="h-5 w-5 text-indigo-600" />}
                  {activeTab === "notifications" && <Bell className="h-5 w-5 text-indigo-600" />}
                  {activeTab === "appearance" && <Palette className="h-5 w-5 text-indigo-600" />}
                  {activeTab === "warehouse" && <Warehouse className="h-5 w-5 text-indigo-600" />}
                  {activeTab === "products" && <Package className="h-5 w-5 text-indigo-600" />}
                  {activeTab === "workflow" && <Workflow className="h-5 w-5 text-indigo-600" />}
                  {activeTab === "security" && <Shield className="h-5 w-5 text-indigo-600" />}
                  {activeTab === "data" && <Database className="h-5 w-5 text-indigo-600" />}
                  <div>
                    <CardTitle>
                      {activeTab === "personal" && "Thông tin cá nhân"}
                      {activeTab === "notifications" && "Cấu hình thông báo"}
                      {activeTab === "appearance" && "Tùy chỉnh giao diện"}
                      {activeTab === "warehouse" && "Quản lý kho & vị trí"}
                      {activeTab === "products" && "Cài đặt sản phẩm"}
                      {activeTab === "workflow" && "Quy trình nghiệp vụ"}
                      {activeTab === "security" && "Bảo mật & phân quyền"}
                      {activeTab === "data" && "Quản lý dữ liệu"}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {activeTab === "personal" && "Quản lý thông tin cá nhân và cài đặt cơ bản"}
                      {activeTab === "notifications" && "Kiểm soát các kênh thông báo và tần suất"}
                      {activeTab === "appearance" && "Tùy chỉnh giao diện và trải nghiệm người dùng"}
                      {activeTab === "warehouse" && "Cấu hình kho, vị trí lưu trữ và phương pháp quản lý"}
                      {activeTab === "products" && "Thiết lập quy tắc sản phẩm và đơn vị tính"}
                      {activeTab === "workflow" && "Tự động hóa quy trình và cảnh báo hệ thống"}
                      {activeTab === "security" && "Quyền truy cập và audit log"}
                      {activeTab === "data" && "Quản lý dữ liệu và múi giờ hệ thống"}
                    </CardDescription>
                  </div>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Lưu thay đổi
                </Button>
              </div>
            </CardHeader>
            <Separator className="dark:bg-slate-800" />
            <CardContent className="pt-6">
              {content}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}