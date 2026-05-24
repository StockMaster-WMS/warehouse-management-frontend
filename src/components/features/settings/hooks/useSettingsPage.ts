"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type {
  AppearanceSettings,
  SettingsTab,
  ColorType,
} from "../types";
import { defaultAppearanceSettings } from "../data";

const APPEARANCE_STORAGE_KEY = "appearanceSettings:v1";
const LEGACY_APPEARANCE_STORAGE_KEY = "appearanceSettings";

export function useSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>("personal");

  const [appearance, setAppearance] = useState<AppearanceSettings>(() => {
    if (typeof window !== "undefined") {
      const saved =
        localStorage.getItem(APPEARANCE_STORAGE_KEY) ??
        localStorage.getItem(LEGACY_APPEARANCE_STORAGE_KEY);
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

    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(appearance));
  }, [appearance]);

  const updateAppearance = useCallback(
    <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => {
      setAppearance((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return {
    activeTab,
    setActiveTab,
    appearance,
    gotoProfile,
    updateAppearance,
  };
}
