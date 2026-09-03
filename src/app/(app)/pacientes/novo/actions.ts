"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getActiveClinicId } from "@/lib/clinic";

const schema = z.object({
  full_name: z.string().min(2, "Indique o nome completo."),
  birth_date: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido.").optional().or(z.literal("")),
  professional_id: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export async function createPatient(
  _prevState: { error: string | null },
  formData: FormData
) {
  const { profile } = await requireUser();

  const parsed = schema.safeParse({
    full_name: formData.get("full_name"),
    birth_date: formData.get("birth_date") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || "",
    professional_id: formData.get("professional_id") || "",
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();

  let professionalId = parsed.data.professional_id || null;
  if (profile.role === "professional") {
    const { data: prof } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", profile.id)
      .single();
    professionalId = prof?.id ?? null;
  }

  const clinicId = await getActiveClinicId();
  if (!clinicId) {
    return { error: "Selecione uma clínica específica na barra lateral antes de registar um paciente." };
  }

  const { data: patient, error } = await supabase
    .from("patients")
    .insert({
      clinic_id: clinicId,
      professional_id: professionalId,
      full_name: parsed.data.full_name,
      birth_date: parsed.data.birth_date || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      notes: parsed.data.notes || null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !patient) {
    return { error: "Não foi possível guardar o paciente. " + (error?.message ?? "") };
  }

  // Regista o registo clínico vazio associado (preenchido na tab História Clínica)
  await supabase.from("clinical_records").insert({ patient_id: patient.id });

  redirect(`/pacientes/${patient.id}`);
}
