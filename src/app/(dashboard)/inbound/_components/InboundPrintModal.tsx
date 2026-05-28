"use client";

import { Printer } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { InboundReceiptPrintResponse } from "@/types/inbound-receipt";

type InboundPrintModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: InboundReceiptPrintResponse;
  warehouseLabel: string;
  locationLabel?: string;
  title?: string;
};

function InfoLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 leading-relaxed">
      <span className="font-semibold whitespace-nowrap">{label}:</span>
      <span className="min-w-0 break-words">{value || "—"}</span>
    </div>
  );
}

function HeaderInfoLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[86px_1fr] gap-2 text-left leading-snug">
      <span className="font-semibold text-slate-700">{label}:</span>
      <span className="min-w-0 break-words font-semibold">{value || "—"}</span>
    </div>
  );
}

export function InboundPrintModal({
  open,
  onOpenChange,
  data,
  warehouseLabel,
  locationLabel,
  title = "PHIẾU NHẬP KHO",
}: InboundPrintModalProps) {
  const handlePrint = () => {
    const printContent = document.getElementById("print-area-inbound");
    if (!printContent) return;

    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(iframe);

    const contentWindow = iframe.contentWindow;
    if (!contentWindow) return;

    let styles = "";
    document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
      styles += node.outerHTML;
    });

    contentWindow.document.open();
    contentWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          ${styles}
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            body { background: white !important; -webkit-print-color-adjust: exact; margin: 0; }
            #print-area-inbound { box-shadow: none !important; border: none !important; width: 100% !important; max-width: none !important; padding: 0 !important; }
            .print\\:hidden { display: none !important; }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
          <script>
            setTimeout(() => {
              window.focus();
              window.print();
              setTimeout(() => {
                window.parent.document.body.removeChild(window.frameElement);
              }, 500);
            }, 600);
          </script>
        </body>
      </html>
    `);
    contentWindow.document.close();
  };

  const printableLocationLabel =
    locationLabel || data.locationName || data.locationCode || data.locationId;

  const formatDateTime = (dateVal: string | Date | number | null | undefined) => {
    if (!dateVal) return "—";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "—";
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    // Depending on precision needed, returning full datetime or just date
    // Backend gives "2026-04-09", so time might be 00:00. If we just want date:
    if (typeof dateVal === 'string' && dateVal.length === 10) {
      return `${day}/${month}/${year}`;
    }
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] !w-[calc(210mm+1rem)] !max-w-[calc(100vw-1rem)] overflow-auto bg-muted p-2 print:max-h-none print:!w-auto print:!max-w-none print:overflow-visible print:border-none print:p-0 print:shadow-none sm:!max-w-[calc(210mm+1rem)]">
        <DialogHeader className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-muted pb-4 pr-10 print:hidden sm:flex-row sm:items-center sm:justify-between">
          <div>
            <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
            <DialogDescription>
              Nhấn nút in để tạo bản cứng cho kho lưu trữ hoặc nhà cung cấp.
            </DialogDescription>
          </div>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="size-4" /> In Phiếu
          </Button>
        </DialogHeader>

        {/* Printable Area */}
        <div
          className="mx-auto flex min-h-[297mm] w-[210mm] flex-col overflow-hidden border border-slate-200 bg-white p-[11mm] text-black shadow-sm print:m-0 print:min-h-[297mm] print:border-none print:p-0 print:shadow-none"
          id="print-area-inbound"
        >
          <div className="mb-6 grid grid-cols-[1fr_285px] items-end gap-6 border-b-2 border-slate-800 pb-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold uppercase tracking-widest">{title}</h1>
              <p className="font-mono mt-1 text-sm font-semibold">
                Mã đơn: {data.receiptNumber || `GRN-${data.id.slice(0, 8)}`}
              </p>
            </div>
            <div className="space-y-1 rounded-sm bg-slate-50 px-3 py-2 text-sm">
              <HeaderInfoLine
                label="Ngày in"
                value={
                  <span suppressHydrationWarning>
                    {data.receivedDate ? formatDateTime(data.receivedDate) : formatDateTime(new Date())}
                  </span>
                }
              />
              <HeaderInfoLine label="Kho nhập" value={warehouseLabel} />
            </div>
          </div>

          <div className="mb-7 grid grid-cols-2 gap-8 text-sm">
            <div className="space-y-1">
              <p className="font-bold border-b border-slate-300 pb-1 mb-2 uppercase text-xs tracking-wider">
                Thông tin Nhà cung cấp
              </p>
              <InfoLine label="Nhà cung cấp" value={data.supplierName || "—"} />
              <InfoLine label="Địa chỉ" value={data.supplierAddress || "—"} />
              <InfoLine label="Điện thoại" value={data.supplierPhone || "—"} />
            </div>
            <div className="space-y-1">
              <p className="font-bold border-b border-slate-300 pb-1 mb-2 uppercase text-xs tracking-wider">
                Thông tin Đơn nhập
              </p>
              <InfoLine label="Đơn nhập" value={data.poNumber || "—"} />
              <InfoLine label="Ngày nhập" value={data.receivedDate ? formatDateTime(data.receivedDate) : "—"} />
              {data.note && (
                <InfoLine label="Ghi chú" value={data.note} />
              )}
            </div>
          </div>

          <table className="mb-8 w-full table-fixed border-collapse text-[13px]">
            <colgroup>
              <col className="w-[7%]" />
              <col className="w-[15%]" />
              <col className="w-[34%]" />
              <col className="w-[9%]" />
              <col className="w-[10%]" />
              <col className="w-[13%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead>
              <tr className="border-y-2 border-slate-800 font-bold bg-slate-50">
                <th className="py-2.5 px-2 text-center border-x border-slate-300">STT</th>
                <th className="py-2.5 px-2 text-left border-x border-slate-300">Mã SP</th>
                <th className="py-2.5 px-2 text-left border-x border-slate-300">Tên sản phẩm</th>
                <th className="py-2.5 px-2 text-center border-x border-slate-300">ĐVT</th>
                <th className="py-2.5 px-2 text-right border-x border-slate-300">SL Đặt</th>
                <th className="py-2.5 px-2 text-right border-x border-slate-300">SL Thực nhận</th>
                <th className="py-2.5 px-2 text-left border-x border-slate-300">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {data.items && data.items.length > 0 ? (
                data.items.map((item, idx) => (
                  <tr key={`${item.lineNumber ?? idx}-${item.productSku ?? item.productName ?? "item"}`} className="border-b border-slate-300 break-inside-avoid">
                    <td className="p-2 text-center border-x border-slate-300">{item.lineNumber || idx + 1}</td>
                    <td className="break-words p-2 font-mono text-[12px] border-x border-slate-300">
                      {item.productSku || "—"}
                    </td>
                    <td className="break-words p-2 leading-snug border-x border-slate-300">
                      {item.productName || item.productSku || "—"}
                    </td>
                    <td className="p-2 text-center border-x border-slate-300">
                      {item.unit || "—"}
                    </td>
                    <td className="p-2 text-right border-x border-slate-300">
                      {item.orderedQty ?? 0}
                    </td>
                    <td className="p-2 text-right font-bold border-x border-slate-300">
                      {item.receivedQty ?? 0}
                    </td>
                    <td className="break-words p-2 text-left text-xs border-x border-slate-300">
                      {item.note || ""}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-4 text-center border-x border-b border-slate-300 text-slate-500">
                    Không có sản phẩm nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-auto grid break-inside-avoid grid-cols-3 gap-4 pt-12 text-center text-sm">
            <div className="mx-auto w-full max-w-48">
              <p className="font-bold mb-16">Người lập phiếu</p>
              <p className="border-t border-slate-400 pt-1 text-slate-500 italic">
                (Ký, ghi rõ họ tên)
              </p>
            </div>
            <div className="mx-auto w-full max-w-48">
              <p className="font-bold mb-16">Thủ kho</p>
              <p className="border-t border-slate-400 pt-1 text-slate-500 italic">
                (Ký, ghi rõ họ tên)
              </p>
              {data.receivedBy && <p className="mt-2 font-semibold text-slate-800">{data.receivedBy}</p>}
            </div>
            <div className="mx-auto w-full max-w-48">
              <p className="font-bold mb-16">Bên giao hàng</p>
              <p className="border-t border-slate-400 pt-1 text-slate-500 italic">
                (Ký, ghi rõ họ tên)
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
