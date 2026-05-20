import { Package, Hash, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SettingsSubTabNav } from "@/components/settings/settings-sub-tab-nav";
import {
  SettingsField,
  SettingsPanel,
  settingsSelectClassName,
} from "@/components/settings/settings-layout";
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
          <h3 className="text-base font-semibold text-foreground">Quy tắc mã hàng</h3>
          <SettingsPanel title="Tự động tạo mã hàng" description="Cấu hình định dạng mã hàng tự động">
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingsField label="Định dạng mã hàng" icon={Hash}>
                  <Input defaultValue="PROD-{CATEGORY}-{NUMBER}" placeholder="Ví dụ: PROD-ELEC-0001" />
                </SettingsField>
                <SettingsField label="Số chữ số">
                  <select className={settingsSelectClassName}>
                    <option value="4">4 chữ số (0001)</option>
                    <option value="6">6 chữ số (000001)</option>
                  </select>
                </SettingsField>
              </div>
          </SettingsPanel>
        </div>
      )}

      {activeProductsSubTab === "categories" && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">Danh mục sản phẩm</h3>
          <SettingsPanel title="Danh mục mặc định" description="Cấu hình danh mục sản phẩm cơ bản">
              <SettingsField label="Danh mục mặc định cho sản phẩm mới" icon={Package}>
                <select className={settingsSelectClassName}>
                  <option value="general">Tổng hợp</option>
                  <option value="electronics">Điện tử</option>
                  <option value="clothing">Quần áo</option>
                  <option value="food">Thực phẩm</option>
                </select>
              </SettingsField>
          </SettingsPanel>
        </div>
      )}

      {activeProductsSubTab === "units" && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">Đơn vị tính</h3>
          <SettingsPanel title="Đơn vị đo lường" description="Cấu hình đơn vị tính cho sản phẩm">
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingsField label="Đơn vị chính">
                  <select className={settingsSelectClassName}>
                    <option value="piece">Cái</option>
                    <option value="kg">Kg</option>
                    <option value="box">Hộp</option>
                    <option value="lot">Lô</option>
                  </select>
                </SettingsField>
                <SettingsField label="Đơn vị phụ">
                  <Input placeholder="Ví dụ: Bao, Gói..." />
                </SettingsField>
              </div>
          </SettingsPanel>
        </div>
      )}

      {activeProductsSubTab === "attributes" && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">Thuộc tính sản phẩm</h3>
          <SettingsPanel title="Thuộc tính tùy chỉnh" description="Cấu hình thuộc tính cho sản phẩm (size, màu sắc, hạn sử dụng...)">
              <div className="space-y-3">
                {[
                  { name: "Kích thước", enabled: true },
                  { name: "Màu sắc", enabled: true },
                  { name: "Hạn sử dụng", enabled: true },
                  { name: "Trọng lượng", enabled: false },
                  { name: "Xuất xứ", enabled: false },
                ].map((attr) => (
                  <label key={attr.name} className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-muted/40">
                    <span className="text-sm font-medium text-foreground">{attr.name}</span>
                    <Switch defaultChecked={attr.enabled} />
                  </label>
                ))}
              </div>
          </SettingsPanel>
        </div>
      )}

      {activeProductsSubTab === "alerts" && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">Cảnh báo tồn kho</h3>
          <SettingsPanel title="Ngưỡng cảnh báo" description="Cấu hình mức tồn kho tối thiểu, tối đa và điểm đặt hàng lại">
              <div className="grid gap-4 sm:grid-cols-3">
                <SettingsField label="Tồn kho tối thiểu" icon={AlertTriangle}>
                  <Input type="number" defaultValue="10" />
                </SettingsField>
                <SettingsField label="Điểm đặt hàng lại" icon={AlertTriangle}>
                  <Input type="number" defaultValue="20" />
                </SettingsField>
                <SettingsField label="Tồn kho tối đa" icon={AlertTriangle}>
                  <Input type="number" defaultValue="1000" />
                </SettingsField>
              </div>
          </SettingsPanel>
        </div>
      )}
    </div>
  );
}
