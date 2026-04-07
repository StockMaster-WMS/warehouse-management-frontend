import { Palette, Sun, Moon, Monitor, Sparkles, AlertCircle, Languages, Layout, Eye, Zap, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ToggleOptionRow } from "@/components/settings/toggle-option-row";
import type { AppearanceSettings } from "../types";

interface AppearanceSettingsProps {
  appearance: AppearanceSettings;
  updateAppearance: (key: keyof AppearanceSettings, value: AppearanceSettings[keyof AppearanceSettings]) => void;
}

export function AppearanceSettingsComponent({ appearance, updateAppearance }: AppearanceSettingsProps) {
  return (
    <div className="space-y-8">
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
                onClick={() => updateAppearance("theme", item.id as any)}
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
              onClick={() => updateAppearance("color", item.id as any)}
              className={`group rounded-xl border-2 p-3 transition-all duration-200 hover:scale-105 active:scale-95 ${
                appearance.color === item.id
                  ? "border-slate-900 shadow-lg dark:border-white"
                  : "border-slate-200 hover:border-indigo-300 dark:border-slate-700 dark:hover:border-indigo-600/50"
              }`}
            >
              <div className={`h-12 w-full rounded-lg ${item.color} mb-2 shadow-md`} />
              <p className="text-xs font-medium text-center text-slate-700 dark:text-slate-200">{item.name}</p>
            </button>
          ))}
        </div>
      </div>

      <Separator className="dark:bg-slate-700" />

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
              onChange={(e) => updateAppearance("locale", e.target.value as any)}
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
              onChange={(e) => updateAppearance("dateFormat", e.target.value as any)}
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
              onClick={() => updateAppearance("density", item.id as any)}
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
          onChange={(e) => updateAppearance("fontSize", parseInt(e.target.value, 10))}
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
                onChange={() => updateAppearance("sidebar", item.id as any)}
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

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-600" />
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
              onCheckedChange={(checked) => updateAppearance(item.key as keyof AppearanceSettings, !!checked)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
