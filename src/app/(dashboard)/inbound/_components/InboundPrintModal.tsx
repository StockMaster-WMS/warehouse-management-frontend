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
  title?: string;
};

export function InboundPrintModal({
  open,
  onOpenChange,
  data,
  warehouseLabel,
  title = "PHIáº¾U NHáº¬P KHO / GOODS RECEIPT NOTE",
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

  const formatDateTime = (dateVal: string | Date | number | null | undefined) => {
    if (!dateVal) return "â€”";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "â€”";
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
              Nháº¥n nÃºt in Ä‘á»ƒ táº¡o báº£n cá»©ng cho kho lÆ°u trá»¯ hoáº·c nhÃ  cung cáº¥p.
            </DialogDescription>
          </div>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" /> In Phiáº¿u
          </Button>
        </DialogHeader>

        {/* Printable Area */}
        <div
          className="p-8 bg-white text-black min-h-[800px] mx-auto shadow-sm border border-slate-200 print:p-0 print:m-0 print:shadow-none print:border-none w-full max-w-[210mm]"
          id="print-area-inbound"
        >
          <div className="flex justify-between items-end border-b-2 border-slate-800 pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-widest">{title}</h1>
              <p className="font-mono mt-1 text-sm font-semibold">
                MÃ£ Ä‘Æ¡n: {data.receiptNumber || `GRN-${data.id.slice(0, 8)}`}
              </p>
            </div>
            <div className="text-right text-sm">
              <p suppressHydrationWarning>
                NgÃ y in: {data.receivedDate ? formatDateTime(data.receivedDate) : formatDateTime(new Date())}
              </p>
              <p>Kho nháº­p: <span className="font-semibold">{warehouseLabel}</span></p>
              {data.locationId && <p>Khu vá»±c/Dock: <span className="font-semibold">{data.locationId}</span></p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
            <div className="space-y-1">
              <p className="font-bold border-b border-slate-300 pb-1 mb-2 uppercase text-xs tracking-wider">
                ThÃ´ng tin NhÃ  cung cáº¥p
              </p>
              <p>
                <span className="font-semibold inline-block w-24">NhÃ  cung cáº¥p:</span>{" "}
                {data.supplierName || "â€”"}
              </p>
              <p className="flex">
                <span className="font-semibold inline-block w-24 shrink-0">Äá»‹a chá»‰:</span>{" "}
                <span>{data.supplierAddress || "â€”"}</span>
              </p>
              <p>
                <span className="font-semibold inline-block w-24">Äiá»‡n thoáº¡i:</span>{" "}
                {data.supplierPhone || "â€”"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-bold border-b border-slate-300 pb-1 mb-2 uppercase text-xs tracking-wider">
                ThÃ´ng tin ÄÆ¡n nháº­p
              </p>
              <p>
                <span className="font-semibold inline-block w-28">ÄÆ¡n mua hÃ ng (PO):</span>{" "}
                {data.poNumber || "â€”"}
              </p>
              <p>
                <span className="font-semibold inline-block w-28">NgÃ y nháº­p hÃ ng:</span>{" "}
                {data.receivedDate ? formatDateTime(data.receivedDate) : "â€”"}
              </p>
              {data.note && (
                <p>
                  <span className="font-semibold inline-block w-28 align-top shrink-0">Ghi chÃº:</span>{" "}
                  <span className="inline-block w-[calc(100%-7rem)]">{data.note}</span>
                </p>
              )}
            </div>
          </div>

          <table className="w-full text-sm border-collapse mb-8">
            <thead>
              <tr className="border-y-2 border-slate-800 font-bold bg-slate-50">
                <th className="py-2.5 px-2 text-center w-12 border-x border-slate-300">STT</th>
                <th className="py-2.5 px-2 text-left border-x border-slate-300">MÃ£ SP</th>
                <th className="py-2.5 px-2 text-left border-x border-slate-300">TÃªn sáº£n pháº©m</th>
                <th className="py-2.5 px-2 text-center w-16 border-x border-slate-300">ÄVT</th>
                <th className="py-2.5 px-2 text-right w-20 border-x border-slate-300">SL Äáº·t</th>
                <th className="py-2.5 px-2 text-right w-24 border-x border-slate-300">SL Thá»±c nháº­n</th>
                <th className="py-2.5 px-2 text-left border-x border-slate-300">Ghi chÃº</th>
              </tr>
            </thead>
            <tbody>
              {data.items && data.items.length > 0 ? (
                data.items.map((item, idx) => (
                  <tr key={`${item.lineNumber ?? idx}-${item.productSku ?? item.productName ?? "item"}`} className="border-b border-slate-300 break-inside-avoid">
                    <td className="py-2 px-2 text-center border-x border-slate-300">{item.lineNumber || idx + 1}</td>
                    <td className="py-2 px-2 font-mono text-xs border-x border-slate-300">
                      {item.productSku || "â€”"}
                    </td>
                    <td className="py-2 px-2 border-x border-slate-300">
                      {item.productName || item.productSku || "â€”"}
                    </td>
                    <td className="py-2 px-2 text-center border-x border-slate-300">
                      {item.unit || "â€”"}
                    </td>
                    <td className="py-2 px-2 text-right border-x border-slate-300">
                      {item.orderedQty ?? 0}
                    </td>
                    <td className="py-2 px-2 text-right font-bold border-x border-slate-300">
                      {item.receivedQty ?? 0}
                    </td>
                    <td className="py-2 px-2 text-left text-xs border-x border-slate-300">
                      {item.note || ""}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-4 text-center border-x border-b border-slate-300 text-slate-500">
                    KhÃ´ng cÃ³ sáº£n pháº©m nÃ o
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex justify-between mt-16 text-center text-sm break-inside-avoid pt-12">
            <div className="w-48">
              <p className="font-bold mb-16">NgÆ°á»i láº­p phiáº¿u</p>
              <p className="border-t border-slate-400 pt-1 text-slate-500 italic">
                (KÃ½, ghi rÃµ há» tÃªn)
              </p>
            </div>
            <div className="w-48">
              <p className="font-bold mb-16">Thá»§ kho</p>
              <p className="border-t border-slate-400 pt-1 text-slate-500 italic">
                (KÃ½, ghi rÃµ há» tÃªn)
              </p>
              {data.receivedBy && <p className="mt-2 font-semibold text-slate-800">{data.receivedBy}</p>}
            </div>
            <div className="w-48">
              <p className="font-bold mb-16">BÃªn giao hÃ ng</p>
              <p className="border-t border-slate-400 pt-1 text-slate-500 italic">
                (KÃ½, ghi rÃµ há» tÃªn)
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
