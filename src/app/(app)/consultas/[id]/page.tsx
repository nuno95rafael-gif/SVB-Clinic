import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { ConsultationEditor } from "./consultation-editor";
import type {
  CarePlan,
  Consultation,
  PainAssessment,
  PhysicalAssessment,
  Symptom,
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
    { data: symptoms },
    { data: painPoints },
    { data: physicalAssessment },
    { data: treatmentRecords },
    { data: treatmentsCatalog },
    { data: carePlan },
  ] = await Promise.all([
    supabase.from("symptoms").select("*").eq("consultation_id", consultationRow.id),
    supabase.from("pain_assessments").select("*").eq("consultation_id", consultationRow.id),
    supabase
      .from("physical_assessments")
      .select("*")
      .eq("consultation_id", consultationRow.id)
      .maybeSingle(),
    supabase
      .from("treatment_records")
      .select("*, treatments_catalog(id, name)")
      .eq("consultation_id", consultationRow.id),
    supabase.from("treatments_catalog").select("id, name").eq("active", true).order("name"),
    supabase.from("care_plans").select("*").eq("consultation_id", consultationRow.id).maybeSingle(),
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
      initialSymptoms={(symptoms as Symptom[]) ?? []}
      initialPainPoints={(painPoints as PainAssessment[]) ?? []}
      initialPhysicalAssessment={(physicalAssessment as PhysicalAssessment | null) ?? null}
      initialTreatmentRecords={(treatmentRecords as TreatmentRecord[]) ?? []}
      treatmentsCatalog={treatmentsCatalog ?? []}
      initialCarePlan={(carePlan as CarePlan | null) ?? null}
    />
  );
}
