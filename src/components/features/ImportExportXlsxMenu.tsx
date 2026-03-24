"use client";

import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { ChevronDown, Download, FileDown, FileUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  buildImportPreviewFromXlsx,
  type ImportPreview,
  type XlsxImportPreviewConfig,
} from "@/lib/xlsx-import-preview";
import { downloadAoAAsXlsx, type AoA } from "@/lib/xlsx-utils";

export type ImportExportXlsxMenuProps = {
  /** Ma trận xuất: dòng đầu thường là header. */
  getExportMatrix: () => AoA;
  exportDisabled?: boolean;
  /** Tên file xuất (có hoặc không .xlsx đều được). */
  getExportFilename: () => string;
  getTemplateMatrix: () => AoA;
  /** Tên file mẫu, không cần đuôi .xlsx */
  templateBasename: string;
  importConfig: XlsxImportPreviewConfig;
  sheetName?: string;
  dialogTitle?: string;
  dialogDescription?: ReactNode;
  successHint?: string;
  /** Gắn sau số đếm, ví dụ: "dòng sản phẩm", "bản ghi". */
  importPreviewCountLabel?: string;
  menuGroupLabel?: string;
  exportItemLabel?: string;
  templateItemLabel?: string;
  importItemLabel?: string;
  triggerClassName?: string;
};

const defaultDescription = (
  <>
    Chỉ đọc <strong>sheet đầu</strong>. Dữ liệu <strong>chưa lưu</strong> vào hệ thống cho đến khi đồng bộ máy chủ.
  </>
);

export function ImportExportXlsxMenu({
  getExportMatrix,
  exportDisabled = false,
  getExportFilename,
  getTemplateMatrix,
  templateBasename,
  importConfig,
  sheetName = "Sheet1",
  dialogTitle = "Kiểm tra file nhập",
  dialogDescription = defaultDescription,
  successHint = "Các cột bắt buộc đã đủ; không thấy ô trống trên các dòng đã nhập.",
  importPreviewCountLabel = "dòng dữ liệu",
  menuGroupLabel = "Excel (.xlsx)",
  exportItemLabel = "Xuất .xlsx",
  templateItemLabel = "Tải mẫu nhập",
  importItemLabel = "Nhập từ .xlsx…",
  triggerClassName = "hidden sm:inline-flex border-slate-200",
}: ImportExportXlsxMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importParseError, setImportParseError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);

  const closeImportDialog = (open: boolean) => {
    setImportDialogOpen(open);
    if (!open) {
      setImportParseError(null);
      setImportPreview(null);
    }
  };

  const handleExport = () => {
    const rows = getExportMatrix();
    downloadAoAAsXlsx(getExportFilename(), sheetName, rows);
    toast.success("Đã tải file xuất");
  };

  const handleTemplate = () => {
    downloadAoAAsXlsx(`${templateBasename}.xlsx`, sheetName, getTemplateMatrix());
    toast.success("Đã tải file mẫu");
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setImportParseError(null);
    setImportPreview(null);
    if (!file) return;

    try {
      const buf = await file.arrayBuffer();
      const preview = buildImportPreviewFromXlsx(buf, importConfig);
      if (!preview) {
        setImportParseError("File trống hoặc không đọc được sheet / tiêu đề cột.");
        setImportDialogOpen(true);
        return;
      }
      setImportPreview(preview);
      setImportDialogOpen(true);
    } catch {
      setImportParseError("Không đọc được file .xlsx. Thử lưu lại định dạng Excel (.xlsx).");
      setImportDialogOpen(true);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={handleFileChange}
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm" className={triggerClassName}>
              <Download className="mr-2 h-4 w-4" />
              Nhập/Xuất Excel
              <ChevronDown className="ml-1 h-4 w-4 opacity-60" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="min-w-[240px] rounded-xl">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{menuGroupLabel}</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuItem className="rounded-lg" disabled={exportDisabled} onClick={handleExport}>
            <FileDown className="mr-2 h-4 w-4" />
            {exportItemLabel}
          </DropdownMenuItem>
          <DropdownMenuItem className="rounded-lg" onClick={handleTemplate}>
            <FileDown className="mr-2 h-4 w-4" />
            {templateItemLabel}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="rounded-lg"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp className="mr-2 h-4 w-4" />
            {importItemLabel}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={importDialogOpen} onOpenChange={closeImportDialog}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] gap-4 sm:max-w-2xl" showCloseButton>
          <DialogHeader className="gap-2 text-left">
            <DialogTitle className="text-lg sm:text-xl">{dialogTitle}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed sm:text-[15px]">
              {dialogDescription}
            </DialogDescription>
          </DialogHeader>

          {importParseError ? (
            <p className="text-base font-medium text-rose-600 dark:text-rose-400">{importParseError}</p>
          ) : importPreview ? (
            <div className="max-h-[min(60vh,520px)] space-y-4 overflow-y-auto pr-1">
              <p className="text-base text-slate-700 dark:text-slate-200">
                <span className="tabular-nums text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  {importPreview.dataRows.length}
                </span>
                <span className="ml-2 text-slate-600 dark:text-slate-300">
                  {importPreviewCountLabel}
                </span>
                <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">
                  Không tính hàng tiêu đề ở đầu file.
                </span>
              </p>

              {importPreview.issues.length > 0 ? (
                <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-amber-800 dark:text-amber-200/90 sm:text-[15px]">
                  {importPreview.issues.slice(0, 14).map((msg, i) => (
                    <li key={`${i}-${msg.slice(0, 24)}`}>{msg}</li>
                  ))}
                  {importPreview.issues.length > 14 ? (
                    <li>… và {importPreview.issues.length - 14} mục nữa.</li>
                  ) : null}
                </ul>
              ) : (
                <p className="text-sm leading-relaxed text-emerald-700 dark:text-emerald-300 sm:text-[15px]">
                  {successHint}
                </p>
              )}

              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full min-w-[520px] border-collapse text-left text-sm sm:text-[15px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80">
                      {importPreview.headers.map((h, hi) => (
                        <th
                          key={`col-${hi}`}
                          className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-200"
                        >
                          {h || "—"}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.dataRows.slice(0, 5).map((row, ri) => (
                      <tr
                        key={`preview-${ri}`}
                        className="border-b border-slate-100 dark:border-slate-800"
                      >
                        {importPreview.headers.map((_, ci) => (
                          <td
                            key={`preview-${ri}-${ci}`}
                            className="max-w-[200px] truncate px-3 py-2.5 text-slate-800 dark:text-slate-200"
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
              {importPreview.dataRows.length > 5 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Hiển thị 5 dòng đầu trong bảng.</p>
              ) : null}
            </div>
          ) : null}

          <DialogFooter className="sm:justify-end">
            <Button type="button" variant="outline" size="default" onClick={() => closeImportDialog(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
