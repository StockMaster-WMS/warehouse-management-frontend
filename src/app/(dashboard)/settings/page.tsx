"use client";

import { useMemo, useState } from "react";
import { UserCog, Database, Bell, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";

const tabs = [
  { key: "personal", label: "Cá nhân", icon: UserCog },
  { key: "notifications", label: "Thông báo", icon: Bell },
  { key: "appearance", label: "Giao diện", icon: Palette },
  { key: "data", label: "Dữ liệu", icon: Database },
] as const;

type SettingsTab = (typeof tabs)[number]["key"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("personal");

  const content = useMemo(() => {
    if (activeTab === "personal") {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="full-name"
              className="text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              Họ tên
            </label>
            <Input id="full-name" defaultValue="An Nguyen" />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              Email
            </label>
            <Input
              id="email"
              defaultValue="an.nguyen@stockmaster.vn"
              type="email"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label
              htmlFor="warehouse-name"
              className="text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              Tên kho mặc định
            </label>
            <Input id="warehouse-name" defaultValue="Kho tong mien Nam" />
          </div>
        </div>
      );
    }

    if (activeTab === "notifications") {
      return (
        <div className="space-y-4">
          {[
            "Cảnh báo tồn kho thấp",
            "Thông báo nhập kho mới",
            "Báo cáo tổng kết cuối ngày",
          ].map((item) => (
            <label
              key={item}
              className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-700"
            >
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {item}
              </span>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 accent-indigo-600"
              />
            </label>
          ))}
        </div>
      );
    }

    if (activeTab === "appearance") {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Nhẹ và sạch", active: true },
            { label: "Độ tương phản cao", active: false },
            { label: "Gọn cho dashboard", active: false },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              className={`rounded-xl border p-4 text-left transition-colors ${
                item.active
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/30"
                  : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
              }`}
            >
              <p className="text-sm font-bold">{item.label}</p>
            </button>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="retention"
            className="text-xs font-bold uppercase tracking-wider text-slate-500"
          >
            Số ngày lưu log
          </label>
          <Input id="retention" type="number" defaultValue="90" />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="timezone"
            className="text-xs font-bold uppercase tracking-wider text-slate-500"
          >
            Múi giờ hệ thống
          </label>
          <Input id="timezone" defaultValue="Asia/Ho_Chi_Minh" />
        </div>
      </div>
    );
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cài đặt hệ thống"
        description="Tùy chỉnh cấu hình hoạt động của kho và quản lý ứng dụng."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1 space-y-1">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                activeTab === item.key
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="lg:col-span-3">
          <div className="min-h-100 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between border-b pb-4 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {activeTab === "personal" && "Thông tin cá nhân"}
                {activeTab === "notifications" && "Cấu hình thông báo"}
                {activeTab === "appearance" && "Tùy chỉnh giao diện"}
                {activeTab === "data" && "Quản lý dữ liệu"}
              </h2>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                Lưu thay đổi
              </Button>
            </div>
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}
