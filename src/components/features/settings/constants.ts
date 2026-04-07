import {
  UserCog,
  Database,
  Bell,
  Palette,
  Warehouse,
  Package,
  Workflow,
  Shield,
} from "lucide-react";
import type {
  SettingsTabItem,
  SubTab,
  NotificationSubTab,
  AppearanceSubTab,
  WarehouseSubTab,
  ProductsSubTab,
  WorkflowSubTab,
} from "./types";

export const tabs: SettingsTabItem[] = [
  { key: "personal", label: "Cá nhân", icon: UserCog },
  { key: "notifications", label: "Thông báo", icon: Bell },
  { key: "appearance", label: "Giao diện", icon: Palette },
  { key: "warehouse", label: "Kho & Vị trí", icon: Warehouse },
  { key: "products", label: "Sản phẩm", icon: Package },
  { key: "workflow", label: "Quy trình", icon: Workflow },
  { key: "security", label: "Bảo mật", icon: Shield },
  { key: "data", label: "Dữ liệu", icon: Database },
];

export const notificationSubTabs: SubTab<NotificationSubTab>[] = [
  { key: "email", label: "Email" },
  { key: "push", label: "Push" },
  { key: "sms", label: "SMS" },
  { key: "schedule", label: "Lịch trình" },
];

export const appearanceSubTabs: SubTab<AppearanceSubTab>[] = [
  { key: "theme", label: "Chế độ" },
  { key: "color", label: "Màu sắc" },
  { key: "density", label: "Mật độ" },
  { key: "fontSize", label: "Chữ" },
  { key: "extra", label: "Khác" },
];

export const warehouseSubTabs: SubTab<WarehouseSubTab>[] = [
  { key: "warehouses", label: "Danh sách kho" },
  { key: "locations", label: "Vị trí lưu trữ" },
  { key: "methods", label: "Phương pháp quản lý" },
];

export const productsSubTabs: SubTab<ProductsSubTab>[] = [
  { key: "sku", label: "Mã SKU" },
  { key: "categories", label: "Danh mục" },
  { key: "units", label: "Đơn vị tính" },
  { key: "attributes", label: "Thuộc tính" },
  { key: "alerts", label: "Cảnh báo tồn kho" },
];

export const workflowSubTabs: SubTab<WorkflowSubTab>[] = [
  { key: "automation", label: "Tự động hóa" },
  { key: "approval", label: "Phê duyệt" },
  { key: "alerts", label: "Cảnh báo" },
  { key: "reorder", label: "Đặt hàng lại" },
];
