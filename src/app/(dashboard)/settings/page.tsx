"use client";

import { useMemo } from "react";
import {
  UserCog, Database, Bell, Palette, Warehouse, Package, Workflow, Shield, Settings, CheckCircle2
} from "lucide-react";
import { useSettingsPage } from "@/components/features/settings";
import { SettingsContent } from "@/components/features/settings/components/SettingsContent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";

const tabs = [
  { key: "personal", label: "Cá nhân", icon: UserCog },
  { key: "notifications", label: "Thông báo", icon: Bell },
  { key: "appearance", label: "Giao diện", icon: Palette },
  { key: "warehouse", label: "Kho & Vị trí", icon: Warehouse },
  { key: "products", label: "Sản phẩm", icon: Package },
  { key: "workflow", label: "Quy trình", icon: Workflow },
  { key: "security", label: "Bảo mật", icon: Shield },
  { key: "data", label: "Dữ liệu", icon: Database },
] as const;

export default function SettingsPage() {
  const {
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
  } = useSettingsPage();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cài đặt hệ thống"
        description="Tùy chỉnh cấu hình hoạt động của kho và quản lý ứng dụng."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="h-4 w-4 text-indigo-600" />
                Danh mục
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {tabs.map((item, index) => (
                  <div key={item.key}>
                    <button
                      onClick={() => setActiveTab(item.key)}
                      className={`w-full px-4 py-3 text-left transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        activeTab === item.key
                          ? "bg-indigo-50 border-r-2 border-indigo-500 dark:bg-indigo-950/40 dark:border-indigo-400"
                          : "border-r-2 border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`h-4 w-4 ${activeTab === item.key ? "text-indigo-600" : "text-slate-600 dark:text-slate-400"}`} />
                        <span className={`text-sm font-medium ${activeTab === item.key ? "text-indigo-900 dark:text-indigo-200" : "text-slate-700 dark:text-slate-300"}`}>
                          {item.label}
                        </span>
                      </div>
                    </button>
                    {index < tabs.length - 1 && <Separator className="my-0" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {activeTab === "personal" && <UserCog className="h-5 w-5 text-indigo-600" />}
                  {activeTab === "notifications" && <Bell className="h-5 w-5 text-indigo-600" />}
                  {activeTab === "appearance" && <Palette className="h-5 w-5 text-indigo-600" />}
                  {activeTab === "warehouse" && <Warehouse className="h-5 w-5 text-indigo-600" />}
                  {activeTab === "products" && <Package className="h-5 w-5 text-indigo-600" />}
                  {activeTab === "workflow" && <Workflow className="h-5 w-5 text-indigo-600" />}
                  {activeTab === "security" && <Shield className="h-5 w-5 text-indigo-600" />}
                  {activeTab === "data" && <Database className="h-5 w-5 text-indigo-600" />}
                  <div>
                    <CardTitle>
                      {activeTab === "personal" && "Thông tin cá nhân"}
                      {activeTab === "notifications" && "Cấu hình thông báo"}
                      {activeTab === "appearance" && "Tùy chỉnh giao diện"}
                      {activeTab === "warehouse" && "Quản lý kho & vị trí"}
                      {activeTab === "products" && "Cài đặt sản phẩm"}
                      {activeTab === "workflow" && "Quy trình nghiệp vụ"}
                      {activeTab === "security" && "Bảo mật & phân quyền"}
                      {activeTab === "data" && "Quản lý dữ liệu"}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {activeTab === "personal" && "Quản lý thông tin cá nhân và cài đặt cơ bản"}
                      {activeTab === "notifications" && "Kiểm soát các kênh thông báo và tần suất"}
                      {activeTab === "appearance" && "Tùy chỉnh giao diện và trải nghiệm người dùng"}
                      {activeTab === "warehouse" && "Cấu hình kho, vị trí lưu trữ và phương pháp quản lý"}
                      {activeTab === "products" && "Thiết lập quy tắc sản phẩm và đơn vị tính"}
                      {activeTab === "workflow" && "Tự động hóa quy trình và cảnh báo hệ thống"}
                      {activeTab === "security" && "Quyền truy cập và audit log"}
                      {activeTab === "data" && "Quản lý dữ liệu và múi giờ hệ thống"}
                    </CardDescription>
                  </div>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Lưu thay đổi
                </Button>
              </div>
            </CardHeader>
            <Separator className="dark:bg-slate-800" />
            <CardContent className="pt-6">
              <SettingsContent
                activeTab={activeTab}
                activeSubTab={activeSubTab}
                activeAppearanceSubTab={activeAppearanceSubTab}
                activeWarehouseSubTab={activeWarehouseSubTab}
                activeProductsSubTab={activeProductsSubTab}
                activeWorkflowSubTab={activeWorkflowSubTab}
                appearance={appearance}
                notificationData={notificationData}
                emergencyPhone={emergencyPhone}
                dailyReportTime={dailyReportTime}
                weeklyReportDay={weeklyReportDay}
                handleToggleNotification={handleToggleNotification}
                gotoProfile={gotoProfile}
                updateAppearance={updateAppearance}
                setEmergencyPhone={setEmergencyPhone}
                setDailyReportTime={setDailyReportTime}
                setWeeklyReportDay={setWeeklyReportDay}
                setActiveSubTab={setActiveSubTab}
                setActiveAppearanceSubTab={setActiveAppearanceSubTab}
                setActiveWarehouseSubTab={setActiveWarehouseSubTab}
                setActiveProductsSubTab={setActiveProductsSubTab}
                setActiveWorkflowSubTab={setActiveWorkflowSubTab}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}