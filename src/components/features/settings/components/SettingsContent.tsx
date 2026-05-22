import { PersonalSettings } from "./PersonalSettings";
import { AppearanceSettingsComponent } from "./AppearanceSettings";
import { AiSettings } from "./AiSettings";
import { SecuritySettings } from "./SecuritySettings";
import type {
  AppearanceSettings,
  SettingsTab,
} from "../types";

interface SettingsContentProps {
  activeTab: SettingsTab;
  appearance: AppearanceSettings;
  gotoProfile: () => void;
  updateAppearance: <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => void;
}

export function SettingsContent({
  activeTab,
  appearance,
  gotoProfile,
  updateAppearance,
}: SettingsContentProps) {
  const renderTabContent = () => {
    switch (activeTab) {
      case "personal":
        return <PersonalSettings gotoProfile={gotoProfile} />;
      case "appearance":
        return <AppearanceSettingsComponent appearance={appearance} updateAppearance={updateAppearance} />;
      case "ai":
        return <AiSettings />;
      case "security":
        return <SecuritySettings />;
      default:
        return null;
    }
  };

  return renderTabContent();
}
