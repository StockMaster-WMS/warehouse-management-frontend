"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DATA = [
  { name: "T2", nhap: 420, xuat: 380 },
  { name: "T3", nhap: 510, xuat: 440 },
  { name: "T4", nhap: 480, xuat: 460 },
  { name: "T5", nhap: 620, xuat: 520 },
  { name: "T6", nhap: 590, xuat: 610 },
  { name: "T7", nhap: 340, xuat: 290 },
  { name: "CN", nhap: 210, xuat: 180 },
];

export function InboundOutboundChart() {
  return (
    <div className="h-60 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={DATA} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
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
            dataKey="nhap"
            name="Nhập kho"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="xuat"
            name="Xuất kho"
            stroke="var(--chart-2)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
