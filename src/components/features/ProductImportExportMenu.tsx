"use client";

import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { ImportExportXlsxMenu } from "@/components/features/ImportExportXlsxMenu";
import {
  PRODUCT_XLSX_IMPORT_CONFIG,
  PRODUCT_XLSX_SHEET_NAME,
  getProductImportTemplateAoA,
  productExportRows,
} from "@/lib/product-xlsx";
import { useImportProductsXlsxMutation } from "@/store/services/product.service";
import { apiErrMessage } from "@/types/api";
import type { Product } from "@/types/product";

export type ProductImportExportMenuProps = {
  products: Product[];
  pageIndex: number;
};

export function ProductImportExportMenu({ products, pageIndex }: ProductImportExportMenuProps) {
  const [importProductsXlsx, { isLoading: importUploading }] = useImportProductsXlsxMutation();

  const getExportMatrix = useCallback(() => productExportRows(products), [products]);
  const getExportFilename = useCallback(() => {
    const stamp = new Date().toISOString().slice(0, 10);
    return `san-pham-trang-${pageIndex + 1}-${stamp}`;
  }, [pageIndex]);
  const getTemplateMatrix = useCallback(() => getProductImportTemplateAoA(), []);

  const dialogDescription = useMemo(
    () => (
      <>
        Dùng <strong>sheet đầu</strong> (.xlsx). Phần xem trước chỉ giúp đối chiếu nhanh; bấm{" "}
        <strong>Import lên máy chủ</strong> để gửi file và tạo sản phẩm theo API{" "}
        <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">POST /products/import</code>.
        BE bắt buộc <strong>name</strong>, <strong>baseUnit</strong> và <strong>categoryId</strong> hoặc{" "}
        <strong>categoryCode</strong> (có thể dùng alias tiếng Việt trên dòng tiêu đề).
      </>
    ),
    [],
  );

  const handleUpload = useCallback(
    async (file: File) => {
      try {
        const res = await importProductsXlsx({ file }).unwrap();
        const d = res.data;
        const msg = res.message?.trim() || "Import hoàn tất";
        if (d.failureCount > 0) {
          toast.warning(msg, {
            description: `Thành công ${d.success} / ${d.attempted} dòng đã xử lý; ${d.failureCount} dòng lỗi.`,
          });
        } else {
          toast.success(msg, {
            description:
              d.attempted > 0
                ? `Đã tạo ${d.success} sản phẩm (${d.attempted} dòng đã xử lý).`
                : "Không có dòng dữ liệu nào được xử lý.",
          });
        }
        if (d.errors.length > 0) {
          const lines = d.errors
            .slice(0, 12)
            .map((e) => `Dòng ${e.rowNumber}: ${e.message}`)
            .join("\n");
          toast.message("Chi tiết lỗi (tối đa 12 dòng đầu)", {
            description: lines,
            duration: 14_000,
          });
        }
      } catch (e) {
        toast.error(apiErrMessage(e));
        throw e;
      }
    },
    [importProductsXlsx],
  );

  return (
    <ImportExportXlsxMenu
      sheetName={PRODUCT_XLSX_SHEET_NAME}
      getExportMatrix={getExportMatrix}
      exportDisabled={products.length === 0}
      getExportFilename={getExportFilename}
      getTemplateMatrix={getTemplateMatrix}
      templateBasename="mau-nhap-san-pham"
      importConfig={PRODUCT_XLSX_IMPORT_CONFIG}
      exportItemLabel="Xuất .xlsx — trang hiện tại"
      dialogTitle="Kiểm tra file nhập sản phẩm"
      importPreviewCountLabel="dòng sản phẩm"
      dialogDescription={dialogDescription}
      successHint="Tên sản phẩm, nhóm hàng (UUID hoặc mã DM) và đơn vị tính đã có trên các dòng."
      onUploadToServer={handleUpload}
      serverUploadPending={importUploading}
    />
  );
}
