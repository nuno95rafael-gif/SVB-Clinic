import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getWeekDays, isSameDate, toISODate } from "./date-utils";
import type { Appointment } from "@/types/database";

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function WeekView({
  weekStart,
  appointments,
}: {
  weekStart: Date;
  appointments: Appointment[];
}) {
  const days = getWeekDays(weekStart);
  const today = new Date();

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 divide-x divide-line">
        {days.map((day, i) => {
          const dayAppointments = appointments
            .filter((a) => isSameDate(new Date(a.starts_at), day))
            .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
          const isToday = isSameDate(day, today);

          return (
            <div key={i} className="min-h-[420px]">
              <Link
                href={`/agenda?view=day&date=${toISODate(day)}`}
                className={cn(
                  "block border-b border-line px-2.5 py-2 text-center hover:bg-background",
                  isToday && "bg-accent-soft"
                )}
              >
                <p className="text-[11px] uppercase tracking-wide text-foreground-faint">
                  {DAY_LABELS[i]}
                </p>
                <p
                  className={cn(
                    "text-[13.5px] font-semibold",
                    isToday ? "text-accent-ink" : "text-foreground"
                  )}
                >
                  {day.getDate()}
                </p>
              </Link>

              <div className="space-y-1 p-1.5">
                {dayAppointments.map((a) => (
                  <Link
                    key={a.id}
                    href={`/consultas/${a.id}`}
                    className="block rounded px-1.5 py-1 text-[11.5px] leading-tight hover:opacity-80"
                    style={{
                      backgroundColor: `${a.professionals?.color_hex ?? "#0d7a68"}1a`,
                      borderLeft: `2px solid ${a.professionals?.color_hex ?? "#0d7a68"}`,
                    }}
                  >
                    <span className="font-medium tabular-nums">
                      {new Intl.DateTimeFormat("pt-PT", { timeStyle: "short" }).format(
                        new Date(a.starts_at)
                      )}
                    </span>{" "}
                    <span className="truncate">{a.patients?.full_name}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
