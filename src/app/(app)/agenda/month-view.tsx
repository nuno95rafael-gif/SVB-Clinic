import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getMonthGridDays, isSameDate, isSameMonthAs, toISODate } from "./date-utils";
import type { Appointment } from "@/types/database";

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MAX_VISIBLE = 3;

export function MonthView({
  monthDate,
  appointments,
}: {
  monthDate: Date;
  appointments: Appointment[];
}) {
  const days = getMonthGridDays(monthDate);
  const today = new Date();

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 border-b border-line">
        {DAY_LABELS.map((l) => (
          <div
            key={l}
            className="px-2 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-foreground-faint"
          >
            {l}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayAppointments = appointments
            .filter((a) => isSameDate(new Date(a.starts_at), day))
            .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
          const inMonth = isSameMonthAs(day, monthDate);
          const isToday = isSameDate(day, today);
          const visible = dayAppointments.slice(0, MAX_VISIBLE);
          const hiddenCount = dayAppointments.length - visible.length;

          return (
            <div
              key={i}
              className={cn(
                "min-h-[104px] border-b border-r border-line p-1.5",
                !inMonth && "bg-background/60"
              )}
            >
              <Link
                href={`/agenda?view=day&date=${toISODate(day)}`}
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-[12.5px] font-medium hover:bg-background",
                  isToday ? "bg-accent text-white" : inMonth ? "text-foreground" : "text-foreground-faint"
                )}
              >
                {day.getDate()}
              </Link>

              <div className="mt-1 space-y-1">
                {visible.map((a) => (
                  <Link
                    key={a.id}
                    href={`/consultas/${a.id}`}
                    className="block truncate rounded px-1 py-0.5 text-[11px] leading-tight hover:opacity-80"
                    style={{
                      backgroundColor: `${a.professionals?.color_hex ?? "#0d7a68"}1a`,
                      borderLeft: `2px solid ${a.professionals?.color_hex ?? "#0d7a68"}`,
                    }}
                  >
                    {new Intl.DateTimeFormat("pt-PT", { timeStyle: "short" }).format(
                      new Date(a.starts_at)
                    )}{" "}
                    {a.patients?.full_name}
                  </Link>
                ))}
                {hiddenCount > 0 && (
                  <p className="px-1 text-[10.5px] text-foreground-faint">+{hiddenCount} mais</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
