/**
 * Chỉ dùng cho **sản phẩm** (xuất/nhập mẫu + map dữ liệu `Product`).
 * Thêm màn/entity khác: không sửa file này — tạo module riêng (vd. `category-xlsx.ts`) hoặc
 * cấu hình `XlsxImportPreviewConfig` + `getExportMatrix` ngay tại page với `ImportExportXlsxMenu`.
 */
import type { XlsxImportPreviewConfig } from "@/lib/xlsx-import-preview";
import type { AoA } from "@/lib/xlsx-utils";

/** Cột khớp mẫu nhập — điền rồi gửi lên BE (bulk) hoặc map sang form. */
export const PRODUCT_IMPORT_TEMPLATE_HEADERS = [
  "name",
  "barcodeEan13",
  "categoryId",
  "categoryCode",
  "supplierCode",
  "baseUnit",
  "weightKg",
  "volumeCm3",
  "minStockQty",
  "isLotTracked",
  "isExpiryTracked",
  "isFrozen",
  "isFragile",
  "isHazmat",
  "isHeavy",
  "status",
] as const;

export const PRODUCT_XLSX_SHEET_NAME = "SanPham";

/** Dùng với `ImportExportXlsxMenu` / `buildImportPreviewFromXlsx(buf, PRODUCT_XLSX_IMPORT_CONFIG)`. */
export const PRODUCT_XLSX_IMPORT_CONFIG: XlsxImportPreviewConfig = {
  expectedHeaders: PRODUCT_IMPORT_TEMPLATE_HEADERS.filter(
    (h) => h !== "categoryId" && h !== "categoryCode",
  ),
  requiredRowFields: ["name", "baseUnit"],
  requireAnyHeaderInEachGroup: [["categoryId", "categoryCode"]],
  requireAnyValueInEachRowGroup: [["categoryId", "categoryCode"]],
  fieldLabels: {
    name: "tên sản phẩm",
    barcodeEan13: "mã vạch (EAN/UPC)",
    categoryId: "UUID danh mục",
    categoryCode: "mã danh mục (DM-…)",
    supplierCode: "mã nhà cung cấp",
    baseUnit: "đơn vị tính",
    weightKg: "khối lượng (kg)",
    volumeCm3: "thể tích (cm3)",
    minStockQty: "tồn tối thiểu",
    isLotTracked: "theo dõi lô",
    isExpiryTracked: "theo dõi hạn dùng",
    isFrozen: "hàng đông lạnh",
    isFragile: "hàng dễ vỡ",
    isHazmat: "hàng nguy hiểm",
    isHeavy: "hàng nặng",
    status: "trạng thái",
  },
};

export function getProductImportTemplateAoA(): AoA {
  const headerRow = [...PRODUCT_IMPORT_TEMPLATE_HEADERS];
  const exampleRow = [
    "Sản phẩm mẫu (xóa dòng này hoặc sửa)",
    "0123456789012",
    "thay-bang-uuid-nhom-hang",
    "",
    "",
    "cai",
    "0.5",
    "250",
    "10",
    "false",
    "true",
    "false",
    "false",
    "false",
    "false",
    "ACTIVE",
  ];
  return [headerRow, exampleRow];
}
