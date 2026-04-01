"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Xác nhận xóa",
  description = "Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa mục này khỏi hệ thống?",
  itemName,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106 rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/30">
              <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-slate-500 py-2">
            {description}
            {itemName && (
              <span className="block mt-2 font-bold text-slate-900 dark:text-slate-200">
                &quot;{itemName}&quot;
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl font-bold"
          >
            Hủy bỏ
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
                onConfirm();
                onOpenChange(false);
            }}
            className="rounded-xl bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 dark:shadow-none font-bold text-white"
          >
            Xác nhận xóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
