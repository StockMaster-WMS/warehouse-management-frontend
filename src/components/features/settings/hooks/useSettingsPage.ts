"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type {
  AppearanceSettings,
  NotificationSetting,
  SettingsTab,
  NotificationSubTab,
  AppearanceSubTab,
  WarehouseSubTab,
  ProductsSubTab,
  WorkflowSubTab,
  ColorType,
} from "../types";
import { defaultAppearanceSettings, mockNotificationData } from "../data";

export function useSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>("personal");
  const [activeSubTab, setActiveSubTab] = useState<NotificationSubTab>("email");
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
        } catch (error) {
          console.error("Failed to parse appearance settings:", error);
        }
      }
    }
    return defaultAppearanceSettings;
  });

  const [notificationData, setNotificationData] = useState<NotificationSetting[]>(mockNotificationData);
  const [emergencyPhone, setEmergencyPhone] = useState("+84 123 456 789");
  const [dailyReportTime, setDailyReportTime] = useState("18:00");
  const [weeklyReportDay, setWeeklyReportDay] = useState("friday");

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

  const gotoProfile = useCallback(() => {
    router.push("/profile");
  }, [router]);

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

  return {
    activeTab,
    setActiveTab,
    activeSubTab,
    setActiveSubTab,
    activeAppearanceSubTab,
    setActiveAppearanceSubTab,
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
  };
}
