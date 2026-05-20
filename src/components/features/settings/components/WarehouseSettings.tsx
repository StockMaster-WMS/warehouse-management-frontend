import { Warehouse, MapPin, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SettingsSubTabNav } from "@/components/settings/settings-sub-tab-nav";
import {
  SettingsField,
  SettingsOptionButton,
  SettingsPanel,
} from "@/components/settings/settings-layout";
import { warehouseSubTabs } from "../constants";
import type { WarehouseSubTab } from "../types";

interface WarehouseSettingsProps {
  activeWarehouseSubTab: WarehouseSubTab;
  setActiveWarehouseSubTab: (tab: WarehouseSubTab) => void;
}

export function WarehouseSettings({ activeWarehouseSubTab, setActiveWarehouseSubTab }: WarehouseSettingsProps) {
  return (
    <div className="space-y-6">
      <SettingsSubTabNav tabs={warehouseSubTabs} activeTab={activeWarehouseSubTab} onTabChange={setActiveWarehouseSubTab} />

      {activeWarehouseSubTab === "warehouses" && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">Kho hàng</h3>
          <SettingsPanel title="Quản lý kho" description="Thêm, sửa, xóa thông tin kho">
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingsField label="Tên kho mặc định" icon={Warehouse}>
                  <Input defaultValue="Kho chính" />
                </SettingsField>
                <SettingsField label="Địa chỉ kho" icon={MapPin}>
                  <Input defaultValue="123 Đường ABC, Quận 1, TP.HCM" />
                </SettingsField>
              </div>
          </SettingsPanel>
        </div>
      )}

      {activeWarehouseSubTab === "locations" && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">Vị trí lưu trữ</h3>
          <SettingsPanel title="Cấu hình vị trí" description="Thiết lập kệ, ô, khu vực lưu trữ">
              <div className="grid gap-4 sm:grid-cols-3">
                <SettingsField label="Format mã vị trí" icon={Hash}>
                  <Input defaultValue="A-01-01" placeholder="Ví dụ: A-01-01" />
                </SettingsField>
                <SettingsField label="Số kệ tối đa">
                  <Input type="number" defaultValue="10" />
                </SettingsField>
                <SettingsField label="Số tầng/kệ">
                  <Input type="number" defaultValue="5" />
                </SettingsField>
              </div>
          </SettingsPanel>
        </div>
      )}

      {activeWarehouseSubTab === "methods" && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">Phương pháp quản lý kho</h3>
          <SettingsPanel title="Chiến lược xuất kho" description="Chọn phương pháp quản lý hàng tồn kho">
              <div className="grid gap-3">
                {[
                  { id: "fifo", label: "FIFO - Nhập trước, xuất trước", desc: "Xuất hàng cũ trước" },
                  { id: "lifo", label: "LIFO - Nhập sau, xuất trước", desc: "Xuất hàng mới trước" },
                  { id: "fefo", label: "FEFO - Hết hạn trước, xuất trước", desc: "Xuất hàng gần hết hạn trước" },
                  { id: "average", label: "Giá vốn bình quân", desc: "Tính theo giá trị trung bình" },
                ].map((method) => (
                  <SettingsOptionButton
                    key={method.id}
                    selected={method.id === "fifo"}
                    title={method.label}
                    description={method.desc}
                  />
                ))}
              </div>
          </SettingsPanel>
        </div>
      )}
    </div>
  );
}
