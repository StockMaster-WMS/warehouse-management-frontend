"use client";

import { Fragment } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const WORKFLOW_STEPS = [
  { status: "PENDING", label: "Chuẩn bị" },
  { status: "PICKING", label: "Lấy hàng" },
  { status: "PACKED", label: "Đóng gói" },
  { status: "SHIPPED", label: "Xuất kho" },
] as const;

function workflowStepIndex(orderStatus: string): number {
  if (orderStatus === "PICKED") {
    return 1;
  }
  const idx = WORKFLOW_STEPS.findIndex((s) => s.status === orderStatus);
  return idx >= 0 ? idx : 0;
}

/** Căn đường nối ngang với tâm ô vuông size-9 (2.25rem / 2) */
const CONNECTOR_TOP = "pt-[1.125rem]";

export function OrderWorkflowStepper({ status }: { status: string }) {
  const current = workflowStepIndex(status);

  return (
    <div className="w-full min-w-0 overflow-x-auto rounded-lg border border-border/70 bg-background/80 px-2 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Tiến trình xử lý đơn">
      <div className="my-1 flex min-w-[min(100%,460px)] items-start justify-between gap-0 sm:min-w-0 sm:gap-1.5">
        {WORKFLOW_STEPS.map((s, i) => {
          const done = i < current;
          const active = i === current;
          const upcoming = i > current;

          return (
            <Fragment key={s.status}>
              <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg border text-xs font-extrabold shadow-sm transition-all",
                    done &&
                      "border-emerald-600/40 bg-emerald-600 text-white dark:border-emerald-500/50 dark:bg-emerald-600",
                    active &&
                      !done &&
                      "border-primary bg-primary text-primary-foreground ring-2 ring-primary/35 ring-offset-2 ring-offset-background",
                    upcoming && "border-border bg-muted/70 text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-4" strokeWidth={2.5} aria-hidden /> : <span>{i + 1}</span>}
                </div>
                <span
                  className={cn(
                    "w-full max-w-24 text-center text-[10px] font-semibold leading-tight sm:max-w-none sm:text-[11px]",
                    active && "text-foreground",
                    done && "text-emerald-700 dark:text-emerald-400",
                    upcoming && "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </div>

              {i < WORKFLOW_STEPS.length - 1 ? (
                <div className={cn("flex shrink-0 items-center self-start", CONNECTOR_TOP)}>
                  <Separator
                    orientation="horizontal"
                    className={cn("h-0.5 w-5 sm:w-9", i < current ? "bg-emerald-500/70" : "bg-border")}
                  />
                </div>
              ) : null}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
