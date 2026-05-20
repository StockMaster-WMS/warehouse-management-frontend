"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { ImportExportXlsxMenu } from "@/components/features/ImportExportXlsxMenu";
import {
  PRODUCT_XLSX_IMPORT_CONFIG,
  PRODUCT_XLSX_SHEET_NAME,
  getProductImportTemplateAoA,
} from "@/lib/product-xlsx";
import {
  useImportProductsXlsxMutation,
  useExportProductsXlsxMutation,
  type GetProductsParams,
} from "@/store/services/product.service";
import { apiErrMessage } from "@/types/api";
import type { Product } from "@/types/product";

export type ProductImportExportMenuProps = {
  products: Product[];
  pageIndex: number;
  listParams?: GetProductsParams;
};

export function ProductImportExportMenu({ products, listParams }: ProductImportExportMenuProps) {
  const [importProductsXlsx, { isLoading: importUploading }] = useImportProductsXlsxMutation();
  const [exportProductsXlsx] = useExportProductsXlsxMutation();

  const handleExportFromServer = useCallback(async () => {
    try {
      const toastId = toast.loading("Đang xuất dữ liệu...");
      const params = listParams ? { ...listParams } : {};
      delete params.page;
      delete params.size;
      delete params.sort;
      
      const blob = await exportProductsXlsx(params).unwrap();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const stamp = new Date().toISOString().slice(0, 10);
      link.setAttribute("download", `products-export-${stamp}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Xuất dữ liệu thành công", { id: toastId });
    } catch (e) {
      toast.error(apiErrMessage(e) || "Lỗi khi xuất dữ liệu");
    }
  }, [exportProductsXlsx, listParams]);

  const getTemplateMatrix = useCallback(() => getProductImportTemplateAoA(), []);

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
      onExport={handleExportFromServer}
      sheetName={PRODUCT_XLSX_SHEET_NAME}
      exportDisabled={products.length === 0}
      getTemplateMatrix={getTemplateMatrix}
      templateBasename="mau-nhap-san-pham"
      importConfig={PRODUCT_XLSX_IMPORT_CONFIG}
      exportItemLabel="Xuất tất cả kết quả (.xlsx)"
      dialogTitle="Kiểm tra file nhập sản phẩm"
      importPreviewCountLabel="dòng sản phẩm"
      successHint="Tên sản phẩm, nhóm hàng và đơn vị tính đã có trên các dòng."
      onUploadToServer={handleUpload}
      serverUploadPending={importUploading}
    />
  );
}
