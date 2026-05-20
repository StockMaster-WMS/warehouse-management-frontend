import { FileText, Clock, AlertTriangle, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ToggleOptionRow } from "@/components/settings/toggle-option-row";
import { SettingsSubTabNav } from "@/components/settings/settings-sub-tab-nav";
import {
  SettingsField,
  SettingsPanel,
  settingsSelectClassName,
} from "@/components/settings/settings-layout";
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
          <h3 className="text-base font-semibold text-foreground">Tự động hóa quy trình</h3>
          <SettingsPanel title="Tự động tạo phiếu" description="Cấu hình tự động tạo phiếu nhập/xuất">
              <div className="space-y-3">
                <ToggleOptionRow icon={FileText} label="Tự động tạo phiếu nhập khi nhận hàng" description="Tạo phiếu nhập kho ngay khi có đơn đặt hàng được xác nhận" checked={true} onCheckedChange={() => {}} />
                <ToggleOptionRow icon={FileText} label="Tự động tạo phiếu xuất khi có đơn hàng" description="Tạo phiếu xuất kho ngay khi có đơn hàng online" checked={true} onCheckedChange={() => {}} />
                <ToggleOptionRow icon={Clock} label="Tự động hoàn tất phiếu sau khi xử lý" description="Đánh dấu phiếu là hoàn tất sau khi tất cả sản phẩm được xử lý" checked={false} onCheckedChange={() => {}} />
              </div>
          </SettingsPanel>
        </div>
      )}

      {activeWorkflowSubTab === "approval" && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">Quy tắc phê duyệt</h3>
          <SettingsPanel title="Workflow phê duyệt" description="Cấu hình quy trình phê duyệt cho các thao tác quan trọng">
              <div className="space-y-3">
                <SettingsField label="Phê duyệt phiếu nhập">
                  <select className={settingsSelectClassName}>
                    <option value="auto">Tự động</option>
                    <option value="manager">Cần phê duyệt của quản lý</option>
                    <option value="admin">Cần phê duyệt của admin</option>
                  </select>
                </SettingsField>
                <SettingsField label="Phê duyệt phiếu xuất">
                  <select className={settingsSelectClassName}>
                    <option value="auto">Tự động</option>
                    <option value="manager">Cần phê duyệt của quản lý</option>
                    <option value="admin">Cần phê duyệt của admin</option>
                  </select>
                </SettingsField>
              </div>
          </SettingsPanel>
        </div>
      )}

      {activeWorkflowSubTab === "alerts" && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">Cảnh báo hệ thống</h3>
          <SettingsPanel title="Cấu hình cảnh báo" description="Thiết lập cảnh báo cho các tình huống quan trọng">
              <div className="space-y-3">
                <ToggleOptionRow icon={AlertTriangle} label="Cảnh báo hết hàng" description="Thông báo khi sản phẩm hết hàng hoàn toàn" checked={true} onCheckedChange={() => {}} />
                <ToggleOptionRow icon={AlertTriangle} label="Cảnh báo sắp hết hạn" description="Thông báo khi sản phẩm sắp đến hạn sử dụng" checked={true} onCheckedChange={() => {}} />
                <ToggleOptionRow icon={AlertTriangle} label="Cảnh báo tồn kho thấp" description="Thông báo khi tồn kho dưới mức tối thiểu" checked={true} onCheckedChange={() => {}} />
              </div>
          </SettingsPanel>
        </div>
      )}

      {activeWorkflowSubTab === "reorder" && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">Tự động đặt hàng lại</h3>
          <SettingsPanel title="Reorder Point" description="Cấu hình tự động tạo đơn đặt hàng khi tồn kho thấp">
              <div className="space-y-3">
                <ToggleOptionRow icon={Package} label="Bật tự động reorder" description="Tự động tạo đơn đặt hàng khi đạt ngưỡng reorder point" checked={true} onCheckedChange={() => {}} />
                <SettingsField label="Số lượng đặt hàng mặc định">
                  <Input type="number" defaultValue="50" />
                </SettingsField>
                <SettingsField label="Nhà cung cấp mặc định">
                  <select className={settingsSelectClassName}>
                    <option value="supplier1">Nhà cung cấp A</option>
                    <option value="supplier2">Nhà cung cấp B</option>
                  </select>
                </SettingsField>
              </div>
          </SettingsPanel>
        </div>
      )}
    </div>
  );
}
