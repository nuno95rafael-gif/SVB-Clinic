import Link from "next/link";
import { cn } from "@/lib/utils";
import type { AgendaView } from "./date-utils";

const VIEWS: { value: AgendaView; label: string }[] = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
];

export function ViewTabs({ view, date }: { view: AgendaView; date: string }) {
  return (
    <div className="flex rounded-md border border-line bg-surface p-0.5">
      {VIEWS.map((v) => (
        <Link
          key={v.value}
          href={`/agenda?view=${v.value}&date=${date}`}
          className={cn(
            "rounded px-3 py-1.5 text-[13px] font-medium transition-colors",
            v.value === view
              ? "bg-accent-soft text-accent-ink"
              : "text-foreground-faint hover:text-foreground"
          )}
        >
          {v.label}
        </Link>
      ))}
    </div>
  );
}
