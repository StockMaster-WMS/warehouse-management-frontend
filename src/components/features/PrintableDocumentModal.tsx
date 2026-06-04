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
            body { margin: 0; background: white; color: #111827; font-family: Arial, sans-serif; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #d1d5db; padding: 6px 8px; vertical-align: top; }
            th { background: #f3f4f6; text-transform: uppercase; font-size: 10px; letter-spacing: .02em; }
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
      <DialogContent className="max-h-[90vh] !w-[calc(210mm+1rem)] !max-w-[calc(100vw-1rem)] overflow-auto bg-muted p-2 print:max-h-none print:!w-auto print:!max-w-none print:overflow-visible print:border-none print:p-0 print:shadow-none sm:!max-w-[calc(210mm+1rem)]">
        <DialogHeader className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-muted pb-4 pr-10 print:hidden sm:flex-row sm:items-center sm:justify-between">
          <DialogTitle>{title}</DialogTitle>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="size-4" />
            In phiếu
          </Button>
        </DialogHeader>

        <section
          id={printAreaId}
          className="mx-auto flex min-h-[297mm] w-[210mm] flex-col overflow-hidden border border-slate-200 bg-white p-[12mm] text-black shadow-sm print:m-0 print:min-h-[297mm] print:border-none print:p-0 print:shadow-none"
        >
          <header className="border-b-2 border-black pb-4">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs font-bold uppercase">StockMaster WMS</p>
                <p className="mt-1 text-[11px]">Hệ thống quản lý kho</p>
              </div>
              <div className="text-right">
                <h1 className="text-xl font-black uppercase">{title}</h1>
                <p className="mt-1 font-mono text-sm font-bold">{documentNo}</p>
                {subtitle ? <p className="mt-1 text-[11px]">{subtitle}</p> : null}
              </div>
            </div>
          </header>

          <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-2">
            {[...meta, { label: "Thời điểm in", value: printedAt }].map((item) => (
              <div key={item.label} className="flex gap-2 border-b border-dotted border-slate-300 pb-1">
                <span className="w-28 shrink-0 text-[11px] font-bold uppercase text-slate-600">
                  {item.label}
                </span>
                <span className="font-medium">{formatCell(item.value)}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex-1">
            <table>
              <thead>
                <tr>
                  <th className="w-10 text-center">STT</th>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={
                        column.align === "right"
                          ? "text-right"
                          : column.align === "center"
                            ? "text-center"
                            : "text-left"
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
                    <tr key={`${documentNo}-${index}`}>
                      <td className="text-center">{index + 1}</td>
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={
                            column.align === "right"
                              ? "text-right"
                              : column.align === "center"
                                ? "text-center"
                                : "text-left"
                          }
                        >
                          {formatCell(row[column.key])}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length + 1} className="py-8 text-center text-slate-500">
                      Không có dòng dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {note ? (
            <div className="mt-5 border border-slate-300 p-3">
              <p className="text-[11px] font-bold uppercase text-slate-600">Ghi chú</p>
              <p className="mt-1 whitespace-pre-wrap">{note}</p>
            </div>
          ) : null}

          <footer className="mt-10 grid grid-cols-3 gap-8 text-center">
            {signatures.map((label) => (
              <div key={label}>
                <p className="font-bold">{label}</p>
                <p className="mt-1 text-[11px] italic">(Ký, ghi rõ họ tên)</p>
                <div className="h-20" />
              </div>
            ))}
          </footer>
        </section>
      </DialogContent>
    </Dialog>
  );
}
