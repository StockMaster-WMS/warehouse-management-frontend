"use client";

import { useMemo } from "react";
import { Printer, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  const barcodeUrl = useMemo(() => {
    if (!location?.code) return "";
    const code = encodeURIComponent(location.code);
    return `https://bwipjs-api.metafloor.com/?bcid=code128&text=${code}&scale=3&rotate=N&includetext=true&backgroundcolor=ffffff`;
  }, [location?.code]);

  const handlePrint = () => {
    const printContent = document.getElementById("barcode-print-area");
    if (!printContent) return;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
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
            .loc-code { font-size: 11pt; font-weight: 900; margin-bottom: 1.5mm; }
            .barcode-img { width: 44mm; height: 12mm; object-fit: contain; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="wh-name">${warehouseName}</div>
            <div class="loc-code">${location?.code}</div>
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

  if (!location) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-indigo-600" />
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
             <div className="text-sm font-black mb-1">{location.code}</div>
             {barcodeUrl ? (
               /* eslint-disable-next-line @next/next/no-img-element */
               <img 
                 src={barcodeUrl} 
                 alt={`Mã vạch vị trí ${location.code}`}
                 className="w-full h-12 object-contain" 
               />
             ) : (
               <div className="h-12 w-full bg-slate-100 animate-pulse" />
             )}
          </div>
          
          <p className="mt-4 text-[10px] text-slate-400 font-medium">
            * Nhãn bao gồm: Kho, Mã vị trí và Barcode 128
          </p>
        </div>

        <div className="flex gap-3 mt-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => {
                const link = document.createElement('a');
                link.href = barcodeUrl;
                link.download = `barcode-${location.code}.png`;
                link.click();
            }}
          >
            <Download className="mr-2 h-4 w-4" /> Tải về
          </Button>
          <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> In nhãn
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
