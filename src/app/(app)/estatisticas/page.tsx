import { addMonths, startOfMonth } from "date-fns";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { RevenueChart } from "./revenue-chart";

const MONTHS_BACK = 6;
const CLINIC_COLORS = ["#0d5ba8", "#a53f4f", "#a8701f", "#0d7a68", "#7c3aed", "#c2410c"];

export default async function EstatisticasPage() {
  await requireAdmin();
  const supabase = await createClient();

  const now = new Date();
  const rangeStart = startOfMonth(addMonths(now, -(MONTHS_BACK - 1)));
  const rangeEnd = startOfMonth(addMonths(now, 1));

  const [{ data: clinics }, { data: payments }, { data: appointments }, { data: newPatients }] =
    await Promise.all([
      supabase.from("clinics").select("id, name"),
      supabase
        .from("payments")
        .select("amount, status, paid_at, created_at, clinic_id, patients(clinic_id)")
        .gte("created_at", rangeStart.toISOString())
        .lt("created_at", rangeEnd.toISOString()),
      supabase
        .from("appointments")
        .select("status, starts_at")
        .gte("starts_at", rangeStart.toISOString())
        .lt("starts_at", rangeEnd.toISOString()),
      supabase
        .from("patients")
        .select("id, registered_at")
        .gte("registered_at", rangeStart.toISOString())
        .lt("registered_at", rangeEnd.toISOString()),
    ]);

  const clinicNameById = new Map((clinics ?? []).map((c) => [c.id, c.name]));
  const clinicList = clinics ?? [];

  type PaymentRow = {
    amount: number;
    status: string;
    paid_at: string | null;
    created_at: string;
    clinic_id: string | null;
    patients?: { clinic_id: string | null } | null;
  };

  const paidPayments = ((payments as PaymentRow[]) ?? []).filter((p) => p.status === "paid");

  // buckets mensais
  const months = Array.from({ length: MONTHS_BACK }, (_, i) =>
    startOfMonth(addMonths(rangeEnd, -(MONTHS_BACK - i)))
  );

  const chartData = months.map((monthStart) => {
    const monthEnd = addMonths(monthStart, 1);
    const label = new Intl.DateTimeFormat("pt-PT", { month: "short", year: "2-digit" }).format(
      monthStart
    );
    const row: Record<string, string | number> = { month: label };
    for (const clinic of clinicList) row[clinic.name] = 0;

    for (const p of paidPayments) {
      const d = new Date(p.paid_at ?? p.created_at);
      if (d >= monthStart && d < monthEnd) {
        const clinicId = p.clinic_id ?? p.patients?.clinic_id ?? null;
        const name = clinicId ? clinicNameById.get(clinicId) ?? "Outro" : "Outro";
        row[name] = (Number(row[name]) || 0) + p.amount;
      }
    }
    return row;
  });

  const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const revenueByClinic = new Map<string, number>();
  for (const p of paidPayments) {
    const clinicId = p.clinic_id ?? p.patients?.clinic_id ?? null;
    const name = clinicId ? clinicNameById.get(clinicId) ?? "Outro" : "Outro";
    revenueByClinic.set(name, (revenueByClinic.get(name) ?? 0) + p.amount);
  }

  const completedAppointments = (appointments ?? []).filter((a) => a.status === "completed").length;
  const cancelledAppointments = (appointments ?? []).filter(
    (a) => a.status === "cancelled" || a.status === "no_show"
  ).length;
  const totalAppointments = appointments?.length ?? 0;
  const attendanceRate =
    totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0;

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Estatísticas</h1>
        <p className="text-sm text-foreground-soft mt-1">Últimos {MONTHS_BACK} meses</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Mini label="Receita total" value={formatCurrency(totalRevenue)} />
        <Mini label="Consultas realizadas" value={String(completedAppointments)} />
        <Mini label="Canceladas / faltas" value={String(cancelledAppointments)} />
        <Mini label="Taxa de comparência" value={`${attendanceRate}%`} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Receita mensal por clínica</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart
              data={chartData}
              clinicNames={clinicList.map((c) => c.name)}
              colors={CLINIC_COLORS}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receita por clínica</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {revenueByClinic.size === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-foreground-faint">
                Sem pagamentos neste período.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {Array.from(revenueByClinic.entries())
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, value]) => (
                    <li key={name} className="flex items-center justify-between px-5 py-3">
                      <span className="text-sm">{name}</span>
                      <span className="text-sm font-medium">{formatCurrency(value)}</span>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-[12.5px] text-foreground-faint mt-4">
        {newPatients?.length ?? 0} paciente{newPatients?.length === 1 ? "" : "s"} novo
        {newPatients?.length === 1 ? "" : "s"} nos últimos {MONTHS_BACK} meses.
      </p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-line bg-surface px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-foreground-faint">{label}</p>
      <p className="text-lg font-semibold mt-0.5">{value}</p>
    </div>
  );
}
