/**
 * Chỉ dùng cho **sản phẩm** (xuất/nhập mẫu + map dữ liệu `Product`).
 * Thêm màn/entity khác: không sửa file này — tạo module riêng (vd. `category-xlsx.ts`) hoặc
 * cấu hình `XlsxImportPreviewConfig` + `getExportMatrix` ngay tại page với `ImportExportXlsxMenu`.
 */
import type { Product } from "@/types/product";
import { getProductCategoryDisplayName } from "@/types/product";
import type { XlsxImportPreviewConfig } from "@/lib/xlsx-import-preview";
import type { AoA } from "@/lib/xlsx-utils";

/** Cột khớp mẫu nhập — điền rồi gửi lên BE (bulk) hoặc map sang form. */
export const PRODUCT_IMPORT_TEMPLATE_HEADERS = [
  "name",
  "barcodeEan13",
  "categoryId",
  "baseUnit",
  "weightKg",
  "lengthCm",
  "widthCm",
  "heightCm",
  "minStockQty",
  "status",
] as const;

const EXPORT_HEADERS = [
  "id",
  "sku",
  "name",
  "barcodeEan13",
  "categoryId",
  "categoryName",
  "baseUnit",
  "status",
  "primarySupplierId",
  "weightKg",
  "lengthCm",
  "widthCm",
  "heightCm",
  "minStockQty",
  "updatedAt",
] as const;

export const PRODUCT_XLSX_SHEET_NAME = "SanPham";

/** Dùng với `ImportExportXlsxMenu` / `buildImportPreviewFromXlsx(buf, PRODUCT_XLSX_IMPORT_CONFIG)`. */
export const PRODUCT_XLSX_IMPORT_CONFIG: XlsxImportPreviewConfig = {
  expectedHeaders: PRODUCT_IMPORT_TEMPLATE_HEADERS,
  requiredRowFields: ["name", "categoryId", "baseUnit"],
  fieldLabels: {
    name: "tên sản phẩm",
    barcodeEan13: "mã vạch (EAN/UPC)",
    categoryId: "mã nhóm hàng",
    baseUnit: "đơn vị tính",
    weightKg: "khối lượng (kg)",
    lengthCm: "chiều dài (cm)",
    widthCm: "chiều rộng (cm)",
    heightCm: "chiều cao (cm)",
    minStockQty: "tồn tối thiểu",
    status: "trạng thái",
  },
};

export function productExportRows(products: Product[]): string[][] {
  const headerRow = [...EXPORT_HEADERS];
  const dataRows = products.map((p) => [
    p.id,
    p.sku,
    p.name,
    p.barcodeEan13 ?? "",
    p.categoryId ?? "",
    getProductCategoryDisplayName(p),
    p.baseUnit ?? "",
    p.status,
    p.primarySupplierId ?? "",
    String(p.weightKg ?? ""),
    String(p.lengthCm ?? ""),
    String(p.widthCm ?? ""),
    String(p.heightCm ?? ""),
    String(p.minStockQty ?? ""),
    p.updatedAt ?? "",
  ]);
  return [headerRow, ...dataRows];
}

export function getProductImportTemplateAoA(): AoA {
  const headerRow = [...PRODUCT_IMPORT_TEMPLATE_HEADERS];
  const exampleRow = [
    "Sản phẩm mẫu (xóa dòng này hoặc sửa)",
    "0123456789012",
    "thay-bang-uuid-nhom-hang",
    "cai",
    "0.5",
    "10",
    "5",
    "3",
    "10",
    "ACTIVE",
  ];
  return [headerRow, exampleRow];
}
