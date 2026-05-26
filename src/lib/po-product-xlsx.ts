import type { XlsxImportPreviewConfig } from "@/lib/xlsx-import-preview";
import type { AoA } from "@/lib/xlsx-utils";

export const PO_PRODUCT_IMPORT_HEADERS = [
  "sku",
  "name",
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
  expectedHeaders: ["orderedQty"],
  requireAnyHeaderInEachGroup: [["sku", "name"]],
  requireAnyValueInEachRowGroup: [["sku", "name"]],
  fieldLabels: {
    sku: "Mã hàng",
    name: "Tên sản phẩm",
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
  const existingProductRow = [
    "HOME-00194",
    "",
    "",
    "",
    "10",
    "50000",
    "",
    "",
    "",
    "",
    "",
    "",
  ];
  const newProductRow = [
    "",
    "Sản phẩm mẫu mới",
    "DM-260416000139142-780C",
    "cai",
    "10",
    "50000",
    "0123456789012",
    "",
    "0.5",
    "10",
    "5",
    "3",
  ];
  return [headerRow, existingProductRow, newProductRow];
}
