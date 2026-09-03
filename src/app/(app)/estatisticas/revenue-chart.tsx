"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function RevenueChart({
  data,
  clinicNames,
  colors,
}: {
  data: Record<string, string | number>[];
  clinicNames: string[];
  colors: string[];
}) {
  if (clinicNames.length === 0) {
    return (
      <p className="py-14 text-center text-sm text-foreground-faint">
        Crie uma clínica para ver a receita mensal.
      </p>
    );
  }

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--foreground-faint)" />
          <YAxis tick={{ fontSize: 12 }} stroke="var(--foreground-faint)" />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {clinicNames.map((name, i) => (
            <Bar
              key={name}
              dataKey={name}
              stackId="revenue"
              fill={colors[i % colors.length]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
