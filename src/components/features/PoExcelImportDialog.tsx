"use client";

import { useRef, useState, type ChangeEvent } from "react";
import {
  FileSpreadsheet,
  Download,
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  buildImportPreviewFromXlsx,
  type ImportPreview,
} from "@/lib/xlsx-import-preview";
import { downloadAoAAsXlsx } from "@/lib/xlsx-utils";
import {
  PO_PRODUCT_XLSX_IMPORT_CONFIG,
  PO_PRODUCT_XLSX_SHEET_NAME,
  getPoProductImportTemplateAoA,
} from "@/lib/po-product-xlsx";
import { useGetCategoriesQuery } from "@/store/services/category.service";
import { useImportProductsExcelMutation } from "@/store/services/purchase-order.service";
import type { ImportProductsExcelResult } from "@/types/purchase-order";
import { apiErrMessage } from "@/types/api";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export interface PoExcelImportDialogProps {
  purchaseOrderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "upload" | "preview" | "result";

export function PoExcelImportDialog({
  purchaseOrderId,
  open,
  onOpenChange,
}: PoExcelImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedFileRef = useRef<File | null>(null);
  const [step, setStep] = useState<Step>("upload");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportProductsExcelResult | null>(null);

  const { data: categoriesRes } = useGetCategoriesQuery();
  const categories = categoriesRes?.data?.content ?? [];

  const [importExcel, { isLoading: uploading }] =
    useImportProductsExcelMutation();

  function resetState() {
    setStep("upload");
    selectedFileRef.current = null;
    setPreview(null);
    setParseError(null);
    setResult(null);
  }

  function handleClose(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) resetState();
  }

  async function handleDownloadTemplate() {
    await downloadAoAAsXlsx(
      "mau-import-san-pham-po.xlsx",
      PO_PRODUCT_XLSX_SHEET_NAME,
      getPoProductImportTemplateAoA(),
    );
    toast.success("Đã tải file mẫu");
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setParseError("File vượt quá 5 MB. Vui lòng chọn file nhỏ hơn.");
      setStep("preview");
      return;
    }

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".xlsx")) {
      setParseError("Chỉ chấp nhận file .xlsx (Excel).");
      setStep("preview");
      return;
    }

    selectedFileRef.current = file;
    setParseError(null);

    try {
      const buf = await file.arrayBuffer();
      const previewData = await buildImportPreviewFromXlsx(
        buf,
        PO_PRODUCT_XLSX_IMPORT_CONFIG,
      );
      if (!previewData) {
        setParseError("File trống hoặc không đọc được sheet / tiêu đề cột.");
        setStep("preview");
        return;
      }
      setPreview(previewData);
      setStep("preview");
    } catch {
      setParseError("Không đọc được file. Hãy kiểm tra định dạng .xlsx.");
      setStep("preview");
    }
  }

  async function handleUpload() {
    const selectedFile = selectedFileRef.current;
    if (!selectedFile) return;
    try {
      const res = await importExcel({
        purchaseOrderId,
        file: selectedFile,
      }).unwrap();
      const data = (res.data ?? res) as ImportProductsExcelResult;
      setResult(data);
      setStep("result");

      if (data.failureCount === 0) {
        toast.success(`Import thành công ${data.successCount} sản phẩm`);
      } else {
        toast.warning(
          `${data.successCount} thành công, ${data.failureCount} lỗi`,
        );
      }
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-[calc(100vw-1.5rem)] gap-4 sm:max-w-2xl"
        showCloseButton
      >
        <DialogHeader className="gap-2 text-left">
          <DialogTitle className="text-lg sm:text-xl">
            Thêm sản phẩm bằng file Excel
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Tải file mẫu, điền thông tin sản phẩm &amp; số lượng, sau đó tải
            lên. Hệ thống sẽ tạo sản phẩm mới và thêm vào đơn nhập.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          aria-hidden
          aria-label="Chọn file Excel"
          tabIndex={-1}
          onChange={handleFileChange}
        />

        <div className="max-h-[min(60vh,520px)] space-y-4 overflow-y-auto pr-1">
          {/* --- Category reference table --- */}
          {step === "upload" && categories.length > 0 && (
            <details className="group rounded-lg border border-slate-200 dark:border-slate-700">
              <summary className="cursor-pointer select-none px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Danh mục sản phẩm (tham khảo UUID / mã)
                <span className="ml-1 text-xs text-slate-400 group-open:hidden">
                  — bấm để mở
                </span>
              </summary>
              <div className="max-h-48 overflow-y-auto border-t border-slate-200 dark:border-slate-700">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs">Tên danh mục</TableHead>
                      <TableHead className="text-xs">Mã (code)</TableHead>
                      <TableHead className="text-xs">
                        UUID (categoryId)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell className="py-1.5 text-sm">
                          {cat.name}
                        </TableCell>
                        <TableCell className="py-1.5 font-mono text-xs">
                          {cat.code}
                        </TableCell>
                        <TableCell
                          className="max-w-40 truncate py-1.5 font-mono text-xs text-slate-500"
                          title={cat.id}
                        >
                          {cat.id}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </details>
          )}

          {/* --- Upload step --- */}
          {step === "upload" && (
            <div className="space-y-3">
              <button
                type="button"
                className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-indigo-500"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileSpreadsheet className="h-10 w-10 text-slate-400" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Bấm để chọn file .xlsx
                </p>
                <p className="text-xs text-slate-500">Tối đa 5 MB</p>
              </button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleDownloadTemplate}
              >
                <Download className="mr-2 h-4 w-4" />
                Tải file mẫu (.xlsx)
              </Button>
            </div>
          )}

          {/* --- Preview step --- */}
          {step === "preview" && (
            <>
              {parseError ? (
                <p className="text-base font-medium text-rose-600 dark:text-rose-400">
                  {parseError}
                </p>
              ) : preview ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-700 dark:text-slate-200">
                    <span className="tabular-nums text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {preview.dataRows.length}
                    </span>
                    <span className="ml-2 text-slate-600 dark:text-slate-300">
                      dòng sản phẩm
                    </span>
                  </p>

                  {preview.issues.length > 0 ? (
                    <ul className="list-disc space-y-1 pl-5 text-sm text-amber-800 dark:text-amber-200/90">
                      {preview.issues.slice(0, 10).map((msg) => (
                        <li key={msg}>{msg}</li>
                      ))}
                      {preview.issues.length > 10 && (
                        <li>… và {preview.issues.length - 10} mục nữa.</li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      Các cột bắt buộc đã đủ; không phát hiện lỗi dữ liệu.
                    </p>
                  )}

                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                    <table className="w-full min-w-130 border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80">
                          {preview.headers.map((h, hi) => (
                            <th
                              key={`col-${hi}`}
                              className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700 dark:text-slate-200"
                            >
                              {h || "—"}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.dataRows.slice(0, 5).map((row, ri) => (
                          <tr
                            key={`row-${ri}`}
                            className="border-b border-slate-100 dark:border-slate-800"
                          >
                            {preview.headers.map((_, ci) => (
                              <td
                                key={`cell-${ri}-${ci}`}
                                className="max-w-44 truncate px-3 py-2 text-slate-800 dark:text-slate-200"
                                title={row[ci] ?? ""}
                              >
                                {row[ci]?.trim() ? row[ci] : "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {preview.dataRows.length > 5 && (
                    <p className="text-xs text-slate-500">
                      Hiển thị 5 dòng đầu.
                    </p>
                  )}
                </div>
              ) : null}
            </>
          )}

          {/* --- Result step --- */}
          {step === "result" && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {result.failureCount === 0 ? (
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                )}
                <div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {result.successCount} thành công
                    {result.failureCount > 0 && (
                      <span className="ml-2 text-rose-600">
                        {result.failureCount} lỗi
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-slate-500">
                    Sản phẩm đã được tạo và thêm vào đơn nhập hàng.
                  </p>
                </div>
              </div>

              {result.createdItems.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b bg-emerald-50 dark:bg-emerald-900/30">
                        <th className="px-3 py-2 font-semibold">Dòng</th>
                        <th className="px-3 py-2 font-semibold">Mã hàng</th>
                        <th className="px-3 py-2 font-semibold text-right">
                          SL đặt
                        </th>
                        <th className="px-3 py-2 font-semibold text-right">
                          Đơn giá
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.createdItems.map((item) => (
                        <tr
                          key={`${item.lineNumber}-${item.productSku}`}
                          className="border-b border-slate-100 dark:border-slate-800"
                        >
                          <td className="px-3 py-2">{item.lineNumber}</td>
                          <td className="px-3 py-2 font-mono text-xs">
                            {item.productSku}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {item.orderedQty}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {item.unitPrice ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-rose-200 dark:border-rose-800">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b bg-rose-50 dark:bg-rose-900/30">
                        <th className="px-3 py-2 font-semibold">Dòng</th>
                        <th className="px-3 py-2 font-semibold">Cột</th>
                        <th className="px-3 py-2 font-semibold">Lỗi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.slice(0, 20).map((err) => (
                        <tr
                          key={`${err.row}-${err.field ?? "row"}-${err.message}`}
                          className="border-b border-slate-100 dark:border-slate-800"
                        >
                          <td className="px-3 py-2">{err.row}</td>
                          <td className="px-3 py-2">{err.field ?? "—"}</td>
                          <td className="px-3 py-2 text-rose-700 dark:text-rose-300">
                            {err.message}
                          </td>
                        </tr>
                      ))}
                      {result.errors.length > 20 && (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-3 py-2 text-xs text-slate-500"
                          >
                            … và {result.errors.length - 20} lỗi nữa.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {step === "upload" && (
            <Button variant="outline" onClick={() => handleClose(false)}>
              Đóng
            </Button>
          )}

          {step === "preview" && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setStep("upload");
                  setPreview(null);
                  setParseError(null);
                  selectedFileRef.current = null;
                }}
              >
                Chọn lại file
              </Button>
              {preview && !parseError && (
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={uploading}
                  onClick={handleUpload}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang import…
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import lên máy chủ
                    </>
                  )}
                </Button>
              )}
            </>
          )}

          {step === "result" && (
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => handleClose(false)}
            >
              Đóng
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
