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
import { getLocationScanCode } from "@/lib/location-scan-code";
import type { Location } from "@/types/location";

type LocationBarcodeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: Location | null;
  warehouseName: string;
};

export function LocationBarcodeModal({
  open,
  onOpenChange,
  location,
  warehouseName,
}: LocationBarcodeModalProps) {
  const barcodeValue = getLocationScanCode(location?.code);
  const barcodeUrl = useMemo(() => {
    if (!barcodeValue) return "";
    const code = encodeURIComponent(barcodeValue);
    return `https://bwipjs-api.metafloor.com/?bcid=code128&text=${code}&scale=3&height=10&rotate=N&includetext=true&textsize=8&backgroundcolor=ffffff`;
  }, [barcodeValue]);

  const handlePrint = () => {
    const printContent = document.getElementById("barcode-print-area");
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
          <title>In mã vị trí ${location?.code}</title>
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
              padding: 2mm;
              box-sizing: border-box;
            }
            .wh-name { font-size: 7pt; font-weight: bold; margin-bottom: 1mm; color: #666; text-transform: uppercase; }
            .loc-code { font-size: 8.5pt; font-weight: 900; margin-bottom: 1mm; line-height: 1.05; word-break: break-word; }
            .barcode-img { width: 44mm; height: 13mm; object-fit: contain; }
            .scan-code { font-size: 6pt; font-weight: 700; margin-top: 0.5mm; color: #555; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="wh-name">${warehouseName}</div>
            <div class="loc-code">${location?.code}</div>
            <img class="barcode-img" src="${barcodeUrl}" />
            <div class="scan-code">${barcodeValue}</div>
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

  if (!location) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="size-5 text-indigo-600" />
            In nhãn vị trí
          </DialogTitle>
          <DialogDescription>
            Tạo mã vạch cho kệ kho ({location.code}). Khổ tem chuẩn: 50x30mm.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          {/* Preview Label */}
          <div 
            id="barcode-print-area"
            className="w-[200px] h-[120px] bg-white border border-slate-300 shadow-sm flex flex-col items-center justify-center p-3 text-black rounded-sm"
          >
             <div className="text-[8px] font-bold text-slate-500 uppercase mb-0.5 truncate w-full text-center">
                {warehouseName}
             </div>
             <div className="mb-1 line-clamp-2 text-center text-[13px] font-black leading-tight">
                {location.code}
             </div>
             {barcodeUrl ? (
               <Image
                 src={barcodeUrl}
                 alt={`Mã vạch vị trí ${barcodeValue}`}
                 width={176}
                 height={48}
                 className="h-12 w-full object-contain"
                 unoptimized
               />
             ) : (
               <div className="h-12 w-full bg-slate-100 animate-pulse" />
             )}
             <div className="mt-0.5 font-mono text-[9px] font-bold text-slate-600">
                {barcodeValue}
             </div>
          </div>
          
          <p className="mt-4 text-[10px] text-slate-400 font-medium">
            * Barcode dùng mã rút gọn để dễ quét; nhãn vẫn hiển thị mã vị trí đầy đủ.
          </p>
        </div>

        <div className="flex gap-3 mt-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => {
                const link = document.createElement('a');
                link.href = barcodeUrl;
                link.download = `barcode-${barcodeValue}.png`;
                link.click();
            }}
          >
            <Download className="mr-2 size-4" /> Tải về
          </Button>
          <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handlePrint}>
            <Printer className="mr-2 size-4" /> In nhãn
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
