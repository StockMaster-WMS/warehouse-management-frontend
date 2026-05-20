import { Database, AlertCircle, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  SettingsField,
  SettingsPanel,
  SettingsSection,
  settingsSelectClassName,
} from "@/components/settings/settings-layout";

export function DataSettings() {
  return (
    <div className="space-y-6">
      <SettingsSection
        icon={Database}
        title="Cấu hình dữ liệu"
        description="Quản lý thời gian lưu trữ và múi giờ hệ thống"
      >
        <SettingsPanel title="Log hệ thống" description="Cấu hình thời gian lưu trữ nhật ký hoạt động">
            <SettingsField
              htmlFor="retention"
              label="Số ngày lưu log"
              icon={AlertCircle}
              description="Log cũ hơn thời gian này sẽ được tự động xóa."
            >
              <Input id="retention" type="number" defaultValue="90" />
            </SettingsField>
        </SettingsPanel>

        <SettingsPanel title="Múi giờ & Khu vực" description="Cấu hình múi giờ cho toàn bộ hệ thống">
            <SettingsField
              htmlFor="timezone"
              label="Múi giờ hệ thống"
              icon={Settings}
              description="Múi giờ sẽ áp dụng cho toàn bộ hệ thống."
            >
              <select id="timezone" defaultValue="Asia/Ho_Chi_Minh" className={settingsSelectClassName}>
                <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh</option>
                <option value="Asia/Bangkok">Asia/Bangkok</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
                <option value="Europe/London">Europe/London</option>
                <option value="America/New_York">America/New_York</option>
                <option value="UTC">UTC</option>
              </select>
            </SettingsField>
        </SettingsPanel>
      </SettingsSection>
    </div>
  );
}
