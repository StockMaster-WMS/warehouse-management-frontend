"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
  className?: string;
  qrbox?: { width: number; height: number };
}

export function BarcodeScanner({ onScanSuccess, onScanError, className, qrbox }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = useId().replace(/:/g, "");
  const hasScannedRef = useRef(false);
  const onScanSuccessRef = useRef(onScanSuccess);
  const onScanErrorRef = useRef(onScanError);
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
    if (!window.isSecureContext && !isLocalhost) {
      return "Camera yêu cầu kết nối bảo mật (HTTPS). Vui lòng kiểm tra lại địa chỉ truy cập.";
    }
    return null;
  });

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
    onScanErrorRef.current = onScanError;
  }, [onScanSuccess, onScanError]);

  useEffect(() => {
    if (error) {
      return;
    }

    const timer = setTimeout(() => {
      void (async () => {
        try {
          hasScannedRef.current = false;
          const cameras = await Html5Qrcode.getCameras();
          if (!cameras.length) {
            setError("Không tìm thấy camera trên thiết bị.");
            return;
          }

          const backCamera =
            cameras.find((camera) => /back|rear|environment|sau/i.test(camera.label)) || cameras[cameras.length - 1];
          const config = {
            fps: 10,
            qrbox: qrbox ?? { width: 250, height: 180 },
            aspectRatio: 1.0,
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
            ],
          };

          const scanner = new Html5Qrcode(scannerId);
          scannerRef.current = scanner;

          await scanner.start(
            { deviceId: { exact: backCamera.id } },
            config,
            (decodedText) => {
              if (hasScannedRef.current) return;
              hasScannedRef.current = true;
              onScanSuccessRef.current(decodedText);
            },
            (errorMessage) => {
              if (errorMessage?.includes("NotAllowedError") || errorMessage?.includes("permission")) {
                console.error("BarcodeScanner: Permission denied", errorMessage);
                if (onScanErrorRef.current) onScanErrorRef.current(errorMessage);
              }
            },
          );
        } catch (err) {
          console.error("BarcodeScanner: Error during initialization", err);
          if (err instanceof DOMException && err.name === "NotAllowedError") {
            setError("Trình duyệt đang chặn quyền camera. Hãy cấp quyền Camera rồi tải lại trang.");
            return;
          }
          setError("Không thể khởi tạo máy quét. Hãy kiểm tra quyền camera hoặc dùng localhost/HTTPS.");
        }
      })();
    }, 250);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => undefined)
          .finally(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
          });
      }
    };
  }, [error, qrbox, scannerId]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-y-3 rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
        <AlertCircle className="size-10 text-red-500" />
        <p className="text-xs font-bold text-red-900 leading-relaxed">{error}</p>
        <p className="text-[10px] text-red-600">Nếu bạn đang test qua IP, hãy sử dụng Localhost trên máy tính.</p>
      </div>
    );
  }

  return (
    <div className={cn("relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-2xl bg-zinc-950 shadow-inner", className)}>
      <div id={scannerId} className="w-full"></div>
    </div>
  );
}
