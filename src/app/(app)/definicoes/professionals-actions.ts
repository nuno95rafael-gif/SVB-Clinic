"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function updateProfessional(
  _prevState: { error: string | null; saved: boolean },
  formData: FormData
) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const specialty = String(formData.get("specialty") || "");
  const license_number = String(formData.get("license_number") || "");
  const color_hex = String(formData.get("color_hex") || "#0d7a68");

  const supabase = await createClient();
  const { error } = await supabase
    .from("professionals")
    .update({ specialty: specialty || null, license_number: license_number || null, color_hex })
    .eq("id", id);

  if (error) return { error: "Não foi possível guardar. " + error.message, saved: false };

  revalidatePath("/definicoes");
  revalidatePath("/agenda");
  return { error: null, saved: true };
}

export async function deleteProfessional(professionalId: string): Promise<{ error: string | null }> {
  await requireAdmin();
  const supabase = await createClient();

  // Apagar arrastaria consultas/pacientes reais — só permite apagar um
  // profissional que já não tenha nada associado. A conta de utilizador
  // (login) não é tocada, só deixa de aparecer como profissional aqui.
  const [appointments, patients] = await Promise.all([
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", professionalId),
    supabase
      .from("patients")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", professionalId),
  ]);

  const blockers: string[] = [];
  if ((appointments.count ?? 0) > 0) blockers.push("consultas");
  if ((patients.count ?? 0) > 0) blockers.push("pacientes");

  if (blockers.length > 0) {
    return {
      error: `Não é possível apagar: tem ${blockers.join(" e ")} associados. Transfira-os para outro profissional primeiro, ou desative o utilizador em vez de apagar.`,
    };
  }

  const { error } = await supabase.from("professionals").delete().eq("id", professionalId);
  if (error) return { error: "Não foi possível apagar. " + error.message };

  revalidatePath("/definicoes");
  revalidatePath("/agenda");
  return { error: null };
}
