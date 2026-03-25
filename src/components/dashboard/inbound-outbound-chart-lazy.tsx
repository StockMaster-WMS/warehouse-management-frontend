"use client";

import dynamic from "next/dynamic";

export const InboundOutboundChartLazy = dynamic(
  () =>
    import("@/components/dashboard/inbound-outbound-chart").then(
      (m) => m.InboundOutboundChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-60 items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 text-sm text-muted-foreground">
        Đang tải biểu đồ…
      </div>
    ),
  },
);
