import { Palette, Sun, Moon, Monitor, Sparkles, AlertCircle, Languages, Layout, Eye, Zap, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  SettingsField,
  SettingsOptionButton,
  SettingsSection,
  settingsSelectClassName,
} from "@/components/settings/settings-layout";
import { ToggleOptionRow } from "@/components/settings/toggle-option-row";
import type { AppearanceSettings } from "../types";

interface AppearanceSettingsProps {
  appearance: AppearanceSettings;
  updateAppearance: <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => void;
}

type BooleanAppearanceKey = {
  [K in keyof AppearanceSettings]: AppearanceSettings[K] extends boolean ? K : never;
}[keyof AppearanceSettings];

const THEME_OPTIONS = [
  { id: "light", label: "Nhẹ", icon: Sun, desc: "Nền sáng, chữ tối" },
  { id: "dark", label: "Tối", icon: Moon, desc: "Nền tối, chữ sáng" },
  { id: "auto", label: "Tự động", icon: Monitor, desc: "Theo hệ thống" },
] as const satisfies ReadonlyArray<{
  id: AppearanceSettings["theme"];
  label: string;
  icon: typeof Sun;
  desc: string;
}>;

const COLOR_OPTIONS = [
  { id: "indigo", name: "Chàm", color: "bg-indigo-600" },
  { id: "blue", name: "Xanh dương", color: "bg-blue-600" },
  { id: "emerald", name: "Xanh ngọc", color: "bg-emerald-600" },
  { id: "purple", name: "Tím", color: "bg-purple-600" },
  { id: "rose", name: "Hồng", color: "bg-rose-600" },
  { id: "amber", name: "Vàng hổ phách", color: "bg-amber-600" },
] as const satisfies ReadonlyArray<{
  id: AppearanceSettings["color"];
  name: string;
  color: string;
}>;

const DENSITY_OPTIONS = [
  { id: "compact", label: "Gọn", desc: "Hiển thị nhiều nội dung" },
  { id: "comfortable", label: "Thoải mái", desc: "Cân bằng" },
  { id: "spacious", label: "Rộng rãi", desc: "Ít nội dung, dễ đọc" },
] as const satisfies ReadonlyArray<{
  id: AppearanceSettings["density"];
  label: string;
  desc: string;
}>;

const SIDEBAR_OPTIONS = [
  { id: "auto", label: "Tự động", desc: "Thu gọn khi đủ không gian" },
  { id: "expanded", label: "Luôn mở rộng", desc: "Hiển thị toàn bộ menu" },
  { id: "collapsed", label: "Luôn thu gọn", desc: "Chỉ hiển thị biểu tượng" },
] as const satisfies ReadonlyArray<{
  id: AppearanceSettings["sidebar"];
  label: string;
  desc: string;
}>;

const EXTRA_OPTIONS = [
  { key: "animations", label: "Hiệu ứng chuyển tiếp", desc: "Bật các hiệu ứng động khi chuyển trang", icon: Sparkles },
  { key: "tooltip", label: "Hiển thị tooltip", desc: "Gợi ý khi hover chuột", icon: AlertCircle },
  { key: "performance", label: "Thực hiện thao tác nhanh", desc: "Cải thiện hiệu suất", icon: Zap },
  { key: "shortcuts", label: "Hiện phím tắt", desc: "Hiển thị phím tắt bàn phím", icon: Settings },
] as const satisfies ReadonlyArray<{
  key: BooleanAppearanceKey;
  label: string;
  desc: string;
  icon: typeof Sparkles;
}>;

export function AppearanceSettingsComponent({ appearance, updateAppearance }: AppearanceSettingsProps) {
  return (
    <div className="space-y-6">
      <SettingsSection
        icon={Palette}
        title="Chế độ giao diện"
        description="Chọn chế độ hiển thị phù hợp với bạn"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {THEME_OPTIONS.map((item) => {
            const ThemeIcon = item.icon;
            return (
              <SettingsOptionButton
                key={item.id}
                icon={ThemeIcon}
                selected={appearance.theme === item.id}
                title={item.label}
                description={item.desc}
                onClick={() => updateAppearance("theme", item.id)}
              />
            );
          })}
        </div>
      </SettingsSection>

      <SettingsSection
        icon={Sparkles}
        title="Màu sắc chính"
        description="Chọn màu chủ đạo cho ứng dụng"
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-6">
          {COLOR_OPTIONS.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => updateAppearance("color", item.id)}
              className={`rounded-lg border p-3 transition-colors ${
                appearance.color === item.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary/10"
                  : "border-border bg-card hover:border-primary/30 hover:bg-muted/40"
              }`}
            >
              <div className={`mb-2 h-12 w-full rounded-md ${item.color} shadow-sm`} />
              <p className="text-center text-xs font-medium text-foreground">{item.name}</p>
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        icon={Languages}
        title="Ngôn ngữ và hiển thị"
        description="Cập nhật cài đặt cơ bản cho trải nghiệm cá nhân"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SettingsField label="Ngôn ngữ giao diện">
            <select
              value={appearance.locale}
              onChange={(e) => updateAppearance("locale", e.target.value as AppearanceSettings["locale"])}
              className={settingsSelectClassName}
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </SettingsField>
          <SettingsField label="Số dòng mỗi trang">
            <select
              value={appearance.rowsPerPage}
              onChange={(e) => updateAppearance("rowsPerPage", Number(e.target.value))}
              className={settingsSelectClassName}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </SettingsField>
          <SettingsField label="Định dạng ngày">
            <select
              value={appearance.dateFormat}
              onChange={(e) => updateAppearance("dateFormat", e.target.value as AppearanceSettings["dateFormat"])}
              className={settingsSelectClassName}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </SettingsField>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={Layout}
        title="Mật độ hiển thị"
        description="Điều chỉnh khoảng cách và kích cỡ phần tử"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {DENSITY_OPTIONS.map((item) => (
            <SettingsOptionButton
              key={item.id}
              selected={appearance.density === item.id}
              title={item.label}
              description={item.desc}
              onClick={() => updateAppearance("density", item.id)}
            />
          ))}
        </div>
      </SettingsSection>

      <SettingsSection icon={Eye} title="Kích thước chữ" description="Điều chỉnh kích thước chữ để dễ đọc hơn">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Cỡ chữ hiện tại</span>
          <span className="font-semibold text-primary">{appearance.fontSize}px</span>
        </div>
        <input
          type="range"
          min="12"
          max="18"
          step="1"
          value={appearance.fontSize}
          onChange={(e) => updateAppearance("fontSize", parseInt(e.target.value, 10))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
        />
        <Card className="border-border bg-muted/30">
          <CardContent className="p-4">
            <p style={{ fontSize: `${appearance.fontSize}px` }} className="text-center font-medium text-foreground">
              Đây là ví dụ về kích thước chữ hiện tại
            </p>
          </CardContent>
        </Card>
      </SettingsSection>

      <SettingsSection
        icon={Layout}
        title="Thanh bên"
        description="Cấu hình cách hiển thị menu thanh bên"
      >
        <div className="grid gap-3">
          {SIDEBAR_OPTIONS.map((item) => (
            <label
              key={item.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                appearance.sidebar === item.id
                  ? "border-primary/40 bg-primary/5 ring-1 ring-primary/10"
                  : "border-border bg-card hover:border-primary/30 hover:bg-muted/40"
              }`}
            >
              <input
                type="radio"
                name="sidebar"
                checked={appearance.sidebar === item.id}
                onChange={() => updateAppearance("sidebar", item.id)}
                className="size-4 accent-primary"
              />
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs leading-5 text-muted-foreground">{item.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        icon={Sparkles}
        title="Tùy chọn khác"
        description="Bật/tắt các tính năng bổ sung"
      >
        <div className="space-y-2">
          {EXTRA_OPTIONS.map((item) => (
            <ToggleOptionRow
              key={item.key}
              icon={item.icon}
              label={item.label}
              description={item.desc}
              checked={appearance[item.key]}
              onCheckedChange={(checked) => updateAppearance(item.key, checked)}
            />
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}
