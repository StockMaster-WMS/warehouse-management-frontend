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

function HeaderInfoLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[72px_1fr] gap-2 text-left leading-snug">
      <span className="font-semibold text-slate-700">{label}:</span>
      <span className="min-w-0 break-words font-semibold">{value || "—"}</span>
    </div>
  );
}

export function OrderPrintModal({
  open,
  onOpenChange,
  salesOrder,
  warehouseLabel,
  items,
  products,
  title = "Phiếu Xuất Kho",
}: OrderPrintModalProps) {
  const handlePrint = () => {
    const printContent = document.getElementById("print-area");
    if (!printContent) return;

    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(iframe);

    const contentWindow = iframe.contentWindow;
    if (!contentWindow) return;

    let styles = "";
    document
      .querySelectorAll('link[rel="stylesheet"], style')
      .forEach((node) => {
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
    if (isNaN(d.getTime())) return "—";
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] !w-[calc(210mm+2rem)] !max-w-[calc(100vw-1rem)] overflow-auto bg-slate-100 print:max-h-none print:!w-auto print:!max-w-none print:overflow-visible print:border-none print:p-0 print:shadow-none sm:!max-w-[calc(210mm+2rem)]">
        <DialogHeader className="sticky top-0 z-10 flex flex-col gap-3 border-b border-slate-200 bg-slate-100 pb-4 pr-10 print:hidden sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <DialogTitle className="text-lg font-bold sm:text-xl">
              {title}
            </DialogTitle>
            <DialogDescription>
              Nhấn nút in để tạo bản cứng cho kho lưu trữ hoặc giao hàng.
            </DialogDescription>
          </div>
          <Button
            onClick={handlePrint}
            className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 sm:w-auto"
          >
            <Printer className="size-4" /> In Phiếu
          </Button>
        </DialogHeader>

        {/* Printable Area */}
        <div
          className="mx-auto flex min-h-[297mm] w-[210mm] flex-col overflow-hidden border border-slate-200 bg-white p-[12mm] text-black shadow-sm print:m-0 print:min-h-[297mm] print:border-none print:p-0 print:shadow-none"
          id="print-area"
        >
          <div className="mb-6 grid grid-cols-[1fr_285px] items-end gap-6 border-b-2 border-slate-800 pb-4">
            <div className="min-w-0">
              <h1 className="break-words text-xl font-semibold uppercase tracking-widest sm:text-2xl">
                {title}
              </h1>
              <p className="font-mono mt-1 text-sm font-semibold">
                Mã đơn:{" "}
                {salesOrder.soNumber || `SO-${salesOrder.id.slice(0, 8)}`}
              </p>
            </div>
            <div className="space-y-1 rounded-sm bg-slate-50 px-3 py-2 text-sm">
              <HeaderInfoLine
                label="Ngày in"
                value={<span suppressHydrationWarning>{formatDateTime(new Date())}</span>}
              />
              <HeaderInfoLine label="Kho xuất" value={warehouseLabel} />
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-5 text-sm sm:grid-cols-2 sm:gap-8">
            <div className="space-y-1">
              <p className="font-bold border-b border-slate-300 pb-1 mb-2 uppercase text-xs tracking-wider">
                Thông tin Khách hàng
              </p>
              <p>
                <span className="font-semibold inline-block w-24">
                  Khách hàng:
                </span>{" "}
                {salesOrder.customerName}
              </p>
              <p className="flex">
                <span className="font-semibold inline-block w-24 shrink-0">
                  Địa chỉ:
                </span>{" "}
                <span>{formatShippingShort(salesOrder.shippingAddress)}</span>
              </p>
              {salesOrder.shippingAddress.phone ? (
                <p>
                  <span className="font-semibold inline-block w-24">
                    SĐT nhận:
                  </span>{" "}
                  {salesOrder.shippingAddress.phone}
                </p>
              ) : null}
            </div>
            <div className="space-y-1">
              <p className="font-bold border-b border-slate-300 pb-1 mb-2 uppercase text-xs tracking-wider">
                Thông tin Đơn hàng
              </p>
              <p>
                <span className="font-semibold inline-block w-24">
                  Ngày tạo:
                </span>{" "}
                {salesOrder.createdAt
                  ? formatDateTime(salesOrder.createdAt)
                  : "—"}
              </p>
              <p>
                <span className="font-semibold inline-block w-24">
                  Mức ưu tiên:
                </span>{" "}
                {salesOrder.priority || 0}
              </p>
            </div>
          </div>

          <div className="mb-8 overflow-hidden print:overflow-visible">
            <table className="w-full table-fixed border-collapse text-xs sm:text-sm">
              <colgroup>
                <col className="w-[9%]" />
                <col className="w-[20%]" />
                <col className="w-[43%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead>
                <tr className="border-y-2 border-slate-800 bg-slate-50 font-bold">
                  <th className="border-x border-slate-300 px-1.5 py-2 text-center sm:px-2 sm:py-2.5">
                    STT
                  </th>
                  <th className="border-x border-slate-300 px-1.5 py-2 text-left sm:px-2 sm:py-2.5">
                    Mã SP
                  </th>
                  <th className="border-x border-slate-300 px-1.5 py-2 text-left sm:px-2 sm:py-2.5">
                    Tên sản phẩm
                  </th>
                  <th className="border-x border-slate-300 px-1.5 py-2 text-right sm:px-2 sm:py-2.5">
                    SL Đặt
                  </th>
                  <th className="border-x border-slate-300 px-1.5 py-2 text-right sm:px-2 sm:py-2.5">
                    SL Thực tế
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const prod = products.find((p) => p.sku === item.productSku);
                  return (
                    <tr
                      key={item.id}
                      className="break-inside-avoid border-b border-slate-300"
                    >
                      <td className="border-x border-slate-300 p-1.5 text-center sm:p-2">
                        {idx + 1}
                      </td>
                      <td className="break-words border-x border-slate-300 p-1.5 font-mono text-[11px] sm:p-2 sm:text-xs">
                        {item.productSku}
                      </td>
                      <td className="break-words border-x border-slate-300 p-1.5 sm:p-2">
                        {prod?.name || item.productSku}
                      </td>
                      <td className="border-x border-slate-300 p-1.5 text-right sm:p-2">
                        {item.orderedQty}
                      </td>
                      <td className="border-x border-slate-300 p-1.5 text-right font-bold sm:p-2">
                        {item.shippedQty ?? ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-auto grid break-inside-avoid grid-cols-3 gap-4 pt-12 text-center text-sm">
            <div className="mx-auto w-full max-w-48">
              <p className="mb-12 font-bold sm:mb-16">Người lập phiếu</p>
              <p className="border-t border-slate-400 pt-1 text-slate-500 italic">
                (Ký, ghi rõ họ tên)
              </p>
            </div>
            <div className="mx-auto w-full max-w-48">
              <p className="mb-12 font-bold sm:mb-16">Thủ kho</p>
              <p className="border-t border-slate-400 pt-1 text-slate-500 italic">
                (Ký, ghi rõ họ tên)
              </p>
            </div>
            <div className="mx-auto w-full max-w-48">
              <p className="mb-12 font-bold sm:mb-16">Bên nhận hàng</p>
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
