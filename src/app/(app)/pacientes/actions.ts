"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, requireAdmin } from "@/lib/auth";

const schema = z.object({
  patient_id: z.string().uuid(),
  full_name: z.string().min(2, "Indique o nome completo."),
  birth_date: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido.").optional().or(z.literal("")),
  professional_id: z.string().uuid().optional().or(z.literal("")),
  clinic_id: z.string().uuid().optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]),
});

export async function updatePatient(
  _prevState: { error: string | null; saved: boolean },
  formData: FormData
) {
  const { profile } = await requireUser();

  const parsed = schema.safeParse({
    patient_id: formData.get("patient_id"),
    full_name: formData.get("full_name"),
    birth_date: formData.get("birth_date") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || "",
    professional_id: formData.get("professional_id") || "",
    clinic_id: formData.get("clinic_id") || "",
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", saved: false };
  }

  const supabase = await createClient();

  const update: Record<string, unknown> = {
    full_name: parsed.data.full_name,
    birth_date: parsed.data.birth_date || null,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    status: parsed.data.status,
  };
  // Só o admin pode reatribuir o profissional responsável ou mudar a clínica.
  if (profile.role === "admin") {
    update.professional_id = parsed.data.professional_id || null;
    if (parsed.data.clinic_id) update.clinic_id = parsed.data.clinic_id;
  }

  const { error } = await supabase.from("patients").update(update).eq("id", parsed.data.patient_id);

  if (error) return { error: "Não foi possível guardar. " + error.message, saved: false };

  revalidatePath("/pacientes");
  revalidatePath(`/pacientes/${parsed.data.patient_id}`);
  revalidatePath("/agenda");
  return { error: null, saved: true };
}

export async function deletePatient(patientId: string): Promise<{ error: string | null }> {
  await requireAdmin();
  const supabase = await createClient();

  // Apaga tudo o que está associado ao paciente, não só o registo dele.
  // clinical_records/documents/consent_records já têm cascade automática a
  // partir de patients na base de dados; pagamentos e consultas não têm
  // (para não desaparecerem sem querer só por apagar noutro sítio), por
  // isso apagam-se aqui explicitamente, por esta ordem: pagamentos primeiro
  // (podem referenciar uma das consultas), depois as consultas — o que
  // arrasta consigo, por cascade, sintomas, avaliações, tratamentos, plano
  // de cuidados e mapa de dor de cada uma.
  const { error: paymentsError } = await supabase
    .from("payments")
    .delete()
    .eq("patient_id", patientId);
  if (paymentsError) {
    return { error: "Não foi possível apagar os pagamentos associados. " + paymentsError.message };
  }

  const { error: appointmentsError } = await supabase
    .from("appointments")
    .delete()
    .eq("patient_id", patientId);
  if (appointmentsError) {
    return { error: "Não foi possível apagar as consultas associadas. " + appointmentsError.message };
  }

  const { error } = await supabase.from("patients").delete().eq("id", patientId);
  if (error) return { error: "Não foi possível apagar o paciente. " + error.message };

  revalidatePath("/pacientes");
  revalidatePath("/agenda");
  revalidatePath("/financeiro");
  revalidatePath("/estatisticas");
  return { error: null };
}
