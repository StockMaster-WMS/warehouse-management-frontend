"use client";

import { AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { SettingsField, SettingsPanel } from "@/components/settings/settings-layout";

interface NotificationItem {
  id: string;
  key: string;
  label: string;
  description: string;
  isEnabled: boolean;
  isUrgent: boolean;
  channel: "email" | "push" | "sms";
}

interface NotificationChannelSectionProps {
  title: string;
  items: NotificationItem[];
  onToggle: (itemId: string) => void;
  showWarning?: boolean;
  warningText?: string;
  emergencyPhone?: string;
  onEmergencyPhoneChange?: (value: string) => void;
  showEmergencyPhoneInput?: boolean;
}

export function NotificationChannelSection({
  title,
  items,
  onToggle,
  showWarning = false,
  warningText,
  emergencyPhone,
  onEmergencyPhoneChange,
  showEmergencyPhoneInput = false,
}: NotificationChannelSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>

      {showWarning && warningText && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{warningText}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-muted/40"
          >
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {item.label}
                </span>
                {item.isUrgent && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 shadow-sm dark:bg-red-950/40 dark:text-red-300">
                    <AlertTriangle className="size-3" />
                    Khẩn cấp
                  </span>
                )}
              </div>
              <p className="text-xs leading-5 text-muted-foreground">{item.description}</p>
            </div>
            <Switch
              checked={item.isEnabled}
              onCheckedChange={() => onToggle(item.id)}
              aria-label={item.label}
            />
          </label>
        ))}
      </div>

      {showEmergencyPhoneInput && emergencyPhone !== undefined && onEmergencyPhoneChange && (
        <SettingsPanel title="Liên hệ khẩn cấp" description="Số điện thoại nhận SMS khẩn cấp">
          <SettingsField
            htmlFor="emergency-phone"
            label="Số điện thoại khẩn cấp"
            description="Có thể nhập nhiều số cách nhau bằng dấu phẩy."
          >
          <Input
            id="emergency-phone"
            placeholder="+84 xxx xxx xxx"
            value={emergencyPhone}
            onChange={(e) => onEmergencyPhoneChange(e.target.value)}
          />
          </SettingsField>
        </SettingsPanel>
      )}
    </div>
  );
}
