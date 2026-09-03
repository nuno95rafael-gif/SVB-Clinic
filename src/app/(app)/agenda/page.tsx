import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NovaConsultaForm } from "./form";
import { StatusSelect } from "./status-select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Appointment } from "@/types/database";

function dayBounds(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { profile } = await requireUser();
  const { date } = await searchParams;
  const dateStr = date || new Date().toISOString().slice(0, 10);
  const { start, end } = dayBounds(dateStr);

  const supabase = await createClient();

  let apptQuery = supabase
    .from("appointments")
    .select("*, patients(id, full_name), professionals(id, color_hex, users(full_name)), rooms(id, name)")
    .gte("starts_at", start.toISOString())
    .lt("starts_at", end.toISOString())
    .order("starts_at");

  const { data: patients } = await supabase.from("patients").select("id, full_name").order("full_name");
  const { data: rooms } = await supabase.from("rooms").select("id, name").eq("active", true).order("name");
  const { data: professionals } = await supabase
    .from("professionals")
    .select("id, users(full_name)")
    .eq("active", true);

  let ownProfessionalId: string | null = null;
  if (profile.role === "professional") {
    const { data: prof } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", profile.id)
      .single();
    ownProfessionalId = prof?.id ?? null;
    if (ownProfessionalId) apptQuery = apptQuery.eq("professional_id", ownProfessionalId);
  }

  const { data: appointments } = await apptQuery;

  const prevDate = new Date(start);
  prevDate.setDate(prevDate.getDate() - 1);
  const nextDate = new Date(start);
  nextDate.setDate(nextDate.getDate() + 1);
  const toISO = (d: Date) => d.toISOString().slice(0, 10);

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Agenda</h1>
          <p className="text-sm text-foreground-soft mt-1">
            {new Intl.DateTimeFormat("pt-PT", { dateStyle: "full" }).format(start)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/agenda?date=${toISO(prevDate)}`}>
            <Button variant="secondary" size="icon">
              <ChevronLeft size={16} />
            </Button>
          </Link>
          <Link href={`/agenda?date=${toISO(new Date())}`}>
            <Button variant="secondary" size="sm">
              Hoje
            </Button>
          </Link>
          <Link href={`/agenda?date=${toISO(nextDate)}`}>
            <Button variant="secondary" size="icon">
              <ChevronRight size={16} />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardContent className="p-0">
            {!appointments || appointments.length === 0 ? (
              <p className="px-5 py-14 text-center text-sm text-foreground-faint">
                Sem consultas agendadas neste dia.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {(appointments as unknown as Appointment[]).map((a) => (
                  <li key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div
                      className="w-1 self-stretch rounded-full"
                      style={{ backgroundColor: a.professionals?.color_hex ?? "#0d7a68" }}
                    />
                    <div className="w-16 shrink-0 text-sm font-medium tabular-nums">
                      {new Intl.DateTimeFormat("pt-PT", { timeStyle: "short" }).format(
                        new Date(a.starts_at)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.patients?.full_name}</p>
                      <p className="text-[12.5px] text-foreground-faint truncate">
                        {a.rooms?.name} · {a.professionals?.users?.full_name} · {a.duration_min} min
                      </p>
                    </div>
                    <StatusSelect appointmentId={a.id} status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

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
