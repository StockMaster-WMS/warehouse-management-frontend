"use client";

import { useSyncExternalStore } from "react";
import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
            @page { size: A4; margin: 12mm; }
            * { box-sizing: border-box; }
            body { margin: 0; background: white; color: #111827; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.35; }
            section { min-height: auto !important; width: 100% !important; padding: 0 !important; border: 0 !important; box-shadow: none !important; }
            header { border-bottom: 2px solid #111827; padding-bottom: 14px; margin-bottom: 18px; }
            h1 { margin: 0; font-size: 22px; letter-spacing: .02em; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 9px; vertical-align: top; }
            th { background: #f1f5f9; text-transform: uppercase; font-size: 10px; letter-spacing: .04em; color: #334155; }
            tbody tr:nth-child(even) { background: #f8fafc; }
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
      <DialogContent className="max-h-[90vh] !w-[calc(210mm+1.5rem)] !max-w-[calc(100vw-1rem)] overflow-auto bg-slate-100 p-3 print:max-h-none print:!w-auto print:!max-w-none print:overflow-visible print:border-none print:p-0 print:shadow-none sm:!max-w-[calc(210mm+1.5rem)]">
        <DialogHeader className="sticky top-0 z-10 flex flex-col gap-3 border-b border-slate-200 bg-slate-100 pb-4 pr-10 print:hidden sm:flex-row sm:items-center sm:justify-between">
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
          <Button onClick={handlePrint} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Printer className="size-4" />
            In phiếu
          </Button>
        </DialogHeader>

        <section
          id={printAreaId}
          className="mx-auto flex min-h-[297mm] w-[210mm] flex-col overflow-hidden border border-slate-200 bg-white p-[12mm] text-slate-950 shadow-sm print:m-0 print:min-h-auto print:w-full print:border-none print:p-0 print:shadow-none"
        >
          <header className="border-b-2 border-slate-950 pb-4">
            <div className="flex items-start justify-between gap-6">
              <div className="max-w-[45%]">
                <p className="text-sm font-black uppercase tracking-wide">StockMaster WMS</p>
                <p className="mt-1 text-[11px] text-slate-600">Hệ thống quản lý kho</p>
              </div>
              <div className="max-w-[55%] text-right">
                <h1 className="text-2xl font-black uppercase tracking-wide">{title}</h1>
                <p className="mt-2 inline-block rounded border border-slate-300 bg-slate-50 px-2 py-1 font-mono text-sm font-bold">
                  {documentNo}
                </p>
                {subtitle ? <p className="mt-2 text-[11px] text-slate-600">{subtitle}</p> : null}
              </div>
            </div>
          </header>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {[...meta, { label: "Thời điểm in", value: printedAt }].map((item) => (
              <div key={item.label} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  {item.label}
                </p>
                <p className="mt-1 break-words text-sm font-semibold text-slate-950">{formatCell(item.value)}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex-1">
            <table className="w-full table-fixed border-collapse text-[12px]">
              <thead>
                <tr>
                  <th className="w-10 border border-slate-300 bg-slate-100 px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    STT
                  </th>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={
                        column.align === "right"
                          ? "border border-slate-300 bg-slate-100 px-2 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-slate-700"
                          : column.align === "center"
                            ? "border border-slate-300 bg-slate-100 px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-700"
                            : "border border-slate-300 bg-slate-100 px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-700"
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
                    <tr key={`${documentNo}-${index}`} className="odd:bg-white even:bg-slate-50">
                      <td className="border border-slate-300 px-2 py-2 text-center tabular-nums">{index + 1}</td>
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={
                            column.align === "right"
                              ? "border border-slate-300 px-2 py-2 text-right tabular-nums"
                              : column.align === "center"
                                ? "border border-slate-300 px-2 py-2 text-center"
                                : "break-words border border-slate-300 px-2 py-2 text-left"
                          }
                        >
                          {formatCell(row[column.key])}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length + 1} className="border border-slate-300 py-8 text-center text-slate-500">
                      Không có dòng dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {note ? (
            <div className="mt-5 rounded-md border border-slate-300 bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600">Ghi chú</p>
              <p className="mt-1 whitespace-pre-wrap">{note}</p>
            </div>
          ) : null}

          <footer className="mt-12 grid grid-cols-3 gap-8 text-center">
            {signatures.map((label) => (
              <div key={label}>
                <p className="font-bold">{label}</p>
                <p className="mt-1 text-[11px] italic">(Ký, ghi rõ họ tên)</p>
                <div className="h-20 border-b border-slate-300" />
              </div>
            ))}
          </footer>
        </section>
      </DialogContent>
    </Dialog>
  );
}
