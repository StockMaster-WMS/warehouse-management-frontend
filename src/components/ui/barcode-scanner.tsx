"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { AlertCircle } from "lucide-react";

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
}

export function BarcodeScanner({ onScanSuccess, onScanError }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      return "Camera yêu cầu kết nối bảo mật (HTTPS). Vui lòng kiểm tra lại địa chỉ truy cập.";
    }
    return null;
  });

  useEffect(() => {
    console.log("BarcodeScanner: Component mounted");
    
    if (error) {
      return;
    }

    // Delay initialization to ensure the 'reader' element is in the DOM (especially inside Dialogs)
    const timer = setTimeout(() => {
      try {
        console.log("BarcodeScanner: Initializing Html5QrcodeScanner...");
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 180 },
          aspectRatio: 1.0,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
          ],
          showTorchButtonIfSupported: true,
        };

        const scanner = new Html5QrcodeScanner("reader", config, false);
        scannerRef.current = scanner;

        scanner.render(
          (decodedText) => {
            console.log("BarcodeScanner: Scan success", decodedText);
            onScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Permission errors are important
            if (errorMessage?.includes("NotAllowedError") || errorMessage?.includes("permission")) {
                console.error("BarcodeScanner: Permission denied", errorMessage);
                if (onScanError) onScanError(errorMessage);
            }
          }
        );
      } catch (err) {
        console.error("BarcodeScanner: Error during initialization", err);
        setError("Không thể khởi tạo máy quét. Vui lòng làm mới trang.");
      }
    }, 500); // 500ms delay for Dialog animation

    return () => {
      console.log("BarcodeScanner: Component unmounting, clearing scanner...");
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch((err) => console.error("Failed to clear scanner", err));
      }
    };
  }, [error, onScanSuccess, onScanError]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 bg-red-50 rounded-2xl border border-red-100">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-xs font-bold text-red-900 leading-relaxed">{error}</p>
        <p className="text-[10px] text-red-600">Nếu bạn đang test qua IP, hãy sử dụng Localhost trên máy tính.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-black shadow-inner relative min-h-[300px] flex items-center justify-center">
      <div id="reader" className="w-full"></div>
    </div>
  );
}
