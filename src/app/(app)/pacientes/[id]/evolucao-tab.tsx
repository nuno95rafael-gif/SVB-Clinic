"use client";

import { useMemo, useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BodyMap } from "@/app/(app)/consultas/[id]/body-map";
import type { BodyView, PainAssessment } from "@/types/database";

const REGION_COLORS = [
  "#0d5ba8",
  "#a53f4f",
  "#a8701f",
  "#0d7a68",
  "#7c3aed",
  "#c2410c",
  "#0891b2",
  "#be185d",
];

export function EvolucaoTab({ points }: { points: PainAssessment[] }) {
  const [view, setView] = useState<BodyView>("anterior");

  const consultations = useMemo(() => {
    const map = new Map<string, { id: string; date: string; points: PainAssessment[] }>();
    for (const p of points) {
      const existing = map.get(p.consultation_id);
      if (existing) {
        existing.points.push(p);
        if (p.recorded_at < existing.date) existing.date = p.recorded_at;
      } else {
        map.set(p.consultation_id, { id: p.consultation_id, date: p.recorded_at, points: [p] });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [points]);

  const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(
    consultations.length ? consultations[consultations.length - 1].id : null
  );

  const regions = useMemo(
    () => Array.from(new Set(points.map((p) => p.region))).sort(),
    [points]
  );

  const chartData = useMemo(
    () =>
      consultations.map((c) => {
        const row: Record<string, number | string> = {
          date: new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "2-digit" }).format(
            new Date(c.date)
          ),
        };
        for (const region of regions) {
          const regionPoints = c.points.filter((p) => p.region === region);
          if (regionPoints.length > 0) {
            row[region] = Math.max(...regionPoints.map((p) => p.intensity));
          }
        }
        return row;
      }),
    [consultations, regions]
  );

  if (points.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-foreground-faint">
          Ainda sem marcações de dor registadas. Aparecem aqui assim que forem feitas numa
          consulta.
        </CardContent>
      </Card>
    );
  }

  const selectedPoints =
    consultations.find((c) => c.id === selectedConsultationId)?.points ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Evolução da dor por região</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--foreground-faint)" />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} stroke="var(--foreground-faint)" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {regions.map((region, i) => (
                  <Line
                    key={region}
                    type="monotone"
                    dataKey={region}
                    name={region}
                    stroke={REGION_COLORS[i % REGION_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mapa corporal por consulta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {consultations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedConsultationId(c.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-[12.5px] font-medium border",
                  c.id === selectedConsultationId
                    ? "bg-accent-soft text-accent-ink border-accent"
                    : "border-line text-foreground-faint hover:text-foreground"
                )}
              >
                {new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium" }).format(new Date(c.date))}
              </button>
            ))}
          </div>
          <BodyMap view={view} onViewChange={setView} points={selectedPoints} readOnly />
        </CardContent>
      </Card>
    </div>
  );
}
