"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Printer, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/product";

type ProductBarcodeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
};

export function ProductBarcodeModal({
  open,
  onOpenChange,
  product,
}: ProductBarcodeModalProps) {
  const barcodeValue = product?.barcodeEan13 || product?.sku;

  const barcodeUrl = useMemo(() => {
    if (!barcodeValue) return "";
    const code = encodeURIComponent(barcodeValue);
    // Code 128 format covers alphanumeric values like SKU, unlike EAN13 which only covers numbers.
    return `https://bwipjs-api.metafloor.com/?bcid=code128&text=${code}&scale=3&rotate=N&includetext=true&backgroundcolor=ffffff`;
  }, [barcodeValue]);

  const handlePrint = () => {
    const printContent = document.getElementById("product-barcode-print-area");
    if (!printContent) return;

    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(iframe);

    const contentWindow = iframe.contentWindow;
    if (!contentWindow) return;

    contentWindow.document.open();
    contentWindow.document.write(`
      <html>
        <head>
          <title>In mã vạch SP ${product?.sku}</title>
          <style>
            @page { size: 50mm 30mm; margin: 0; }
            body { 
              margin: 0; 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              height: 30mm; 
              width: 50mm; 
              font-family: sans-serif;
              background: white;
            }
            .label {
              text-align: center;
              width: 100%;
              padding: 1.5mm;
              box-sizing: border-box;
            }
            .product-name { 
                font-size: 8pt; 
                font-weight: bold; 
                margin-bottom: 1mm; 
                color: #000;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            .barcode-img { width: 45mm; height: 14mm; object-fit: contain; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="product-name">${product?.name || ""}</div>
            <img class="barcode-img" src="${barcodeUrl}" />
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(() => {
                window.parent.document.body.removeChild(window.frameElement);
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    contentWindow.document.close();
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-indigo-600" />
            In mã vạch sản phẩm
          </DialogTitle>
          <DialogDescription>
            Xem trước tem nhãn dán cho hộp sản phẩm ({product.sku}). Khổ in chuẩn: 50x30mm.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          {/* Preview Label */}
          <div 
            id="product-barcode-print-area"
            className="w-[200px] h-[120px] bg-white border border-slate-300 shadow-sm flex flex-col items-center justify-center p-2 text-black rounded-sm"
          >
             <div className="text-[10px] font-bold text-slate-900 mb-1 leading-snug line-clamp-2 w-full text-center px-1">
                {product.name}
             </div>
             {barcodeUrl ? (
               <Image
                 src={barcodeUrl}
                 alt={`Mã vạch ${product.sku}`}
                 width={184}
                 height={56}
                 className="mt-1 h-14 w-full object-contain"
                 unoptimized
               />
             ) : (
               <div className="h-14 w-full bg-slate-100 animate-pulse mt-1" />
             )}
          </div>
          
          <p className="mt-4 text-[10px] text-slate-400 font-medium text-center">
            * Tem bao gồm tên sản phẩm và mã vạch Code 128
            <br />(Ưu tiên dùng EAN13 nếu có, không thì lấy mã hàng)
          </p>
        </div>

        <div className="flex gap-3 mt-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => {
                const link = document.createElement('a');
                link.href = barcodeUrl;
                link.download = `barcode-${product.sku}.png`;
                link.click();
            }}
          >
            <Download className="mr-2 h-4 w-4" /> Tải ảnh về
          </Button>
          <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Bắt đầu in
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
