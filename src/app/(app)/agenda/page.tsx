import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getActiveClinicId } from "@/lib/clinic";
import { Button } from "@/components/ui/button";
import { NovaConsultaForm } from "./form";
import { DayView } from "./day-view";
import { WeekView } from "./week-view";
import { MonthView } from "./month-view";
import { ViewTabs } from "./view-tabs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getNavDates, getQueryRange, parseDateStr, parseView, toISODate } from "./date-utils";
import type { AgendaView } from "./date-utils";
import type { Appointment } from "@/types/database";

function headerTitle(view: AgendaView, refDate: Date, rangeStart: Date, rangeEnd: Date) {
  if (view === "day") {
    return new Intl.DateTimeFormat("pt-PT", { dateStyle: "full" }).format(refDate);
  }
  if (view === "week") {
    const lastDay = new Date(rangeEnd);
    lastDay.setDate(lastDay.getDate() - 1);
    const sameMonth = rangeStart.getMonth() === lastDay.getMonth();
    const start = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: sameMonth ? undefined : "long" }).format(rangeStart);
    const end = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "long", year: "numeric" }).format(lastDay);
    return `${start} – ${end}`;
  }
  return new Intl.DateTimeFormat("pt-PT", { month: "long", year: "numeric" }).format(refDate);
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string }>;
}) {
  const { profile } = await requireUser();
  const { date, view: viewParam } = await searchParams;
  const view = parseView(viewParam);
  const dateStr = date || toISODate(new Date());
  const refDate = parseDateStr(dateStr);
  const { start, end } = getQueryRange(view, refDate);

  const supabase = await createClient();

  // Fase 1 — tudo o que não depende de nada mais, em paralelo.
  const [activeClinicId, { data: professionals }, ownProfResult] = await Promise.all([
    getActiveClinicId(),
    supabase.from("professionals").select("id, users(full_name)").eq("active", true),
    profile.role === "professional"
      ? supabase.from("professionals").select("id").eq("user_id", profile.id).single()
      : Promise.resolve({ data: null }),
  ]);
  const ownProfessionalId = ownProfResult.data?.id ?? null;

  // Fase 2 — depende da clínica ativa e (se profissional) do próprio id.
  let apptQuery = supabase
    .from("appointments")
    .select("*, patients(id, full_name), professionals(id, color_hex, users(full_name)), rooms(id, name)")
    .gte("starts_at", start.toISOString())
    .lt("starts_at", end.toISOString())
    .order("starts_at");
  let patientsQuery = supabase.from("patients").select("id, full_name").order("full_name");
  let roomsQuery = supabase.from("rooms").select("id, name").eq("active", true).order("name");

  if (activeClinicId) {
    apptQuery = apptQuery.eq("clinic_id", activeClinicId);
    patientsQuery = patientsQuery.eq("clinic_id", activeClinicId);
    roomsQuery = roomsQuery.eq("clinic_id", activeClinicId);
  }
  if (ownProfessionalId) apptQuery = apptQuery.eq("professional_id", ownProfessionalId);

  const [{ data: patients }, { data: rooms }, { data: appointments }] = await Promise.all([
    patientsQuery,
    roomsQuery,
    apptQuery,
  ]);
  const list = (appointments as unknown as Appointment[]) ?? [];

  const { prev, next, today } = getNavDates(view, refDate);

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Agenda</h1>
          <p className="text-sm text-foreground-soft mt-1 capitalize">
            {headerTitle(view, refDate, start, end)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewTabs view={view} date={dateStr} />
          <div className="flex items-center gap-2">
            <Link href={`/agenda?view=${view}&date=${toISODate(prev)}`}>
              <Button variant="secondary" size="icon">
                <ChevronLeft size={16} />
              </Button>
            </Link>
            <Link href={`/agenda?view=${view}&date=${toISODate(today)}`}>
              <Button variant="secondary" size="sm">
                Hoje
              </Button>
            </Link>
            <Link href={`/agenda?view=${view}&date=${toISODate(next)}`}>
              <Button variant="secondary" size="icon">
                <ChevronRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          {view === "day" && (
            <DayView
              appointments={list}
              patients={patients ?? []}
              rooms={rooms ?? []}
              professionals={
                (professionals as unknown as { id: string; users: { full_name: string } }[]) ?? []
              }
              isAdmin={profile.role === "admin"}
            />
          )}
          {view === "week" && <WeekView weekStart={start} appointments={list} />}
          {view === "month" && <MonthView monthDate={refDate} appointments={list} />}
        </div>

        <NovaConsultaForm
          date={dateStr}
          patients={patients ?? []}
          rooms={rooms ?? []}
          professionals={
            (professionals as unknown as { id: string; users: { full_name: string } }[]) ?? []
          }
          isAdmin={profile.role === "admin"}
          ownProfessionalId={ownProfessionalId}
        />
      </div>
    </div>
  );
}
