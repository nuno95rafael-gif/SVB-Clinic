"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type {
  BodySide,
  BodyView,
  CarePlan,
  PainAssessment,
  PainFrequency,
  PainType,
  PhysicalAssessment,
  Symptom,
  SymptomType,
  TreatmentRecord,
} from "@/types/database";

function path(appointmentId: string) {
  return `/consultas/${appointmentId}`;
}

export async function saveChiefComplaint(
  consultationId: string,
  appointmentId: string,
  chiefComplaint: string,
  sessionNotes: string
) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("consultations")
    .update({
      chief_complaint: chiefComplaint || null,
      session_notes: sessionNotes || null,
    })
    .eq("id", consultationId);

  if (error) return { error: error.message };
  revalidatePath(path(appointmentId));
  return { error: null };
}

export async function addSymptom(
  consultationId: string,
  appointmentId: string,
  symptomType: SymptomType,
  notes: string
): Promise<{ data: Symptom | null; error: string | null }> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("symptoms")
    .insert({ consultation_id: consultationId, symptom_type: symptomType, notes: notes || null })
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  revalidatePath(path(appointmentId));
  return { data: data as Symptom, error: null };
}

export async function removeSymptom(symptomId: string, appointmentId: string) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("symptoms").delete().eq("id", symptomId);
  if (error) return { error: error.message };
  revalidatePath(path(appointmentId));
  return { error: null };
}

export async function addPainAssessment(input: {
  consultationId: string;
  appointmentId: string;
  patientId: string;
  bodyView: BodyView;
  region: string;
  side: BodySide;
  x: number;
  y: number;
  intensity: number;
  painType: PainType | null;
  frequency: PainFrequency | null;
  observations: string;
}): Promise<{ data: PainAssessment | null; error: string | null }> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pain_assessments")
    .insert({
      consultation_id: input.consultationId,
      patient_id: input.patientId,
      body_view: input.bodyView,
      region: input.region,
      side: input.side,
      x: input.x,
      y: input.y,
      intensity: input.intensity,
      pain_type: input.painType,
      frequency: input.frequency,
      observations: input.observations || null,
    })
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  revalidatePath(path(input.appointmentId));
  return { data: data as PainAssessment, error: null };
}

export async function removePainAssessment(pointId: string, appointmentId: string) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("pain_assessments").delete().eq("id", pointId);
  if (error) return { error: error.message };
  revalidatePath(path(appointmentId));
  return { error: null };
}

export async function savePhysicalAssessment(
  existingId: string | null,
  consultationId: string,
  appointmentId: string,
  fields: {
    mobility: string;
    rom_notes: string;
    asymmetry: string;
    limitations: string;
  }
): Promise<{ data: PhysicalAssessment | null; error: string | null }> {
  await requireUser();
  const supabase = await createClient();

  const payload = {
    mobility: fields.mobility || null,
    rom_notes: fields.rom_notes || null,
    asymmetry: fields.asymmetry || null,
    limitations: fields.limitations || null,
  };

  const query = existingId
    ? supabase.from("physical_assessments").update(payload).eq("id", existingId)
    : supabase
        .from("physical_assessments")
        .insert({ consultation_id: consultationId, ...payload });

  const { data, error } = await query.select("*").single();

  if (error) return { data: null, error: error.message };
  revalidatePath(path(appointmentId));
  return { data: data as PhysicalAssessment, error: null };
}

export async function addTreatmentRecord(
  consultationId: string,
  appointmentId: string,
  input: { treatmentId: string | null; region: string; technique: string; observations: string }
): Promise<{ data: TreatmentRecord | null; error: string | null }> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("treatment_records")
    .insert({
      consultation_id: consultationId,
      treatment_id: input.treatmentId,
      region: input.region || null,
      technique: input.technique || null,
      observations: input.observations || null,
    })
    .select("*, treatments_catalog(id, name)")
    .single();

  if (error) return { data: null, error: error.message };
  revalidatePath(path(appointmentId));
  return { data: data as TreatmentRecord, error: null };
}

export async function removeTreatmentRecord(recordId: string, appointmentId: string) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("treatment_records").delete().eq("id", recordId);
  if (error) return { error: error.message };
  revalidatePath(path(appointmentId));
  return { error: null };
}

export async function saveCarePlan(
  consultationId: string,
  appointmentId: string,
  fields: {
    recommendations: string;
    home_care: string;
    education_notes: string;
    next_appointment_suggested_at: string;
  }
): Promise<{ data: CarePlan | null; error: string | null }> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("care_plans")
    .upsert(
      {
        consultation_id: consultationId,
        recommendations: fields.recommendations || null,
        home_care: fields.home_care || null,
        education_notes: fields.education_notes || null,
        next_appointment_suggested_at: fields.next_appointment_suggested_at || null,
      },
      { onConflict: "consultation_id" }
    )
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  revalidatePath(path(appointmentId));
  return { data: data as CarePlan, error: null };
}

export async function finishConsultation(consultationId: string, appointmentId: string) {
  await requireUser();
  const supabase = await createClient();

  const { error: consultationError } = await supabase
    .from("consultations")
    .update({ finished_at: new Date().toISOString() })
    .eq("id", consultationId);

  if (consultationError) return { error: consultationError.message };

  const { error: appointmentError } = await supabase
    .from("appointments")
    .update({ status: "completed" })
    .eq("id", appointmentId);

  if (appointmentError) return { error: appointmentError.message };

  revalidatePath(path(appointmentId));
  revalidatePath("/agenda");
  return { error: null };
}
