"use client";

import { useEffect, useRef, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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

export function InboundOutboundChart({ data }: InboundOutboundChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const chartData = data?.length ? data : EMPTY_DATA;

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
    <div ref={containerRef} className="h-60 min-h-60 w-full min-w-0">
      {chartWidth > 0 ? (
        <LineChart width={chartWidth} height={240} data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
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
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "0.75rem",
              border: "1px solid var(--border)",
              background: "var(--card)",
              fontSize: "12px",
            }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
          <Line
            type="monotone"
            dataKey="inbound"
            name="Nhập kho"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="outbound"
            name="Xuất kho"
            stroke="var(--chart-2)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      ) : null}
    </div>
  );
}
