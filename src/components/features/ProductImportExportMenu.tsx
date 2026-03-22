"use client";

import { ImportExportXlsxMenu } from "@/components/features/ImportExportXlsxMenu";
import {
  PRODUCT_XLSX_IMPORT_CONFIG,
  PRODUCT_XLSX_SHEET_NAME,
  getProductImportTemplateAoA,
  productExportRows,
} from "@/lib/product-xlsx";
import type { Product } from "@/types/product";

export type ProductImportExportMenuProps = {
  products: Product[];
  pageIndex: number;
};

export function ProductImportExportMenu({ products, pageIndex }: ProductImportExportMenuProps) {
  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <ImportExportXlsxMenu
      sheetName={PRODUCT_XLSX_SHEET_NAME}
      getExportMatrix={() => productExportRows(products)}
      exportDisabled={products.length === 0}
      getExportFilename={() => `san-pham-trang-${pageIndex + 1}-${stamp}`}
      getTemplateMatrix={() => getProductImportTemplateAoA()}
      templateBasename="mau-nhap-san-pham"
      importConfig={PRODUCT_XLSX_IMPORT_CONFIG}
      exportItemLabel="Xuất .xlsx — trang hiện tại"
      dialogTitle="Kiểm tra file nhập sản phẩm"
      importPreviewCountLabel="dòng sản phẩm"
      dialogDescription={
        <>
          Dùng <strong>sheet đầu</strong> trong file. Chỉ để <strong>xem lại</strong> trước khi nhập — dữ liệu{" "}
          <strong>chưa lưu</strong> vào danh mục cho đến khi đồng bộ máy chủ.
        </>
      }
      successHint="Tên sản phẩm, mã nhóm hàng và đơn vị tính đều đã có trên các dòng."
    />
  );
}
