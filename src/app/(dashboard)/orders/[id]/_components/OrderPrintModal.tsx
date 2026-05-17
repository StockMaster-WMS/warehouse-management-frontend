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
import type { SalesOrder } from "@/types/sales-order";
import { formatShippingShort } from "@/types/sales-order";
import type { SoItem } from "@/types/so-item";
import type { Product } from "@/types/product";

type OrderPrintModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesOrder: SalesOrder;
  warehouseLabel: string;
  items: SoItem[];
  products: Product[];
  title?: string;
};

export function OrderPrintModal({
  open,
  onOpenChange,
  salesOrder,
  warehouseLabel,
  items,
  products,
  title = "Phiáº¿u Xuáº¥t Kho / Packing List",
}: OrderPrintModalProps) {
  const handlePrint = () => {
    const printContent = document.getElementById("print-area");
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
            #print-area { box-shadow: none !important; border: none !important; width: 100% !important; max-width: none !important; padding: 0 !important; }
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

  const formatDateTime = (dateVal: string | Date | number) => {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "â€”";
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible print:p-0 print:border-none print:shadow-none min-w-[700px] bg-slate-100">
        <DialogHeader className="print:hidden flex flex-row items-center justify-between sticky top-0 bg-slate-100 z-10 pb-4 border-b border-slate-200">
          <div>
            <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
            <DialogDescription>
              Nháº¥n nÃºt in Ä‘á»ƒ táº¡o báº£n cá»©ng cho kho lÆ°u trá»¯ hoáº·c giao hÃ ng.
            </DialogDescription>
          </div>
          <Button onClick={handlePrint} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Printer className="h-4 w-4" /> In Phiáº¿u
          </Button>
        </DialogHeader>

        {/* Printable Area */}
        <div
          className="p-8 bg-white text-black min-h-[800px] mx-auto shadow-sm border border-slate-200 print:p-0 print:m-0 print:shadow-none print:border-none w-full max-w-[210mm]"
          id="print-area"
        >
          <div className="flex justify-between items-end border-b-2 border-slate-800 pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-widest">{title}</h1>
              <p className="font-mono mt-1 text-sm font-semibold">
                MÃ£ Ä‘Æ¡n: {salesOrder.soNumber || `SO-${salesOrder.id.slice(0, 8)}`}
              </p>
            </div>
            <div className="text-right text-sm">
              <p suppressHydrationWarning>NgÃ y in: {formatDateTime(new Date())}</p>
              <p>Kho xuáº¥t: <span className="font-semibold">{warehouseLabel}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
            <div className="space-y-1">
              <p className="font-bold border-b border-slate-300 pb-1 mb-2 uppercase text-xs tracking-wider">
                ThÃ´ng tin KhÃ¡ch hÃ ng
              </p>
              <p>
                <span className="font-semibold inline-block w-24">KhÃ¡ch hÃ ng:</span>{" "}
                {salesOrder.customerName}
              </p>
              <p className="flex">
                <span className="font-semibold inline-block w-24 shrink-0">Äá»‹a chá»‰:</span>{" "}
                <span>{formatShippingShort(salesOrder.shippingAddress)}</span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-bold border-b border-slate-300 pb-1 mb-2 uppercase text-xs tracking-wider">
                ThÃ´ng tin ÄÆ¡n hÃ ng
              </p>
              <p>
                <span className="font-semibold inline-block w-24">NgÃ y táº¡o:</span>{" "}
                {salesOrder.createdAt
                  ? formatDateTime(salesOrder.createdAt)
                  : "â€”"}
              </p>
              <p>
                <span className="font-semibold inline-block w-24">Má»©c Æ°u tiÃªn:</span>{" "}
                {salesOrder.priority || 0}
              </p>
            </div>
          </div>

          <table className="w-full text-sm border-collapse mb-8">
            <thead>
              <tr className="border-y-2 border-slate-800 font-bold bg-slate-50">
                <th className="py-2.5 px-2 text-center w-12 border-x border-slate-300">STT</th>
                <th className="py-2.5 px-2 text-left border-x border-slate-300">MÃ£ SP</th>
                <th className="py-2.5 px-2 text-left border-x border-slate-300">TÃªn sáº£n pháº©m</th>
                <th className="py-2.5 px-2 text-right w-24 border-x border-slate-300">SL Äáº·t</th>
                <th className="py-2.5 px-2 text-right w-24 border-x border-slate-300">SL Thá»±c táº¿</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const prod = products.find((p) => p.sku === item.productSku);
                return (
                  <tr key={item.id} className="border-b border-slate-300 break-inside-avoid">
                    <td className="py-2 px-2 text-center border-x border-slate-300">{idx + 1}</td>
                    <td className="py-2 px-2 font-mono text-xs border-x border-slate-300">
                      {item.productSku}
                    </td>
                    <td className="py-2 px-2 border-x border-slate-300">
                      {prod?.name || item.productSku}
                    </td>
                    <td className="py-2 px-2 text-right border-x border-slate-300">
                      {item.orderedQty}
                    </td>
                    <td className="py-2 px-2 text-right font-bold border-x border-slate-300">
                      {item.shippedQty ?? ""}
                    </td>
                  </tr>
                );
              })}
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
            </div>
            <div className="w-48">
              <p className="font-bold mb-16">BÃªn nháº­n hÃ ng</p>
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
