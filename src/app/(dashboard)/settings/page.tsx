"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserCog, Database, Bell, Palette, Sun, Moon, Monitor, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";

const tabs = [
  { key: "personal", label: "Cá nhân", icon: UserCog },
  { key: "notifications", label: "Thông báo", icon: Bell },
  { key: "appearance", label: "Giao diện", icon: Palette },
  { key: "data", label: "Dữ liệu", icon: Database },
] as const;

type SettingsTab = (typeof tabs)[number]["key"];
type ThemeType = "light" | "dark" | "auto";
type ColorType = "indigo" | "blue" | "emerald" | "purple" | "rose" | "amber";
type DensityType = "compact" | "comfortable" | "spacious";
type SidebarType = "auto" | "expanded" | "collapsed";

interface AppearanceSettings {
  theme: ThemeType;
  color: ColorType;
  fontSize: number;
  density: DensityType;
  sidebar: SidebarType;
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
  animations: true,
  tooltip: true,
  performance: false,
  shortcuts: true,
};

// Mock data types cho Notifications

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

// Mock data cho Notifications
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
        <div className="space-y-6">
          {/* Link to Profile Page */}
          <button
            onClick={() => router.push("/profile")}
            className="w-full rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 p-4 text-left transition-all duration-150 hover:border-indigo-400 hover:bg-indigo-50 dark:border-indigo-600/40 dark:bg-indigo-950/20 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/30"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                  📋 Xem trang cá nhân
                </p>
                <p className="text-xs text-indigo-700 dark:text-indigo-300">
                  Chỉnh sửa thông tin chi tiết hơn trên trang cá nhân của bạn
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </button>

          {/* Personal Info Fields */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Thông Tin Cá Nhân Nhanh
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="full-name" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Họ tên
                </label>
                <Input id="full-name" defaultValue="An Nguyen" />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Email
                </label>
                <Input id="email" defaultValue="an.nguyen@stockmaster.vn" type="email" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="warehouse-name" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tên kho mặc định
                </label>
                <Input id="warehouse-name" defaultValue="Kho tong mien Nam" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "notifications") {
      // Handler to toggle notification
      const handleToggleNotification = (itemId: string) => {
        setNotificationData((prevData) =>
          prevData.map((channel) => ({
            ...channel,
            items: channel.items.map((item) =>
              item.id === itemId ? { ...item, isEnabled: !item.isEnabled } : item
            ),
          }))
        );
      };

      return (
        <div className="space-y-8">
          {/* Email Notifications */}
          {notificationData[0] && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {notificationData[0].channelName}
              </h3>
              <div className="grid gap-3">
                {notificationData[0].items.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-start justify-between rounded-xl border border-slate-200 p-4 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-sm dark:border-slate-700 dark:hover:border-indigo-600/50 dark:hover:bg-indigo-950/20"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {item.label}
                        </span>
                        {item.isUrgent && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400 shadow-sm">
                            Khẩn cấp
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                    </div>
                    <Checkbox
                      checked={item.isEnabled}
                      onCheckedChange={() => handleToggleNotification(item.id)}
                      aria-label={item.label}
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Push Notifications */}
          {notificationData[1] && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {notificationData[1].channelName}
              </h3>
              <div className="grid gap-3">
                {notificationData[1].items.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-sm dark:border-slate-700 dark:hover:border-indigo-600/50 dark:hover:bg-indigo-950/20"
                  >
                    <div className="flex-1 space-y-1">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {item.label}
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                    </div>
                    <Checkbox
                      checked={item.isEnabled}
                      onCheckedChange={() => handleToggleNotification(item.id)}
                      aria-label={item.label}
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* SMS Notifications */}
          {notificationData[2] && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {notificationData[2].channelName}
              </h3>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-800 dark:bg-amber-950/20">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 text-amber-600">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      SMS chỉ dành cho trường hợp khẩn cấp
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      SMS sẽ được gửi cho các trường hợp quan trọng như hệ thống ngừng hoạt động, cảnh báo bảo mật, hoặc tồn kho khẩn cấp.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-3">
                {notificationData[2].items.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-sm dark:border-slate-700 dark:hover:border-indigo-600/50 dark:hover:bg-indigo-950/20"
                  >
                    <div className="flex-1 space-y-1">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {item.label}
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                    </div>
                    <Checkbox
                      checked={item.isEnabled}
                      onCheckedChange={() => handleToggleNotification(item.id)}
                      aria-label={item.label}
                    />
                  </label>
                ))}
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="emergency-phone"
                  className="text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Số điện thoại khẩn cấp
                </label>
                <Input
                  id="emergency-phone"
                  placeholder="+84 xxx xxx xxx"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Số điện thoại nhận SMS khẩn cấp. Có thể nhập nhiều số cách nhau bằng dấu phẩy.
                </p>
              </div>
            </div>
          )}

          {/* Notification Schedule */}
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
        </div>
      );
    }

    if (activeTab === "appearance") {
      return (
        <div className="space-y-10">
          {/* Theme Selection */}
          <div>
            <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Chế độ giao diện</h3>
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
                  className={`rounded-2xl border p-6 text-left transition-all duration-200 hover:shadow-md active:scale-[0.98] ${
                    appearance.theme === item.id
                      ? "border-indigo-500 bg-indigo-50 shadow-lg dark:border-indigo-500 dark:bg-indigo-950/60"
                      : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-indigo-600/50 dark:hover:bg-indigo-950/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <ThemeIcon className={`h-6 w-6 transition-transform duration-200 ${appearance.theme === item.id ? "text-indigo-600" : "text-slate-500 dark:text-slate-300"}`} />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.desc}</p>
                    </div>
                    {appearance.theme === item.id && (
                      <div className="mt-1.5 h-5 w-5 rounded-full border-2 border-indigo-600 bg-indigo-100 dark:border-indigo-400" />
                    )}
                  </div>
                </button>
              );
            })}
            </div>
          </div>

          {/* Color Scheme */}
          <div>
            <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Màu sắc chính</h3>
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
                  className={`group rounded-2xl border-2 p-4 transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-md ${
                    appearance.color === item.id
                      ? "border-slate-900 shadow-lg dark:border-white"
                      : "border-transparent hover:border-indigo-300 dark:hover:border-indigo-600/50"
                  }`}
                >
                  <div className={`h-14 w-full rounded-xl ${item.color} mb-3 shadow-inner transition-transform group-hover:scale-105`} />
                  <p className="text-sm font-medium text-center">{item.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Density */}
          <div>
            <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Mật độ hiển thị</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { id: "compact", label: "Gọn", desc: "Hiển thị nhiều nội dung" },
                { id: "comfortable", label: "Thoải mái", desc: "Cân bằng" },
                { id: "spacious", label: "Rộng rãi", desc: "Ít nội dung, dễ đọc" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => updateAppearance("density", item.id as DensityType)}
                  className={`rounded-2xl border p-5 text-left transition-all duration-200 hover:shadow-sm active:scale-[0.98] ${
                    appearance.density === item.id
                      ? "border-indigo-500 bg-indigo-50 shadow-lg dark:border-indigo-500 dark:bg-indigo-950/60"
                      : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-indigo-600/50"
                  }`}
                >
                  <p className="font-semibold">{item.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <div className="mb-4 flex justify-between items-baseline">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Kích thước chữ</h3>
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{appearance.fontSize}px</span>
            </div>
            <input
              type="range"
              min="12"
              max="18"
              step="1"
              value={appearance.fontSize}
              onChange={(e) => updateAppearance("fontSize", parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="mt-6 rounded-2xl border bg-slate-50 p-6 text-center shadow-sm dark:bg-slate-900">
              <p style={{ fontSize: `${appearance.fontSize}px` }} className="text-slate-700 dark:text-slate-300">
                Đây là ví dụ về kích thước chữ hiện tại
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Thanh bên</h3>
            <div className="grid gap-4">
              {[
                { id: "auto", label: "Tự động", desc: "Thu gọn khi đủ không gian" },
                { id: "expanded", label: "Luôn mở rộng", desc: "Hiển thị toàn bộ menu" },
                { id: "collapsed", label: "Luôn thu gọn", desc: "Chỉ hiển thị biểu tượng" },
              ].map((item) => (
                <label
                  key={item.id}
                  className={`flex items-center justify-between rounded-2xl border p-5 transition-all duration-200 cursor-pointer hover:shadow-sm ${
                    appearance.sidebar === item.id
                      ? "border-indigo-500 bg-indigo-50 shadow-lg dark:bg-indigo-950/60"
                      : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-indigo-600/50"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">{item.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                  <input
                    type="radio"
                    name="sidebar"
                    checked={appearance.sidebar === item.id}
                    onChange={() => updateAppearance("sidebar", item.id as SidebarType)}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Additional Options */}
          <div>
            <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Tùy chọn khác</h3>
            <div className="space-y-3">
              {[
                { key: "animations", label: "Hiệu ứng chuyển tiếp mượt", desc: "Bật các hiệu ứng động khi chuyển trang" },
                { key: "tooltip", label: "Hiển thị tooltip", desc: "Gợi ý khi hover chuột" },
                { key: "performance", label: "Thực hiện thao tác nhanh", desc: "Cải thiện hiệu suất" },
                { key: "shortcuts", label: "Hiện phím tắt", desc: "Hiển thị phím tắt bàn phím" },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between rounded-2xl border p-5 transition-all hover:shadow-sm hover:border-indigo-300 hover:bg-indigo-50/30 dark:hover:border-indigo-600/50 dark:hover:bg-indigo-950/20"
                >
                  <div>
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                  <Checkbox
                    checked={appearance[item.key as keyof AppearanceSettings] as boolean}
                    onCheckedChange={(checked) => updateAppearance(item.key as keyof AppearanceSettings, !!checked)}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="retention" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Số ngày lưu log
          </label>
          <Input id="retention" type="number" defaultValue="90" />
        </div>
        <div className="space-y-2">
          <label htmlFor="timezone" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Múi giờ hệ thống
          </label>
          <Input id="timezone" defaultValue="Asia/Ho_Chi_Minh" />
        </div>
      </div>
    );
  }, [activeTab, appearance, updateAppearance]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cài đặt hệ thống"
        description="Tùy chỉnh cấu hình hoạt động của kho và quản lý ứng dụng."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1 space-y-1">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-150 ${
                activeTab === item.key
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="lg:col-span-3">
          <div className="min-h-25 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between border-b pb-4 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {activeTab === "personal" && "Thông tin cá nhân"}
                {activeTab === "notifications" && "Cấu hình thông báo"}
                {activeTab === "appearance" && "Tùy chỉnh giao diện"}
                {activeTab === "data" && "Quản lý dữ liệu"}
              </h2>
              <Button className="bg-indigo-600 hover:bg-indigo-700">Lưu thay đổi</Button>
            </div>
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}