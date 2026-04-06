import { FileText, Clock, AlertTriangle, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ToggleOptionRow } from "@/components/settings/toggle-option-row";
import { SettingsSubTabNav } from "@/components/settings/settings-sub-tab-nav";
import { workflowSubTabs } from "../constants";
import type { WorkflowSubTab } from "../types";

interface WorkflowSettingsProps {
  activeWorkflowSubTab: WorkflowSubTab;
  setActiveWorkflowSubTab: (tab: WorkflowSubTab) => void;
}

export function WorkflowSettings({ activeWorkflowSubTab, setActiveWorkflowSubTab }: WorkflowSettingsProps) {
  return (
    <div className="space-y-6">
      <SettingsSubTabNav tabs={workflowSubTabs} activeTab={activeWorkflowSubTab} onTabChange={setActiveWorkflowSubTab} />

      {activeWorkflowSubTab === "automation" && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Tự động hóa quy trình</h3>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tự động tạo phiếu</CardTitle>
              <CardDescription>Cấu hình tự động tạo phiếu nhập/xuất</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <ToggleOptionRow icon={FileText} label="Tự động tạo phiếu nhập khi nhận hàng" description="Tạo phiếu nhập kho ngay khi có đơn đặt hàng được xác nhận" checked={true} onCheckedChange={() => {}} />
                <ToggleOptionRow icon={FileText} label="Tự động tạo phiếu xuất khi có đơn hàng" description="Tạo phiếu xuất kho ngay khi có đơn hàng online" checked={true} onCheckedChange={() => {}} />
                <ToggleOptionRow icon={Clock} label="Tự động hoàn tất phiếu sau khi xử lý" description="Đánh dấu phiếu là hoàn tất sau khi tất cả sản phẩm được xử lý" checked={false} onCheckedChange={() => {}} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeWorkflowSubTab === "approval" && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Quy tắc phê duyệt</h3>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workflow phê duyệt</CardTitle>
              <CardDescription>Cấu hình quy trình phê duyệt cho các thao tác quan trọng</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Phê duyệt phiếu nhập</label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="auto">Tự động</option>
                    <option value="manager">Cần phê duyệt của quản lý</option>
                    <option value="admin">Cần phê duyệt của admin</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Phê duyệt phiếu xuất</label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="auto">Tự động</option>
                    <option value="manager">Cần phê duyệt của quản lý</option>
                    <option value="admin">Cần phê duyệt của admin</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeWorkflowSubTab === "alerts" && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Cảnh báo hệ thống</h3>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cấu hình cảnh báo</CardTitle>
              <CardDescription>Thiết lập cảnh báo cho các tình huống quan trọng</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <ToggleOptionRow icon={AlertTriangle} label="Cảnh báo hết hàng" description="Thông báo khi sản phẩm hết hàng hoàn toàn" checked={true} onCheckedChange={() => {}} />
                <ToggleOptionRow icon={AlertTriangle} label="Cảnh báo sắp hết hạn" description="Thông báo khi sản phẩm sắp đến hạn sử dụng" checked={true} onCheckedChange={() => {}} />
                <ToggleOptionRow icon={AlertTriangle} label="Cảnh báo tồn kho thấp" description="Thông báo khi tồn kho dưới mức tối thiểu" checked={true} onCheckedChange={() => {}} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeWorkflowSubTab === "reorder" && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Tự động đặt hàng lại</h3>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reorder Point</CardTitle>
              <CardDescription>Cấu hình tự động tạo đơn đặt hàng khi tồn kho thấp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <ToggleOptionRow icon={Package} label="Bật tự động reorder" description="Tự động tạo đơn đặt hàng khi đạt ngưỡng reorder point" checked={true} onCheckedChange={() => {}} />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Số lượng đặt hàng mặc định</label>
                  <Input type="number" defaultValue="50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Nhà cung cấp mặc định</label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="supplier1">Nhà cung cấp A</option>
                    <option value="supplier2">Nhà cung cấp B</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
