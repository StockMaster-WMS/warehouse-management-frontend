"use client";

import { AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

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
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>

      {showWarning && warningText && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-800 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-5 w-5 text-amber-600">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
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
            className="flex items-start justify-between rounded-xl border border-slate-200 p-4 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-sm dark:border-slate-700 dark:hover:border-indigo-600/50 dark:hover:bg-indigo-950/20 cursor-pointer"
          >
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {item.label}
                </span>
                {item.isUrgent && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400 shadow-sm">
                    <AlertTriangle className="h-3 w-3" />
                    Khẩn cấp
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
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
        <div className="space-y-2">
          <label htmlFor="emergency-phone" className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Số điện thoại khẩn cấp
          </label>
          <Input
            id="emergency-phone"
            placeholder="+84 xxx xxx xxx"
            value={emergencyPhone}
            onChange={(e) => onEmergencyPhoneChange(e.target.value)}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Số điện thoại nhận SMS khẩn cấp. Có thể nhập nhiều số cách nhau bằng dấu phẩy.
          </p>
        </div>
      )}
    </div>
  );
}
