import type { LucideIcon } from "lucide-react";

export interface SettingsTabItem {
  key: SettingsTab;
  label: string;
  icon: LucideIcon;
}

export interface SubTab<T extends string = string> {
  key: T;
  label: string;
}

export type SettingsTab =
  | "personal"
  | "notifications"
  | "appearance"
  | "warehouse"
  | "products"
  | "workflow"
  | "ai"
  | "security"
  | "data";

export type NotificationSubTab = "email" | "push" | "sms" | "schedule";
export type AppearanceSubTab = "theme" | "color" | "density" | "fontSize" | "extra";
export type WarehouseSubTab = "warehouses" | "locations" | "methods";
export type ProductsSubTab = "sku" | "categories" | "units" | "attributes" | "alerts";
export type WorkflowSubTab = "automation" | "approval" | "alerts" | "reorder";
export type ThemeType = "light" | "dark" | "auto";
export type ColorType = "indigo" | "blue" | "emerald" | "purple" | "rose" | "amber";
export type DensityType = "compact" | "comfortable" | "spacious";
export type SidebarType = "auto" | "expanded" | "collapsed";
export type LocaleType = "vi" | "en";
export type DateFormatType = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";

export interface AppearanceSettings {
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

export interface NotificationItem {
  id: string;
  key: string;
  label: string;
  description: string;
  isEnabled: boolean;
  isUrgent: boolean;
  channel: "email" | "push" | "sms";
}

export interface NotificationSetting {
  channelId: string;
  channelName: string;
  items: NotificationItem[];
}

export interface SettingsTabItem {
  key: SettingsTab;
  label: string;
  icon: LucideIcon;
}
