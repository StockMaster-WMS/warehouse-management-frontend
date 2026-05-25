"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardFlowPoint } from "@/types/dashboard";

export type InboundOutboundChartProps = {
  data?: DashboardFlowPoint[];
};

const EMPTY_DATA = [
  { name: "T2", inbound: 0, outbound: 0 },
  { name: "T3", inbound: 0, outbound: 0 },
  { name: "T4", inbound: 0, outbound: 0 },
  { name: "T5", inbound: 0, outbound: 0 },
  { name: "T6", inbound: 0, outbound: 0 },
  { name: "T7", inbound: 0, outbound: 0 },
  { name: "CN", inbound: 0, outbound: 0 },
];

const viNumberFormatter = new Intl.NumberFormat("vi-VN");

export function InboundOutboundChart({ data }: InboundOutboundChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const chartData = useMemo(() => {
    const source = data?.length ? data : EMPTY_DATA;
    return source.map((item) => ({
      ...item,
      net: item.inbound - item.outbound,
    }));
  }, [data]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateWidth = () => setChartWidth(Math.max(1, Math.floor(node.clientWidth)));
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-[320px] min-h-[320px] w-full min-w-0">
      {chartWidth > 0 ? (
        <ComposedChart
          width={chartWidth}
          height={320}
          data={chartData}
          margin={{ top: 12, right: 12, left: -8, bottom: 0 }}
          barCategoryGap="28%"
        >
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            className="text-muted-foreground"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            className="text-muted-foreground"
            tickFormatter={(value) => viNumberFormatter.format(Number(value))}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <ReferenceLine y={0} stroke="var(--border)" />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted) / 0.45)" }}
            formatter={(value: number, name: string) => {
              const label = name === "inbound" ? "Nhập kho" : name === "outbound" ? "Xuất kho" : "Net flow";
              return [viNumberFormatter.format(value), label];
            }}
            contentStyle={{
              borderRadius: "0.75rem",
              border: "1px solid var(--border)",
              background: "var(--card)",
              boxShadow: "var(--shadow-sm)",
              fontSize: "12px",
            }}
            labelStyle={{ fontWeight: 700 }}
          />
          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
          <Bar
            dataKey="inbound"
            name="Nhập kho"
            fill="var(--chart-1)"
            radius={[6, 6, 0, 0]}
            maxBarSize={34}
          />
          <Bar
            dataKey="outbound"
            name="Xuất kho"
            fill="var(--chart-2)"
            radius={[6, 6, 0, 0]}
            maxBarSize={34}
          />
          <Line
            type="monotone"
            dataKey="net"
            name="Net flow"
            stroke="var(--chart-4)"
            strokeWidth={3}
            dot={{ r: 3, strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      ) : null}
    </div>
  );
}
