import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getActiveClinicId } from "@/lib/clinic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { CalendarClock, Users, TrendingUp, Percent } from "lucide-react";
import type { Appointment } from "@/types/database";

export default async function DashboardPage() {
  const { profile } = await requireUser();
  const supabase = await createClient();
  const activeClinicId = await getActiveClinicId();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);
  const startOfNextMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth() + 1, 1);

  let todayQuery = supabase
    .from("appointments")
    .select("*, patients(id, full_name), professionals(id, color_hex, users(full_name)), rooms(id, name)")
    .gte("starts_at", startOfToday.toISOString())
    .lt("starts_at", endOfToday.toISOString())
    .order("starts_at", { ascending: true });

  let monthQuery = supabase
    .from("appointments")
    .select("id, status", { count: "exact" })
    .gte("starts_at", startOfMonth.toISOString())
    .lt("starts_at", startOfNextMonth.toISOString());

  let patientsQuery = supabase
    .from("patients")
    .select("id, status, registered_at", { count: "exact" });

  if (activeClinicId) {
    todayQuery = todayQuery.eq("clinic_id", activeClinicId);
    monthQuery = monthQuery.eq("clinic_id", activeClinicId);
    patientsQuery = patientsQuery.eq("clinic_id", activeClinicId);
  }

  if (profile.role === "professional") {
    const { data: prof } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", profile.id)
      .single();
    const profId = prof?.id;
    if (profId) {
      todayQuery = todayQuery.eq("professional_id", profId);
      monthQuery = monthQuery.eq("professional_id", profId);
      patientsQuery = patientsQuery.eq("professional_id", profId);
    }
  }

  const [{ data: todayAppointments }, { data: monthAppointments }, { data: patients }] =
    await Promise.all([todayQuery, monthQuery, patientsQuery]);

  const completed = monthAppointments?.filter((a) => a.status === "completed").length ?? 0;
  const cancelled =
    monthAppointments?.filter((a) => a.status === "cancelled" || a.status === "no_show").length ?? 0;
  const totalMonth = monthAppointments?.length ?? 0;
  const attendanceRate = totalMonth > 0 ? Math.round((completed / totalMonth) * 100) : 0;

  const activePatients = patients?.filter((p) => p.status === "active").length ?? 0;
  const newThisMonth =
    patients?.filter((p) => new Date(p.registered_at) >= startOfMonth).length ?? 0;

  const nextAppointment = todayAppointments?.find(
    (a) => new Date(a.starts_at) > new Date() && a.status !== "cancelled"
  );

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Olá, {profile.full_name.split(" ")[0]}</h1>
        <p className="text-sm text-foreground-soft mt-1">
          {new Intl.DateTimeFormat("pt-PT", { dateStyle: "full" }).format(new Date())}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard icon={CalendarClock} label="Consultas hoje" value={String(todayAppointments?.length ?? 0)} />
        <StatCard icon={Users} label="Pacientes ativos" value={String(activePatients)} />
        <StatCard icon={TrendingUp} label="Novos este mês" value={String(newThisMonth)} />
        <StatCard icon={Percent} label="Taxa de comparência" value={`${attendanceRate}%`} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Consultas de hoje</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!todayAppointments || todayAppointments.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-foreground-faint">
                Sem consultas agendadas para hoje.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {(todayAppointments as unknown as Appointment[]).map((appt) => (
                  <li key={appt.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium">{appt.patients?.full_name}</p>
                      <p className="text-[12.5px] text-foreground-faint">
                        {formatDateTime(appt.starts_at)} · {appt.rooms?.name} ·{" "}
                        {appt.professionals?.users?.full_name}
                      </p>
                    </div>
                    <StatusBadge status={appt.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próxima consulta</CardTitle>
          </CardHeader>
          <CardContent>
            {nextAppointment ? (
              <div>
                <p className="font-medium text-sm">
                  {(nextAppointment as unknown as Appointment).patients?.full_name}
                </p>
                <p className="text-[12.5px] text-foreground-faint mt-1">
                  {formatDateTime(nextAppointment.starts_at)}
                </p>
                <p className="text-[12.5px] text-foreground-faint">
                  {(nextAppointment as unknown as Appointment).rooms?.name}
                </p>
              </div>
            ) : (
              <p className="text-sm text-foreground-faint">Sem próximas consultas hoje.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-4 gap-4 mt-6">
        <MiniStat label="Consultas do mês" value={String(totalMonth)} />
        <MiniStat label="Realizadas" value={String(completed)} />
        <MiniStat label="Canceladas / faltas" value={String(cancelled)} />
        <MiniStat label="Receita média (em breve)" value={formatCurrency(0)} />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent-ink">
          <Icon size={17} />
        </div>
        <div>
          <p className="text-xl font-semibold leading-none">{value}</p>
          <p className="text-[12px] text-foreground-faint mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-line bg-surface px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-foreground-faint">{label}</p>
      <p className="text-lg font-semibold mt-0.5">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; tone: "neutral" | "accent" | "amber" | "rose" }> = {
    scheduled: { label: "Agendada", tone: "neutral" },
    confirmed: { label: "Confirmada", tone: "accent" },
    in_progress: { label: "Em curso", tone: "amber" },
    completed: { label: "Concluída", tone: "accent" },
    cancelled: { label: "Cancelada", tone: "rose" },
    no_show: { label: "Faltou", tone: "rose" },
  };
  const s = map[status] ?? map.scheduled;
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
