"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TableRefreshButtonProps = {
  isFetching?: boolean;
  onRefresh: () => void;
  className?: string;
};

export function TableRefreshButton({
  isFetching = false,
  onRefresh,
  className,
}: TableRefreshButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("h-11 rounded-lg px-3", className)}
      onClick={onRefresh}
      disabled={isFetching}
      title="Tải lại dữ liệu"
      aria-label="Tải lại dữ liệu bảng"
    >
      <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
      <span className="hidden sm:inline">Tải lại</span>
    </Button>
  );
}
