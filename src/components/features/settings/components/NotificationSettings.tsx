import { NotificationChannelSection } from "@/components/settings/notification-channel-section";
import { SettingsSubTabNav } from "@/components/settings/settings-sub-tab-nav";
import {
  SettingsField,
  SettingsPanel,
  settingsSelectClassName,
} from "@/components/settings/settings-layout";
import { Input } from "@/components/ui/input";
import type { NotificationSetting, NotificationSubTab } from "../types";
import { notificationSubTabs } from "../constants";

interface NotificationSettingsProps {
  activeSubTab: NotificationSubTab;
  setActiveSubTab: (tab: NotificationSubTab) => void;
  notificationData: NotificationSetting[];
  emergencyPhone: string;
  dailyReportTime: string;
  weeklyReportDay: string;
  handleToggleNotification: (itemId: string) => void;
  setEmergencyPhone: (value: string) => void;
  setDailyReportTime: (value: string) => void;
  setWeeklyReportDay: (value: string) => void;
}

export function NotificationSettings({
  activeSubTab,
  setActiveSubTab,
  notificationData,
  emergencyPhone,
  dailyReportTime,
  weeklyReportDay,
  handleToggleNotification,
  setEmergencyPhone,
  setDailyReportTime,
  setWeeklyReportDay,
}: NotificationSettingsProps) {
  return (
    <div className="space-y-6">
      <SettingsSubTabNav tabs={notificationSubTabs} activeTab={activeSubTab} onTabChange={setActiveSubTab} />

      {activeSubTab === "email" && notificationData[0] && (
        <NotificationChannelSection title={notificationData[0].channelName} items={notificationData[0].items} onToggle={handleToggleNotification} />
      )}
      {activeSubTab === "push" && notificationData[1] && (
        <NotificationChannelSection title={notificationData[1].channelName} items={notificationData[1].items} onToggle={handleToggleNotification} />
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
          <h3 className="text-base font-semibold text-foreground">Lịch gửi báo cáo</h3>
          <SettingsPanel title="Lịch báo cáo định kỳ" description="Cấu hình thời điểm gửi báo cáo vận hành">
          <div className="grid gap-4 sm:grid-cols-2">
            <SettingsField htmlFor="daily-report" label="Báo cáo hàng ngày">
              <Input id="daily-report" type="time" value={dailyReportTime} onChange={(e) => setDailyReportTime(e.target.value)} />
            </SettingsField>
            <SettingsField htmlFor="weekly-report" label="Báo cáo hàng tuần">
              <select
                id="weekly-report"
                className={settingsSelectClassName}
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
            </SettingsField>
          </div>
          </SettingsPanel>
        </div>
      )}
    </div>
  );
}
