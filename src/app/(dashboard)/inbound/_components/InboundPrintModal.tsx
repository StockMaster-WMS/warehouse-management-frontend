"use client";

import { Printer } from "lucide-react";
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

export function InboundPrintModal({
  open,
  onOpenChange,
  data,
  warehouseLabel,
  locationLabel,
  title = "PHIẾU NHẬP KHO / GOODS RECEIPT NOTE",
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
      <DialogContent className="max-h-[85vh] min-w-[700px] max-w-4xl overflow-y-auto bg-muted print:max-h-none print:max-w-none print:overflow-visible print:border-none print:p-0 print:shadow-none">
        <DialogHeader className="sticky top-0 z-10 flex flex-row items-center justify-between border-b border-border bg-muted pb-4 print:hidden">
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
          className="p-8 bg-white text-black min-h-[800px] mx-auto shadow-sm border border-slate-200 print:p-0 print:m-0 print:shadow-none print:border-none w-full max-w-[210mm]"
          id="print-area-inbound"
        >
          <div className="flex justify-between items-end border-b-2 border-slate-800 pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold uppercase tracking-widest">{title}</h1>
              <p className="font-mono mt-1 text-sm font-semibold">
                Mã đơn: {data.receiptNumber || `GRN-${data.id.slice(0, 8)}`}
              </p>
            </div>
            <div className="text-right text-sm">
              <p suppressHydrationWarning>
                Ngày in: {data.receivedDate ? formatDateTime(data.receivedDate) : formatDateTime(new Date())}
              </p>
              <p>Kho nhập: <span className="font-semibold">{warehouseLabel}</span></p>
              {printableLocationLabel && (
                <p>
                  Khu vực/Dock: <span className="font-semibold">{printableLocationLabel}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
            <div className="space-y-1">
              <p className="font-bold border-b border-slate-300 pb-1 mb-2 uppercase text-xs tracking-wider">
                Thông tin Nhà cung cấp
              </p>
              <p>
                <span className="font-semibold inline-block w-24">Nhà cung cấp:</span>{" "}
                {data.supplierName || "—"}
              </p>
              <p className="flex">
                <span className="font-semibold inline-block w-24 shrink-0">Địa chỉ:</span>{" "}
                <span>{data.supplierAddress || "—"}</span>
              </p>
              <p>
                <span className="font-semibold inline-block w-24">Điện thoại:</span>{" "}
                {data.supplierPhone || "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-bold border-b border-slate-300 pb-1 mb-2 uppercase text-xs tracking-wider">
                Thông tin Đơn nhập
              </p>
              <p>
                <span className="font-semibold inline-block w-28">Đơn nhập:</span>{" "}
                {data.poNumber || "—"}
              </p>
              <p>
                <span className="font-semibold inline-block w-28">Ngày nhập hàng:</span>{" "}
                {data.receivedDate ? formatDateTime(data.receivedDate) : "—"}
              </p>
              {data.note && (
                <p>
                  <span className="font-semibold inline-block w-28 align-top shrink-0">Ghi chú:</span>{" "}
                  <span className="inline-block w-[calc(100%-7rem)]">{data.note}</span>
                </p>
              )}
            </div>
          </div>

          <table className="w-full text-sm border-collapse mb-8">
            <thead>
              <tr className="border-y-2 border-slate-800 font-bold bg-slate-50">
                <th className="py-2.5 px-2 text-center w-12 border-x border-slate-300">STT</th>
                <th className="py-2.5 px-2 text-left border-x border-slate-300">Mã SP</th>
                <th className="py-2.5 px-2 text-left border-x border-slate-300">Tên sản phẩm</th>
                <th className="py-2.5 px-2 text-center w-16 border-x border-slate-300">ĐVT</th>
                <th className="py-2.5 px-2 text-right w-20 border-x border-slate-300">SL Đặt</th>
                <th className="py-2.5 px-2 text-right w-24 border-x border-slate-300">SL Thực nhận</th>
                <th className="py-2.5 px-2 text-left border-x border-slate-300">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {data.items && data.items.length > 0 ? (
                data.items.map((item, idx) => (
                  <tr key={`${item.lineNumber ?? idx}-${item.productSku ?? item.productName ?? "item"}`} className="border-b border-slate-300 break-inside-avoid">
                    <td className="p-2 text-center border-x border-slate-300">{item.lineNumber || idx + 1}</td>
                    <td className="p-2 font-mono text-xs border-x border-slate-300">
                      {item.productSku || "—"}
                    </td>
                    <td className="p-2 border-x border-slate-300">
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
                    <td className="p-2 text-left text-xs border-x border-slate-300">
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

          <div className="flex justify-between mt-16 text-center text-sm break-inside-avoid pt-12">
            <div className="w-48">
              <p className="font-bold mb-16">Người lập phiếu</p>
              <p className="border-t border-slate-400 pt-1 text-slate-500 italic">
                (Ký, ghi rõ họ tên)
              </p>
            </div>
            <div className="w-48">
              <p className="font-bold mb-16">Thủ kho</p>
              <p className="border-t border-slate-400 pt-1 text-slate-500 italic">
                (Ký, ghi rõ họ tên)
              </p>
              {data.receivedBy && <p className="mt-2 font-semibold text-slate-800">{data.receivedBy}</p>}
            </div>
            <div className="w-48">
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
