"use client";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { RevenueTrend } from "./revenue-trend-chart";

export function RevenueTrendChartInner({ data }: { data?: RevenueTrend[] }) {
  if (!data) return <div className="h-64 w-full" />;

  const chartData = data.map((item) => ({
    id: item.date,
    name: format(new Date(item.date), "dd/MM", { locale: vi }),
    revenue: item.revenue,
  }));
  const latestId = chartData.at(-1)?.id;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
          />
          <Tooltip
            cursor={{ fill: "color-mix(in oklch, var(--primary) 8%, transparent)" }}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid var(--border)",
              background: "var(--card)",
              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
            }}
            formatter={(value: number | string | undefined) => [
              `${(Number(value) || 0).toLocaleString("vi-VN")} ₫`,
              "Doanh thu",
            ]}
          />
          <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={32}>
            {chartData.map((entry) => (
              <Cell
                key={entry.id}
                fill="var(--primary)"
                opacity={entry.id === latestId ? 1 : 0.65}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
