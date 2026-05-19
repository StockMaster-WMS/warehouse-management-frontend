import { Warehouse, MapPin, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SettingsSubTabNav } from "@/components/settings/settings-sub-tab-nav";
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
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Kho hàng</h3>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quản lý kho</CardTitle>
              <CardDescription>Thêm, sửa, xóa thông tin kho</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <Warehouse className="h-4 w-4 text-indigo-600" />
                    Tên kho mặc định
                  </label>
                  <Input defaultValue="Kho chính" />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <MapPin className="h-4 w-4 text-indigo-600" />
                    Địa chỉ kho
                  </label>
                  <Input defaultValue="123 Đường ABC, Quận 1, TP.HCM" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeWarehouseSubTab === "locations" && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Vị trí lưu trữ</h3>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cấu hình vị trí</CardTitle>
              <CardDescription>Thiết lập kệ, ô, khu vực lưu trữ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <Hash className="h-4 w-4 text-indigo-600" />
                    Format mã vị trí
                  </label>
                  <Input defaultValue="A-01-01" placeholder="Ví dụ: A-01-01" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Số kệ tối đa</label>
                  <Input type="number" defaultValue="10" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Số tầng/kệ</label>
                  <Input type="number" defaultValue="5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeWarehouseSubTab === "methods" && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Phương pháp quản lý kho</h3>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chiến lược xuất kho</CardTitle>
              <CardDescription>Chọn phương pháp quản lý hàng tồn kho</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {[
                  { id: "fifo", label: "FIFO (First In, First Out)", desc: "Xuất hàng cũ trước" },
                  { id: "lifo", label: "LIFO (Last In, First Out)", desc: "Xuất hàng mới trước" },
                  { id: "fefo", label: "FEFO (First Expired, First Out)", desc: "Xuất hàng gần hết hạn trước" },
                  { id: "average", label: "Average Cost", desc: "Giá trị trung bình" },
                ].map((method) => (
                  <label key={method.id} className="flex items-center gap-3 rounded-xl border-2 p-4 cursor-pointer border-slate-200 hover:border-indigo-300 dark:border-slate-700 dark:hover:border-indigo-600/50">
                    <input type="radio" name="warehouse-method" defaultChecked={method.id === "fifo"} className="w-4 h-4 accent-indigo-600" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{method.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{method.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
