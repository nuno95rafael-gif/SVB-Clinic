import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate, formatDateTime, initials } from "@/lib/utils";
import { ResumoTab } from "./resumo-tab";
import { HistoriaTab } from "./historia-tab";
import { EvolucaoTab } from "./evolucao-tab";
import type { Appointment, PainAssessment } from "@/types/database";

const TABS = [
  { key: "resumo", label: "Resumo" },
  { key: "historia", label: "História clínica" },
  { key: "consultas", label: "Consultas" },
  { key: "corpo", label: "Corpo / Evolução" },
  { key: "documentos", label: "Documentos" },
  { key: "financeiro", label: "Financeiro" },
] as const;

export default async function PacienteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = "resumo" } = await searchParams;
  await requireUser();
  const supabase = await createClient();

  const [{ data: patient }, { data: clinicalRecord }, { data: appointments }, { data: painData }] =
    await Promise.all([
      supabase.from("patients").select("*, professionals(id, users(full_name))").eq("id", id).single(),
      supabase.from("clinical_records").select("*").eq("patient_id", id).single(),
      supabase
        .from("appointments")
        .select("id, starts_at, status, type, rooms(name)")
        .eq("patient_id", id)
        .order("starts_at", { ascending: false }),
      tab === "corpo"
        ? supabase
            .from("pain_assessments")
            .select("*")
            .eq("patient_id", id)
            .order("recorded_at", { ascending: true })
        : Promise.resolve({ data: null }),
    ]);

  if (!patient) notFound();

  const painPoints = (painData as PainAssessment[] | null) ?? [];

  const nextAppointment = appointments?.find(
    (a) => new Date(a.starts_at) > new Date() && a.status !== "cancelled"
  );
  const lastAppointment = appointments?.find(
    (a) => new Date(a.starts_at) <= new Date() && a.status === "completed"
  );

  return (
    <div className="p-8 max-w-5xl">
      <Link href="/pacientes" className="text-[13px] text-foreground-faint hover:text-foreground">
        ← Pacientes
      </Link>

      <div className="flex items-center gap-4 mt-3 mb-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-lg font-semibold text-accent-ink">
          {initials(patient.full_name)}
        </div>
        <div>
          <h1 className="text-xl font-semibold">{patient.full_name}</h1>
          <p className="text-[13px] text-foreground-faint mt-0.5">
            {patient.birth_date ? `${formatDate(patient.birth_date)} · ` : ""}
            {patient.professionals?.users?.full_name ?? "Sem profissional atribuído"}
          </p>
        </div>
        <Badge tone={patient.status === "active" ? "accent" : "neutral"} className="ml-auto">
          {patient.status === "active" ? "Ativo" : "Inativo"}
        </Badge>
      </div>

      <div className="flex gap-1 border-b border-line mb-6">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/pacientes/${id}?tab=${t.key}`}
            className={cn(
              "px-3.5 py-2.5 text-[13.5px] font-medium border-b-2 -mb-px",
              tab === t.key
                ? "border-accent text-accent-ink"
                : "border-transparent text-foreground-faint hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "resumo" && (
        <ResumoTab
          patient={patient}
          appointmentsCount={appointments?.length ?? 0}
          nextAppointment={nextAppointment}
          lastAppointment={lastAppointment}
        />
      )}

      {tab === "historia" && <HistoriaTab patientId={id} record={clinicalRecord} />}

      {tab === "consultas" && (
        <Card>
          <CardContent className="p-0">
            {!appointments || appointments.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-foreground-faint">
                Ainda não existem consultas para este paciente.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {(appointments as unknown as (Appointment & { rooms?: { name: string } })[]).map(
                  (a) => (
                    <li key={a.id}>
                      <Link
                        href={`/consultas/${a.id}`}
                        className="flex items-center justify-between px-5 py-3 hover:bg-background"
                      >
                        <div>
                          <p className="text-sm font-medium">{formatDateTime(a.starts_at)}</p>
                          <p className="text-[12.5px] text-foreground-faint">
                            {a.type} · {a.rooms?.name}
                          </p>
                        </div>
                        <Badge tone={a.status === "completed" ? "accent" : "neutral"}>{a.status}</Badge>
                      </Link>
                    </li>
                  )
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "corpo" && <EvolucaoTab points={painPoints} />}

      {(tab === "documentos" || tab === "financeiro") && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-foreground-faint">
            {tab === "documentos" && "Upload de documentos — planeado para a Fase 3."}
            {tab === "financeiro" && "Histórico de pagamentos deste paciente — planeado para a Fase 3."}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
