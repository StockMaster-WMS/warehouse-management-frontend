export type SettingsTab =
  | "personal"
  | "appearance"
  | "ai"
  | "security";

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

