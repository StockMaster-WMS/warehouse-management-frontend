"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface RevenueTrend {
  date: string;
  revenue: number;
}

export function RevenueTrendChart({ data }: { data?: RevenueTrend[] }) {
  if (!data) return <div className="h-64 w-full" />;

  const chartData = data.map(d => ({
    name: format(new Date(d.date), "dd/MM", { locale: vi }),
    revenue: d.revenue,
  }));

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
            cursor={{ fill: "rgba(99, 102, 241, 0.05)" }}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid var(--border)",
              background: "var(--card)",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            }}
            formatter={(value: number | string | undefined) => [`${(Number(value) || 0).toLocaleString('vi-VN')} ₫`, "Doanh thu"]}
          />
          <Bar 
            dataKey="revenue" 
            fill="var(--indigo-600)" 
            radius={[4, 4, 0, 0]}
            barSize={32}
          >
            {chartData.map((_entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={index === chartData.length - 1 ? "#4f46e5" : "#818cf8"} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
