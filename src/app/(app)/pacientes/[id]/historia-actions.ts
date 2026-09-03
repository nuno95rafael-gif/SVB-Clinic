"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

const RED_FLAGS = [
  "trauma_recente",
  "febre",
  "perda_peso_inexplicada",
  "alteracoes_neurologicas",
  "dor_noturna",
  "outros_sinais",
] as const;

export async function saveClinicalRecord(
  _prevState: { error: string | null; saved: boolean },
  formData: FormData
) {
  const { profile } = await requireUser();
  const patientId = String(formData.get("patient_id"));
  const supabase = await createClient();

  const red_flags = Object.fromEntries(
    RED_FLAGS.map((flag) => [flag, formData.get(`red_flag_${flag}`) === "on"])
  );

  const { error } = await supabase.from("clinical_records").upsert(
    {
      patient_id: patientId,
      motivo_consulta: String(formData.get("motivo_consulta") || "") || null,
      objetivo_paciente: String(formData.get("objetivo_paciente") || "") || null,
      profissao: String(formData.get("profissao") || "") || null,
      atividade_fisica: String(formData.get("atividade_fisica") || "") || null,
      lesoes_anteriores: String(formData.get("lesoes_anteriores") || "") || null,
      cirurgias: String(formData.get("cirurgias") || "") || null,
      patologias: String(formData.get("patologias") || "") || null,
      medicacao: String(formData.get("medicacao") || "") || null,
      alergias: String(formData.get("alergias") || "") || null,
      antecedentes: String(formData.get("antecedentes") || "") || null,
      red_flags,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "patient_id" }
  );

  if (error) {
    return { error: "Não foi possível guardar. " + error.message, saved: false };
  }

  revalidatePath(`/pacientes/${patientId}`);
  return { error: null, saved: true };
}

export { RED_FLAGS };
