import {
  UserCog,
  Database,
  Bell,
  Palette,
  Warehouse,
  Package,
  Workflow,
  Shield,
  Bot,
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
  { key: "personal", label: "Hồ sơ người dùng", icon: UserCog },
  { key: "appearance", label: "Giao diện", icon: Palette },
  { key: "notifications", label: "Thông báo", icon: Bell },
  { key: "warehouse", label: "Kho & vị trí", icon: Warehouse },
  { key: "products", label: "Sản phẩm & mã hàng", icon: Package },
  { key: "workflow", label: "Luồng xử lý", icon: Workflow },
  { key: "ai", label: "Trợ lý thông minh", icon: Bot },
  { key: "security", label: "Bảo mật & phân quyền", icon: Shield },
  { key: "data", label: "Dữ liệu hệ thống", icon: Database },
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
  { key: "warehouses", label: "Kho hàng" },
  { key: "locations", label: "Vị trí lưu trữ" },
  { key: "methods", label: "Phương pháp quản lý" },
];

export const productsSubTabs: SubTab<ProductsSubTab>[] = [
  { key: "sku", label: "Mã hàng" },
  { key: "categories", label: "Danh mục" },
  { key: "units", label: "Đơn vị tính" },
  { key: "attributes", label: "Thuộc tính" },
  { key: "alerts", label: "Cảnh báo tồn kho" },
];

export const workflowSubTabs: SubTab<WorkflowSubTab>[] = [
  { key: "automation", label: "Tự động hóa" },
  { key: "approval", label: "Phê duyệt" },
  { key: "alerts", label: "Cảnh báo" },
  { key: "reorder", label: "Điểm đặt hàng lại" },
];
