"use client";

import dynamic from "next/dynamic";

export interface RevenueTrend {
  date: string;
  revenue: number;
}

const RevenueTrendChartInner = dynamic(
  () =>
    import("./revenue-trend-chart-inner").then(
      (module) => module.RevenueTrendChartInner,
    ),
  {
    ssr: false,
    loading: () => <div className="h-64 w-full" />,
  },
);

export function RevenueTrendChart({ data }: { data?: RevenueTrend[] }) {
  return <RevenueTrendChartInner data={data} />;
}
