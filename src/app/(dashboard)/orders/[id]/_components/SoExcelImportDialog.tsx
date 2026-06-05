"use client";

import { useRef, useState, type ChangeEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
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
  type XlsxImportPreviewConfig,
} from "@/lib/xlsx-import-preview";
import { downloadAoAAsXlsx } from "@/lib/xlsx-utils";
import { apiErrMessage } from "@/types/api";
import type { Product } from "@/types/product";
import type { SalesOrder } from "@/types/sales-order";
import type { SoItem } from "@/types/so-item";
import {
  useCreateSoItemMutation,
  useUpdateSoItemMutation,
} from "@/store/services/so-item.service";
import { parsePositiveNumber } from "./OrderDetailUtils";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const SO_LINES_XLSX_SHEET_NAME = "DongHangXuat";
const SO_LINES_IMPORT_CONFIG: XlsxImportPreviewConfig = {
  expectedHeaders: ["orderedQty"],
  requireAnyHeaderInEachGroup: [["productSku", "sku", "productId", "product"]],
  requireAnyValueInEachRowGroup: [["productSku", "sku", "productId", "product"]],
  fieldLabels: {
    productSku: "Mã hàng",
    sku: "Mã hàng",
    productId: "UUID sản phẩm",
    product: "Sản phẩm",
    orderedQty: "Số lượng đặt",
    unitPrice: "Đơn giá",
  },
};

type Step = "upload" | "preview" | "result";

type ImportCreatedLine = {
  lineNumber: number;
  productSku: string;
  orderedQty: number;
  unitPrice?: number | null;
};

type ImportErrorLine = {
  rowNumber: number;
  message: string;
};

type ImportResult = {
  attempted: number;
  successCount: number;
  failureCount: number;
  createdItems: ImportCreatedLine[];
  errors: ImportErrorLine[];
};

type ImportProductRef = {
  id: string;
  sku?: string | null;
  name?: string | null;
};

export interface SoExcelImportDialogProps {
  salesOrder: SalesOrder;
  soItems: SoItem[];
  importProducts: Product[];
  importProductsLoading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getSalesOrderLinesImportTemplateAoA() {
  return [
    ["productSku", "orderedQty", "unitPrice"],
    ["SKU-001", "5", "120000"],
  ];
}

function findImportProduct(products: Product[], raw: string): ImportProductRef | null {
  const key = raw.trim().toLowerCase();
  if (!key) return null;
  return products.find((product) =>
    String(product.id).toLowerCase() === key ||
    String(product.sku ?? "").toLowerCase() === key ||
    String(product.name ?? "").trim().toLowerCase() === key
  ) ?? null;
}

function getHeaderIndex(headers: string[], names: string[]) {
  const normalized = new Map(headers.map((header, index) => [header.trim().toLowerCase(), index]));
  for (const name of names) {
    const index = normalized.get(name.toLowerCase());
    if (index != null) return index;
  }
  return null;
}

function getCreatedItemSku(item: ImportCreatedLine) {
  return item.productSku || "—";
}

export function SoExcelImportDialog({
  salesOrder,
  soItems,
  importProducts,
  importProductsLoading,
  open,
  onOpenChange,
}: SoExcelImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedFileRef = useRef<File | null>(null);
  const [step, setStep] = useState<Step>("upload");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [createSoItem, { isLoading: creating }] = useCreateSoItemMutation();
  const [updateSoItem, { isLoading: updating }] = useUpdateSoItemMutation();
  const uploading = creating || updating;

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
      "mau-import-dong-hang-don-xuat.xlsx",
      SO_LINES_XLSX_SHEET_NAME,
      getSalesOrderLinesImportTemplateAoA(),
    );
    toast.success("Đã tải file mẫu");
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      selectedFileRef.current = null;
      setParseError("File vượt quá 5MB. Vui lòng chọn file nhỏ hơn.");
      setStep("preview");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      selectedFileRef.current = null;
      setParseError("Chỉ chấp nhận file .xlsx.");
      setStep("preview");
      return;
    }

    selectedFileRef.current = file;
    setParseError(null);

    try {
      const previewData = await buildImportPreviewFromXlsx(
        await file.arrayBuffer(),
        SO_LINES_IMPORT_CONFIG,
      );
      if (!previewData) {
        setParseError("File trống hoặc không đọc được tiêu đề cột.");
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
    if (!selectedFile || !preview) return;
    if (importProductsLoading) {
      toast.error("Đang tải danh sách sản phẩm theo kho, thử lại sau vài giây.");
      return;
    }

    const productCol = getHeaderIndex(preview.headers, ["productSku", "sku", "productId", "product"]);
    const qtyCol = getHeaderIndex(preview.headers, ["orderedQty", "qty", "quantity", "soluong"]);
    const priceCol = getHeaderIndex(preview.headers, ["unitPrice", "price", "dongia"]);

    if (productCol == null || qtyCol == null) {
      setResult({
        attempted: 0,
        successCount: 0,
        failureCount: 1,
        createdItems: [],
        errors: [{ rowNumber: 1, message: "File cần có cột productSku/sku/productId/product và orderedQty/qty." }],
      });
      setStep("result");
      return;
    }

    const existingByProductId = new Map(
      soItems.map((item) => [
        String(item.productId),
        {
          id: item.id,
          lineNumber: item.lineNumber,
          orderedQty: Number(item.orderedQty || 0),
          unitPrice: item.unitPrice,
        },
      ]),
    );
    let nextNumber = soItems.length === 0 ? 1 : Math.max(...soItems.map((item) => item.lineNumber)) + 1;
    const createdItems: ImportCreatedLine[] = [];
    const errors: ImportErrorLine[] = [];
    let attempted = 0;

    for (const [rowIndex, row] of preview.dataRows.entries()) {
      attempted += 1;
      const excelLine = rowIndex + 2;
      const product = findImportProduct(importProducts, row[productCol] ?? "");
      const qty = parsePositiveNumber(row[qtyCol] ?? "");
      const rawPrice = priceCol != null ? row[priceCol] ?? "" : "";
      const parsedPrice = rawPrice.trim() ? Number(rawPrice.replace(",", ".")) : undefined;
      const unitPrice = typeof parsedPrice === "number" && Number.isFinite(parsedPrice) && parsedPrice >= 0
        ? parsedPrice
        : undefined;

      if (!product) {
        errors.push({ rowNumber: excelLine, message: "Không tìm thấy sản phẩm trong kho đã chọn." });
        continue;
      }
      if (qty == null) {
        errors.push({ rowNumber: excelLine, message: "Số lượng không hợp lệ." });
        continue;
      }

      try {
        const existing = existingByProductId.get(String(product.id));
        if (existing) {
          const nextOrderedQty = existing.orderedQty + qty;
          await updateSoItem({
            id: existing.id,
            body: {
              salesOrderId: salesOrder.id,
              lineNumber: existing.lineNumber,
              productId: String(product.id),
              productSku: String(product.sku ?? ""),
              orderedQty: nextOrderedQty,
              unitPrice: unitPrice ?? existing.unitPrice ?? undefined,
            },
          }).unwrap();
          existingByProductId.set(String(product.id), {
            ...existing,
            orderedQty: nextOrderedQty,
            unitPrice: unitPrice ?? existing.unitPrice,
          });
          createdItems.push({
            lineNumber: existing.lineNumber,
            productSku: String(product.sku ?? product.id),
            orderedQty: nextOrderedQty,
            unitPrice: unitPrice ?? existing.unitPrice,
          });
        } else {
          const res = await createSoItem({
            salesOrderId: salesOrder.id,
            lineNumber: nextNumber,
            productId: String(product.id),
            productSku: String(product.sku ?? ""),
            orderedQty: qty,
            ...(unitPrice != null ? { unitPrice } : {}),
          }).unwrap();
          const created = res.data;
          createdItems.push({
            lineNumber: created?.lineNumber ?? nextNumber,
            productSku: String(created?.productSku ?? product.sku ?? product.id),
            orderedQty: Number(created?.orderedQty ?? qty),
            unitPrice: created?.unitPrice ?? unitPrice,
          });
          if (created) {
            existingByProductId.set(String(product.id), {
              id: created.id,
              lineNumber: created.lineNumber,
              orderedQty: Number(created.orderedQty || 0),
              unitPrice: created.unitPrice,
            });
          }
          nextNumber += 1;
        }
      } catch (err) {
        errors.push({
          rowNumber: excelLine,
          message: apiErrMessage(err, "Không tạo/cập nhật được dòng hàng."),
        });
      }
    }

    const nextResult = {
      attempted,
      successCount: createdItems.length,
      failureCount: errors.length,
      createdItems,
      errors,
    };
    setResult(nextResult);
    setStep("result");

    if (nextResult.failureCount === 0) {
      toast.success("Import dòng hàng thành công");
    } else {
      toast.warning(`${nextResult.successCount} dòng thành công, ${nextResult.failureCount} dòng lỗi`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] gap-4 sm:max-w-3xl" showCloseButton>
        <DialogHeader className="gap-2 text-left">
          <DialogTitle className="text-lg sm:text-xl">Nhập dòng hàng từ Excel</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Chỉ import được khi đơn xuất đang ở trạng thái Nháp hoặc Sẵn sàng. File dùng mã hàng, UUID sản phẩm hoặc tên sản phẩm đã có trong kho xuất.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          aria-label="Chọn file Excel"
          onChange={handleFileChange}
        />

        <div className="max-h-[min(62vh,560px)] space-y-4 overflow-y-auto pr-1">
          {step === "upload" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <p className="font-semibold">Mẫu tối thiểu</p>
                <p className="mt-1 font-mono text-xs">productSku | orderedQty | unitPrice</p>
                <p className="mt-1 text-xs text-slate-500">Ví dụ: SKU-001 | 5 | 120000</p>
              </div>

              <button
                type="button"
                className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-indigo-500"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileSpreadsheet className="size-10 text-slate-400" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Bấm để chọn file .xlsx
                </p>
                <p className="text-xs text-slate-500">Tối đa 5MB</p>
              </button>

              <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleDownloadTemplate}>
                <Download className="mr-2 size-4" />
                Tải file mẫu (.xlsx)
              </Button>
            </div>
          )}

          {step === "preview" && (
            <>
              {parseError ? (
                <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{parseError}</p>
              ) : preview ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-700 dark:text-slate-200">
                    <span className="tabular-nums text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {preview.dataRows.length}
                    </span>
                    <span className="ml-2 text-slate-600 dark:text-slate-300">dòng hàng đọc được</span>
                  </p>

                  {preview.issues.length > 0 ? (
                    <ul className="list-disc space-y-1 pl-5 text-sm text-amber-800 dark:text-amber-200/90">
                      {preview.issues.slice(0, 10).map((msg) => (
                        <li key={msg}>{msg}</li>
                      ))}
                      {preview.issues.length > 10 && <li>... và {preview.issues.length - 10} mục nữa.</li>}
                    </ul>
                  ) : (
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      File có đủ cột tối thiểu. Hệ thống sẽ kiểm tra sản phẩm và số lượng khi import.
                    </p>
                  )}

                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                    <table className="w-full min-w-130 border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80">
                          {preview.headers.map((header, index) => (
                            <th key={`${header}-${index}`} className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">
                              {header || "—"}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.dataRows.slice(0, 5).map((row, rowIndex) => (
                          <tr key={`preview-row-${row.join("\u001f") || rowIndex}`} className="border-b border-slate-100 dark:border-slate-800">
                            {preview.headers.map((_, colIndex) => (
                              <td
                                key={`preview-cell-${rowIndex}-${colIndex}`}
                                className="max-w-44 truncate px-3 py-2 text-slate-800 dark:text-slate-200"
                                title={row[colIndex] ?? ""}
                              >
                                {row[colIndex]?.trim() ? row[colIndex] : "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {preview.dataRows.length > 5 && <p className="text-xs text-slate-500">Hiển thị 5 dòng đầu.</p>}
                </div>
              ) : null}
            </>
          )}

          {step === "result" && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {result.failureCount === 0 ? (
                  <CheckCircle2 className="size-8 text-emerald-500" />
                ) : (
                  <AlertTriangle className="size-8 text-amber-500" />
                )}
                <div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {result.successCount} dòng thành công
                    {result.failureCount > 0 && <span className="ml-2 text-rose-600">{result.failureCount} dòng lỗi</span>}
                  </p>
                  <p className="text-sm text-slate-500">Đã xử lý {result.attempted} dòng trong file Excel.</p>
                </div>
              </div>

              {result.createdItems.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b bg-emerald-50 dark:bg-emerald-900/30">
                        <TableHead>Dòng</TableHead>
                        <TableHead>Mã hàng</TableHead>
                        <TableHead className="text-right">SL đặt</TableHead>
                        <TableHead className="text-right">Đơn giá</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.createdItems.map((item, index) => (
                        <TableRow key={`${getCreatedItemSku(item)}-${item.lineNumber}-${index}`}>
                          <TableCell>{item.lineNumber}</TableCell>
                          <TableCell className="font-mono text-xs">{getCreatedItemSku(item)}</TableCell>
                          <TableCell className="text-right">{item.orderedQty}</TableCell>
                          <TableCell className="text-right">{item.unitPrice ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-rose-200 dark:border-rose-800">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b bg-rose-50 dark:bg-rose-900/30">
                        <TableHead>Dòng Excel</TableHead>
                        <TableHead>Lỗi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.errors.slice(0, 20).map((err) => (
                        <TableRow key={`${err.rowNumber}-${err.message}`}>
                          <TableCell>{err.rowNumber}</TableCell>
                          <TableCell className="text-rose-700 dark:text-rose-300">{err.message}</TableCell>
                        </TableRow>
                      ))}
                      {result.errors.length > 20 && (
                        <TableRow>
                          <TableCell colSpan={2} className="text-xs text-slate-500">
                            ... và {result.errors.length - 20} lỗi nữa.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {step === "upload" && <Button variant="outline" onClick={() => handleClose(false)}>Đóng</Button>}

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
                <Button className="bg-indigo-600 hover:bg-indigo-700" disabled={uploading} onClick={handleUpload}>
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Đang import…
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 size-4" />
                      Import lên máy chủ
                    </>
                  )}
                </Button>
              )}
            </>
          )}

          {step === "result" && (
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => handleClose(false)}>
              Đóng
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
