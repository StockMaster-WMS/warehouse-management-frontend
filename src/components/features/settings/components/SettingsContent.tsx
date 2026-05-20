import { PersonalSettings } from "./PersonalSettings";
import { NotificationSettings } from "./NotificationSettings";
import { AppearanceSettingsComponent } from "./AppearanceSettings";
import { WarehouseSettings } from "./WarehouseSettings";
import { ProductsSettings } from "./ProductsSettings";
import { WorkflowSettings } from "./WorkflowSettings";
import { AiSettings } from "./AiSettings";
import { SecuritySettings } from "./SecuritySettings";
import { DataSettings } from "./DataSettings";
import type {
  AppearanceSettings,
  NotificationSetting,
  SettingsTab,
  NotificationSubTab,
  WarehouseSubTab,
  ProductsSubTab,
  WorkflowSubTab,
} from "../types";

interface SettingsContentProps {
  activeTab: SettingsTab;
  activeSubTab: NotificationSubTab;
  activeWarehouseSubTab: WarehouseSubTab;
  activeProductsSubTab: ProductsSubTab;
  activeWorkflowSubTab: WorkflowSubTab;
  appearance: AppearanceSettings;
  notificationData: NotificationSetting[];
  emergencyPhone: string;
  dailyReportTime: string;
  weeklyReportDay: string;
  handleToggleNotification: (itemId: string) => void;
  gotoProfile: () => void;
  updateAppearance: <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => void;
  setEmergencyPhone: (value: string) => void;
  setDailyReportTime: (value: string) => void;
  setWeeklyReportDay: (value: string) => void;
  setActiveSubTab: (tab: NotificationSubTab) => void;
  setActiveWarehouseSubTab: (tab: WarehouseSubTab) => void;
  setActiveProductsSubTab: (tab: ProductsSubTab) => void;
  setActiveWorkflowSubTab: (tab: WorkflowSubTab) => void;
}

export function SettingsContent({
  activeTab,
  activeSubTab,
  activeWarehouseSubTab,
  activeProductsSubTab,
  activeWorkflowSubTab,
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
  setActiveSubTab,
  setActiveWarehouseSubTab,
  setActiveProductsSubTab,
  setActiveWorkflowSubTab,
}: SettingsContentProps) {
  const renderTabContent = () => {
    switch (activeTab) {
      case "personal":
        return <PersonalSettings gotoProfile={gotoProfile} />;
      case "notifications":
        return (
          <NotificationSettings
            activeSubTab={activeSubTab}
            setActiveSubTab={setActiveSubTab}
            notificationData={notificationData}
            emergencyPhone={emergencyPhone}
            dailyReportTime={dailyReportTime}
            weeklyReportDay={weeklyReportDay}
            handleToggleNotification={handleToggleNotification}
            setEmergencyPhone={setEmergencyPhone}
            setDailyReportTime={setDailyReportTime}
            setWeeklyReportDay={setWeeklyReportDay}
          />
        );
      case "appearance":
        return <AppearanceSettingsComponent appearance={appearance} updateAppearance={updateAppearance} />;
      case "warehouse":
        return (
          <WarehouseSettings
            activeWarehouseSubTab={activeWarehouseSubTab}
            setActiveWarehouseSubTab={setActiveWarehouseSubTab}
          />
        );
      case "products":
        return (
          <ProductsSettings
            activeProductsSubTab={activeProductsSubTab}
            setActiveProductsSubTab={setActiveProductsSubTab}
          />
        );
      case "workflow":
        return (
          <WorkflowSettings
            activeWorkflowSubTab={activeWorkflowSubTab}
            setActiveWorkflowSubTab={setActiveWorkflowSubTab}
          />
        );
      case "ai":
        return <AiSettings />;
      case "security":
        return <SecuritySettings />;
      case "data":
        return <DataSettings />;
      default:
        return null;
    }
  };

  return renderTabContent();
}
