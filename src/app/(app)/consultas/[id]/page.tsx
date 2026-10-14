import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { ConsultationEditor } from "./consultation-editor";
import type {
  Consultation,
  PainAssessment,
  TreatmentRecord,
} from "@/types/database";

export default async function ConsultaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: appointmentId } = await params;
  const { profile } = await requireUser();
  const supabase = await createClient();

  const [{ data: appointment }, { data: existingConsultation }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, patient_id, status, patients(id, full_name)")
      .eq("id", appointmentId)
      .single(),
    supabase.from("consultations").select("*").eq("appointment_id", appointmentId).maybeSingle(),
  ]);

  if (!appointment) notFound();

  let consultation = existingConsultation;

  if (!consultation) {
    const { data: created, error } = await supabase
      .from("consultations")
      .insert({ appointment_id: appointmentId })
      .select("*")
      .single();

    if (created) {
      consultation = created;
    } else if (error?.code === "23505") {
      const { data: refetched } = await supabase
        .from("consultations")
        .select("*")
        .eq("appointment_id", appointmentId)
        .single();
      consultation = refetched;
    }
  }

  if (!consultation) notFound();
  const consultationRow = consultation as Consultation;

  const [
    { data: painPoints },
    { data: treatmentRecords },
  ] = await Promise.all([
    supabase.from("pain_assessments").select("*").eq("consultation_id", consultationRow.id),
    supabase
      .from("treatment_records")
      .select("*, treatments_catalog(id, name)")
      .eq("consultation_id", consultationRow.id),
  ]);

  const patient = (appointment as unknown as { patients?: { id: string; full_name: string } })
    .patients;

  return (
    <ConsultationEditor
      consultation={consultationRow}
      appointmentId={appointmentId}
      patientId={appointment.patient_id}
      patientName={patient?.full_name ?? "Paciente"}
      isAdmin={profile.role === "admin"}
      concluded={Boolean(consultationRow.finished_at)}
      initialPainPoints={(painPoints as PainAssessment[]) ?? []}
      initialTreatmentRecords={(treatmentRecords as TreatmentRecord[]) ?? []}
    />
  );
}
