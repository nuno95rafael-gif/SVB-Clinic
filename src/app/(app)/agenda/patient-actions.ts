"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

const schema = z.object({
  full_name: z.string().min(2, "Indique o nome completo."),
  clinic_id: z.string().uuid("Selecione uma clínica."),
});

export async function quickCreatePatient(formData: FormData) {
  const { profile } = await requireUser();

  const parsed = schema.safeParse({
    full_name: formData.get("full_name"),
    clinic_id: formData.get("clinic_id"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", patient: null };
  }

  const supabase = await createClient();

  let professionalId: string | null = null;
  if (profile.role === "professional") {
    const { data: prof } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", profile.id)
      .single();
    professionalId = prof?.id ?? null;
  }

  const { data: patient, error } = await supabase
    .from("patients")
    .insert({
      clinic_id: parsed.data.clinic_id,
      professional_id: professionalId,
      full_name: parsed.data.full_name,
      created_by: profile.id,
    })
    .select("id, full_name, clinic_id")
    .single();

  if (error || !patient) {
    return { error: "Não foi possível criar o paciente. " + (error?.message ?? ""), patient: null };
  }

  // Registo mínimo — a história clínica completa é preenchida na primeira consulta.
  await supabase.from("clinical_records").insert({ patient_id: patient.id });

  return { error: null, patient };
}
