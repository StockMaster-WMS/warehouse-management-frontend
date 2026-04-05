import { NotificationChannelSection } from "@/components/settings/notification-channel-section";
import { SettingsSubTabNav } from "@/components/settings/settings-sub-tab-nav";
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
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Lịch gửi báo cáo</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="daily-report" className="text-sm font-medium text-slate-700 dark:text-slate-200">Báo cáo hàng ngày</label>
              <Input id="daily-report" type="time" value={dailyReportTime} onChange={(e) => setDailyReportTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label htmlFor="weekly-report" className="text-sm font-medium text-slate-700 dark:text-slate-200">Báo cáo hàng tuần</label>
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
      )}
    </div>
  );
}
