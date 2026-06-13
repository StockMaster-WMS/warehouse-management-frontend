"use client";

import { useSyncExternalStore } from "react";
import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type PrintableColumn = {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
};

export type PrintableDocumentRow = Record<string, string | number | null | undefined>;

type PrintableDocumentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  printAreaId: string;
  title: string;
  documentNo: string;
  subtitle?: string;
  meta: Array<{ label: string; value?: string | number | null }>;
  columns: PrintableColumn[];
  rows: PrintableDocumentRow[];
  note?: string | null;
  signatures?: string[];
};

let clientPrintedAtSnapshot: string | null = null;
const subscribePrintedAt = () => () => {};
const getServerPrintedAt = () => "--";
const getClientPrintedAt = () => {
  clientPrintedAtSnapshot ??= new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());
  return clientPrintedAtSnapshot;
};

function formatCell(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "--";
  if (typeof value === "number") return value.toLocaleString("vi-VN");
  return value;
}

function HeaderInfoLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[86px_1fr] gap-2 text-left leading-snug">
      <span className="font-semibold text-slate-700">{label}:</span>
      <span className="min-w-0 break-words font-semibold">{formatCell(value as string | number | null | undefined)}</span>
    </div>
  );
}

export function PrintableDocumentModal({
  open,
  onOpenChange,
  printAreaId,
  title,
  documentNo,
  subtitle,
  meta,
  columns,
  rows,
  note,
  signatures = ["Người lập phiếu", "Thủ kho", "Người duyệt"],
}: PrintableDocumentModalProps) {
  const printedAt = useSyncExternalStore(
    subscribePrintedAt,
    getClientPrintedAt,
    getServerPrintedAt,
  );

  const handlePrint = () => {
    const printContent = document.getElementById(printAreaId);
    if (!printContent) return;

    const printWindow = window.open("", "_blank", "width=900,height=900");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${title} - ${documentNo}</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            * { box-sizing: border-box; }
            body { margin: 0; background: white; color: #111827; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.35; }
            section { min-height: auto !important; width: 100% !important; padding: 0 !important; border: 0 !important; box-shadow: none !important; }
            h1 { margin: 0; font-size: 22px; letter-spacing: .12em; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border-left: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; padding: 8px 9px; vertical-align: top; }
            th { border-top: 2px solid #1f2937; border-bottom: 2px solid #1f2937; background: #f8fafc; font-weight: 700; }
            .print-hidden { display: none !important; }
          </style>
        </head>
        <body>${printContent.outerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] !w-[calc(210mm+2rem)] !max-w-[calc(100vw-1rem)] overflow-auto bg-slate-100 print:max-h-none print:!w-auto print:!max-w-none print:overflow-visible print:border-none print:p-0 print:shadow-none sm:!max-w-[calc(210mm+2rem)]">
        <DialogHeader className="sticky top-0 z-10 flex flex-col gap-3 border-b border-slate-200 bg-slate-100 pb-4 pr-10 print:hidden sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <DialogTitle className="text-lg font-bold sm:text-xl">{title}</DialogTitle>
            <DialogDescription>
              Nhấn nút in để tạo bản cứng cho kho lưu trữ hoặc xử lý vận hành.
            </DialogDescription>
          </div>
          <Button onClick={handlePrint} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 sm:w-auto">
            <Printer className="size-4" />
            In Phiếu
          </Button>
        </DialogHeader>

        <section
          id={printAreaId}
          className="mx-auto flex min-h-[297mm] w-[210mm] flex-col overflow-hidden border border-slate-200 bg-white p-[12mm] text-black shadow-sm print:m-0 print:min-h-[297mm] print:w-full print:border-none print:p-0 print:shadow-none"
        >
          <div className="mb-6 grid grid-cols-[1fr_285px] items-end gap-6 border-b-2 border-slate-800 pb-4">
            <div className="min-w-0">
              <h1 className="break-words text-xl font-semibold uppercase tracking-widest sm:text-2xl">
                {title}
              </h1>
              <p className="font-mono mt-1 text-sm font-semibold">
                Mã phiếu: {documentNo}
              </p>
              {subtitle ? <p className="mt-1 text-xs font-semibold text-slate-600">{subtitle}</p> : null}
            </div>
            <div className="space-y-1 rounded-sm bg-slate-50 px-3 py-2 text-sm">
              <HeaderInfoLine label="Ngày in" value={printedAt} />
              <HeaderInfoLine label="Số dòng" value={rows.length} />
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-5 text-sm sm:grid-cols-2 sm:gap-8">
            <div className="space-y-1">
              <p className="mb-2 border-b border-slate-300 pb-1 text-xs font-bold uppercase tracking-wider">
                Thông tin chứng từ
              </p>
              {meta.filter((_, index) => index % 2 === 0).map((item) => (
                <HeaderInfoLine key={item.label} label={item.label} value={item.value} />
              ))}
            </div>
            <div className="space-y-1">
              <p className="mb-2 border-b border-slate-300 pb-1 text-xs font-bold uppercase tracking-wider">
                Thông tin xử lý
              </p>
              {meta.filter((_, index) => index % 2 === 1).map((item) => (
                <HeaderInfoLine key={item.label} label={item.label} value={item.value} />
              ))}
            </div>
          </div>

          <div className="mb-8 flex-1 overflow-hidden print:overflow-visible">
            <table className="w-full table-fixed border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-y-2 border-slate-800 bg-slate-50 font-bold">
                  <th className="w-10 border-x border-slate-300 px-1.5 py-2 text-center sm:px-2 sm:py-2.5">
                    STT
                  </th>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={
                        column.align === "right"
                          ? "border-x border-slate-300 px-1.5 py-2 text-right sm:px-2 sm:py-2.5"
                          : column.align === "center"
                            ? "border-x border-slate-300 px-1.5 py-2 text-center sm:px-2 sm:py-2.5"
                            : "border-x border-slate-300 px-1.5 py-2 text-left sm:px-2 sm:py-2.5"
                      }
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((row, index) => (
                    <tr key={`${documentNo}-${index}`} className="break-inside-avoid border-b border-slate-300">
                      <td className="border-x border-slate-300 p-1.5 text-center tabular-nums sm:p-2">{index + 1}</td>
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={
                            column.align === "right"
                              ? "border-x border-slate-300 p-1.5 text-right tabular-nums sm:p-2"
                              : column.align === "center"
                                ? "border-x border-slate-300 p-1.5 text-center sm:p-2"
                                : "break-words border-x border-slate-300 p-1.5 text-left sm:p-2"
                          }
                        >
                          {formatCell(row[column.key])}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length + 1} className="border-x border-b border-slate-300 py-8 text-center text-slate-500">
                      Không có dòng dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {note ? (
            <div className="mb-8 rounded-sm border border-slate-300 bg-slate-50 p-3 text-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Ghi chú</p>
              <p className="mt-1 whitespace-pre-wrap">{note}</p>
            </div>
          ) : null}

          <footer className="mt-auto grid break-inside-avoid grid-cols-3 gap-4 pt-12 text-center text-sm">
            {signatures.map((label) => (
              <div key={label} className="mx-auto w-full max-w-48">
                <p className="mb-12 font-bold sm:mb-16">{label}</p>
                <p className="border-t border-slate-400 pt-1 italic text-slate-500">
                  (Ký, ghi rõ họ tên)
                </p>
              </div>
            ))}
          </footer>
        </section>
      </DialogContent>
    </Dialog>
  );
}
