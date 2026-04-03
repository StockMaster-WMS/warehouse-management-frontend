import type { XlsxImportPreviewConfig } from "@/lib/xlsx-import-preview";
import type { AoA } from "@/lib/xlsx-utils";

export const PO_PRODUCT_IMPORT_HEADERS = [
  "name",
  "categoryId",
  "categoryCode",
  "baseUnit",
  "orderedQty",
  "unitPrice",
  "barcodeEan13",
  "supplierCode",
  "weightKg",
  "lengthCm",
  "widthCm",
  "heightCm",
] as const;

export const PO_PRODUCT_XLSX_SHEET_NAME = "ImportSanPham";

export const PO_PRODUCT_XLSX_IMPORT_CONFIG: XlsxImportPreviewConfig = {
  expectedHeaders: PO_PRODUCT_IMPORT_HEADERS.filter(
    (h) => h !== "categoryId" && h !== "categoryCode" && h !== "supplierCode",
  ),
  requiredRowFields: ["name", "baseUnit", "orderedQty"],
  requireAnyHeaderInEachGroup: [["categoryId", "categoryCode"]],
  requireAnyValueInEachRowGroup: [["categoryId", "categoryCode"]],
  fieldLabels: {
    name: "Tên sản phẩm",
    categoryId: "UUID danh mục",
    categoryCode: "Mã danh mục (DM-…)",
    baseUnit: "Đơn vị tính",
    orderedQty: "Số lượng đặt",
    unitPrice: "Đơn giá",
    barcodeEan13: "Mã vạch (EAN/UPC)",
    supplierCode: "Mã nhà cung cấp",
    weightKg: "Khối lượng (kg)",
    lengthCm: "Chiều dài (cm)",
    widthCm: "Chiều rộng (cm)",
    heightCm: "Chiều cao (cm)",
  },
};

export function getPoProductImportTemplateAoA(): AoA {
  const headerRow = [...PO_PRODUCT_IMPORT_HEADERS];
  const exampleRow = [
    "Sản phẩm mẫu (xóa dòng này)",
    "thay-bang-uuid-danh-muc",
    "",
    "cai",
    "100",
    "50000",
    "0123456789012",
    "",
    "0.5",
    "10",
    "5",
    "3",
  ];
  return [headerRow, exampleRow];
}
