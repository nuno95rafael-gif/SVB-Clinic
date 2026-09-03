import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export type AgendaView = "day" | "week" | "month";

export function parseView(v: string | undefined): AgendaView {
  return v === "week" || v === "month" ? v : "day";
}

export function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseDateStr(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Intervalo [start, end) a consultar na base de dados para a vista atual.
export function getQueryRange(view: AgendaView, refDate: Date) {
  if (view === "day") {
    const start = new Date(refDate);
    return { start, end: addDays(start, 1) };
  }
  if (view === "week") {
    const start = startOfWeek(refDate, { weekStartsOn: 1 });
    return { start, end: addDays(start, 7) };
  }
  const start = startOfMonth(refDate);
  return { start, end: startOfMonth(addMonths(refDate, 1)) };
}

// Datas de navegação (anterior / hoje / seguinte) consoante a vista.
export function getNavDates(view: AgendaView, refDate: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (view === "day") {
    return { prev: addDays(refDate, -1), next: addDays(refDate, 1), today };
  }
  if (view === "week") {
    return { prev: addWeeks(refDate, -1), next: addWeeks(refDate, 1), today };
  }
  return { prev: addMonths(refDate, -1), next: addMonths(refDate, 1), today };
}

// Dias a desenhar na grelha do mês (semanas completas, incluindo dias de
// meses adjacentes para preencher a grelha).
export function getMonthGridDays(refDate: Date) {
  const gridStart = startOfWeek(startOfMonth(refDate), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(refDate), { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let d = new Date(gridStart); d <= gridEnd; d = addDays(d, 1)) {
    days.push(new Date(d));
  }
  return days;
}

export function getWeekDays(weekStart: Date) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonthAs(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

// Combina os inputs <date>/<time> num instante UTC usando o fuso horário do
// BROWSER (o mesmo que mostra as horas ao utilizador) — em vez de deixar o
// servidor interpretar "AAAA-MM-DDTHH:MM" sem offset, que o Node lê como o
// seu próprio fuso (UTC na Vercel) e desalinha a hora sempre que o browser
// está noutro fuso (ex.: Europe/Lisbon em horário de verão).
export function toStartsAtISO(dateStr: string, timeStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm).toISOString();
}
