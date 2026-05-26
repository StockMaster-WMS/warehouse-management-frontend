"use client";

import { type LucideIcon, AlertCircle, Box, CheckCircle2, Clock, Search, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DetailSection } from "@/components/detail-page";
import { cn } from "@/lib/utils";
import { salesOrderStatusColor, salesOrderStatusLabel, type SalesOrderStatus } from "@/types/sales-order";

type OrderWorkflowStatusProps = {
  status: SalesOrderStatus;
  lineCount: number;
  embedded?: boolean;
};

export function OrderWorkflowStatus({ status, lineCount, embedded = false }: OrderWorkflowStatusProps) {
  const steps: Array<{ key: string; label: string; icon: LucideIcon }> = [
    { key: "DRAFT", label: "Nháp", icon: Clock },
    { key: "PENDING", label: "Xác nhận", icon: CheckCircle2 },
    { key: "PICKING", label: "Lấy hàng", icon: Search },
    { key: "PACKED", label: "Đóng gói", icon: Box },
    { key: "SHIPPED", label: "Xuất kho", icon: Truck },
    { key: "COMPLETED", label: "Hoàn tất", icon: CheckCircle2 },
  ];
  const statusStepIndex: Record<string, number> = {
    DRAFT: 0,
    PENDING: 1,
    PICKING: 2,
    PACKED: 3,
    SHIPPED: 4,
    COMPLETED: 5,
  };

  const currentStepIndex = status === "CANCELLED" ? -1 : statusStepIndex[status] ?? -1;
  const progressPercentage = currentStepIndex <= 0 ? 0 : (currentStepIndex / (steps.length - 1)) * 100;

  const content = (
    <>
      {status !== "CANCELLED" ? (
        <div className="pb-5 pt-1">
          <div className="relative flex items-center justify-between px-2 sm:px-8">
            <div className="absolute left-2 right-2 top-1/2 h-0.5 -translate-y-1/2 bg-slate-100 sm:left-8 sm:right-8 dark:bg-slate-800" />
            <div
              className="absolute left-2 top-1/2 h-0.5 -translate-y-1/2 bg-indigo-500 transition-all duration-500 sm:left-8"
              style={{ width: `calc((100% - 4rem) * ${progressPercentage / 100})` }}
            />
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStepIndex;
              const isPast = index < currentStepIndex;
              const isCompleted = isPast || (status === "COMPLETED" && isActive);

              return (
                <div key={step.key} className="relative flex flex-col items-center">
                  <div
                    className={cn(
                      "relative z-10 flex size-8 items-center justify-center rounded-full border-2 bg-background transition-colors",
                      isCompleted
                        ? "border-indigo-500 bg-indigo-500 text-white"
                        : isActive
                          ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                          : "border-slate-200 text-slate-300 dark:border-slate-800 dark:text-slate-600",
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <span
                    className={cn(
                      "absolute -bottom-6 w-20 text-center text-[10px] font-semibold uppercase",
                      isCompleted
                        ? "text-slate-600 dark:text-slate-300"
                        : isActive
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-slate-400 dark:text-slate-500",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
          Đơn hàng này đã bị hủy.
        </div>
      )}
    </>
  );

  const headerAction = (
    <div className="flex flex-wrap items-center gap-2">
      <Badge
        variant="outline"
        className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold", salesOrderStatusColor(status))}
      >
        {salesOrderStatusLabel(status)}
      </Badge>
      <Badge variant="secondary" className="rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums">
        {lineCount} dòng
      </Badge>
    </div>
  );

  if (embedded) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="ui-icon-tile size-8 text-primary">
              <AlertCircle className="size-4" />
            </span>
            <div className="min-w-0">
              <h3 className="ui-label text-foreground">Trạng thái vận hành</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Theo dõi bước xử lý hiện tại của đơn xuất.</p>
            </div>
          </div>
          {headerAction}
        </div>
        {content}
      </div>
    );
  }

  return (
    <DetailSection
      title="Trạng thái vận hành"
      description="Theo dõi bước xử lý hiện tại của đơn xuất."
      icon={<AlertCircle className="size-4" />}
      headerAction={headerAction}
      className="shadow-sm"
    >
      {content}
    </DetailSection>
  );
}
