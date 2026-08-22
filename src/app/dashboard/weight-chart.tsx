"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ProgressEntry } from "@/lib/progress/queries";

export function WeightChart({ history }: { history: ProgressEntry[] }) {
  const data = history
    .filter((entry) => entry.weight !== null)
    .map((entry) => ({
      date: new Date(entry.recordedAt).toLocaleDateString("pt-BR", {
        timeZone: "UTC",
        day: "2-digit",
        month: "2-digit",
      }),
      weight: entry.weight,
    }));

  if (data.length < 2) {
    return (
      <p className="text-sm text-muted">
        Registre seu peso em pelo menos 2 datas diferentes para ver o gráfico de evolução.
      </p>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--muted)" />
          <YAxis tick={{ fontSize: 12 }} stroke="var(--muted)" domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--surface-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value) => [`${value} kg`, "Peso"]}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
