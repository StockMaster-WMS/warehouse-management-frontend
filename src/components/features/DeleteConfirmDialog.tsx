"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, Info, Loader2, X } from "lucide-react";

type DeleteConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  itemName?: string;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
};

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  itemName,
  title = "Xác nhận hành động",
  description = "Hành động này không thể hoàn tác.",
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  variant = "danger",
}: DeleteConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const getIcon = () => {
    switch (variant) {
      case "danger":
        return <AlertTriangle className="size-6 text-rose-600" />;
      case "warning":
        return <AlertCircle className="size-6 text-amber-500" />;
      default:
        return <Info className="size-6 text-indigo-500" />;
    }
  };

  const getBgColor = () => {
    switch (variant) {
      case "danger":
        return "bg-rose-50 dark:bg-rose-950/30";
      case "warning":
        return "bg-amber-50 dark:bg-amber-950/30";
      default:
        return "bg-indigo-50 dark:bg-indigo-950/30";
    }
  };

  const getActiveButtonClass = () => {
    switch (variant) {
      case "danger":
        return "bg-rose-600 hover:bg-rose-700 shadow-rose-200 dark:shadow-none";
      case "warning":
        return "bg-amber-500 hover:bg-amber-600 shadow-amber-200 dark:shadow-none";
      default:
        return "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none";
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Action confirmation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !isLoading && onOpenChange(v)}>
      <DialogContent 
        className="max-w-[400px] p-0 overflow-hidden border-none rounded-2xl shadow-2xl" 
        showCloseButton={false}
      >
        <div className="relative p-6 pt-8">
          {/* Close button - custom positioned */}
          {!isLoading && (
            <button 
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="size-4" />
            </button>
          )}

          <div className="flex flex-col items-center gap-y-4 text-center">
            {/* Semantic Icon Circle */}
            <div className={`p-3 rounded-full ${getBgColor()}`}>
              {getIcon()}
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white leading-tight">
                {title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 px-2 leading-relaxed">
                {description}
              </p>
            </div>

            {itemName && (
              <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Đang chọn:
                </span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 break-all line-clamp-2">
                  {itemName}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 px-6 flex flex-col-reverse sm:flex-row gap-2">
          <Button 
            disabled={isLoading}
            variant="outline" 
            className="flex-1 rounded-xl border-slate-200 dark:border-slate-800 h-11 font-semibold"
            onClick={() => onOpenChange(false)}
          >
            {cancelText}
          </Button>
          <Button
            disabled={isLoading}
            className={`flex-1 rounded-xl h-11 font-semibold text-white transition-all active:scale-[0.98] ${getActiveButtonClass()}`}
            onClick={handleConfirm}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
