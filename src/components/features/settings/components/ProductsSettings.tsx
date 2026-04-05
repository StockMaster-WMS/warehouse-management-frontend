import { Package, Hash, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SettingsSubTabNav } from "@/components/settings/settings-sub-tab-nav";
import { productsSubTabs } from "../constants";
import type { ProductsSubTab } from "../types";

interface ProductsSettingsProps {
  activeProductsSubTab: ProductsSubTab;
  setActiveProductsSubTab: (tab: ProductsSubTab) => void;
}

export function ProductsSettings({ activeProductsSubTab, setActiveProductsSubTab }: ProductsSettingsProps) {
  return (
    <div className="space-y-6">
      <SettingsSubTabNav tabs={productsSubTabs} activeTab={activeProductsSubTab} onTabChange={setActiveProductsSubTab} />

      {activeProductsSubTab === "sku" && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Quy tắc mã SKU</h3>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tự động tạo SKU</CardTitle>
              <CardDescription>Cấu hình format mã SKU tự động</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <Hash className="h-4 w-4 text-indigo-600" />
                    Format SKU
                  </label>
                  <Input defaultValue="PROD-{CATEGORY}-{NUMBER}" placeholder="Ví dụ: PROD-ELEC-0001" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Số chữ số</label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="4">4 chữ số (0001)</option>
                    <option value="6">6 chữ số (000001)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeProductsSubTab === "categories" && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Danh mục sản phẩm</h3>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Danh mục mặc định</CardTitle>
              <CardDescription>Cấu hình danh mục sản phẩm cơ bản</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <Package className="h-4 w-4 text-indigo-600" />
                  Danh mục mặc định cho sản phẩm mới
                </label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="general">Tổng hợp</option>
                  <option value="electronics">Điện tử</option>
                  <option value="clothing">Quần áo</option>
                  <option value="food">Thực phẩm</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeProductsSubTab === "units" && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Đơn vị tính</h3>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Đơn vị đo lường</CardTitle>
              <CardDescription>Cấu hình đơn vị tính cho sản phẩm</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Đơn vị chính</label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="piece">Cái</option>
                    <option value="kg">Kg</option>
                    <option value="box">Hộp</option>
                    <option value="lot">Lô</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Đơn vị phụ</label>
                  <Input placeholder="Ví dụ: Bao, Gói..." />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeProductsSubTab === "attributes" && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Thuộc tính sản phẩm</h3>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thuộc tính tùy chỉnh</CardTitle>
              <CardDescription>Cấu hình thuộc tính cho sản phẩm (size, màu sắc, hạn sử dụng...)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  { name: "Kích thước", enabled: true },
                  { name: "Màu sắc", enabled: true },
                  { name: "Hạn sử dụng", enabled: true },
                  { name: "Trọng lượng", enabled: false },
                  { name: "Xuất xứ", enabled: false },
                ].map((attr) => (
                  <label key={attr.name} className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                    <span className="font-medium text-slate-900 dark:text-white">{attr.name}</span>
                    <Switch defaultChecked={attr.enabled} />
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeProductsSubTab === "alerts" && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Cảnh báo tồn kho</h3>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ngưỡng cảnh báo</CardTitle>
              <CardDescription>Cấu hình mức tồn kho tối thiểu, tối đa và điểm đặt hàng lại</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    Tồn kho tối thiểu
                  </label>
                  <Input type="number" defaultValue="10" />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    Điểm đặt hàng lại
                  </label>
                  <Input type="number" defaultValue="20" />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    Tồn kho tối đa
                  </label>
                  <Input type="number" defaultValue="1000" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
