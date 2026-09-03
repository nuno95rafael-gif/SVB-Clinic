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
  // Só o admin pode reatribuir o profissional responsável.
  if (profile.role === "admin") {
    update.professional_id = parsed.data.professional_id || null;
  }

  const { error } = await supabase.from("patients").update(update).eq("id", parsed.data.patient_id);

  if (error) return { error: "Não foi possível guardar. " + error.message, saved: false };

  revalidatePath("/pacientes");
  revalidatePath(`/pacientes/${parsed.data.patient_id}`);
  return { error: null, saved: true };
}

export async function deletePatient(patientId: string): Promise<{ error: string | null }> {
  await requireAdmin();
  const supabase = await createClient();

  // Apagar arrastaria consultas/pagamentos reais — só permite apagar um
  // paciente que já não tenha nada associado.
  const [appointments, payments] = await Promise.all([
    supabase.from("appointments").select("id", { count: "exact", head: true }).eq("patient_id", patientId),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("patient_id", patientId),
  ]);

  const blockers: string[] = [];
  if ((appointments.count ?? 0) > 0) blockers.push("consultas");
  if ((payments.count ?? 0) > 0) blockers.push("pagamentos");

  if (blockers.length > 0) {
    return {
      error: `Não é possível apagar: tem ${blockers.join(" e ")} associados. Desative o paciente em vez disso.`,
    };
  }

  const { error } = await supabase.from("patients").delete().eq("id", patientId);
  if (error) return { error: "Não foi possível apagar. " + error.message };

  revalidatePath("/pacientes");
  return { error: null };
}
