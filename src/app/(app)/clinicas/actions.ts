"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function createClinic(_prevState: { error: string | null }, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const nif = String(formData.get("nif") || "").trim();
  if (!name) return { error: "Indique o nome da clínica." };

  const supabase = await createClient();
  const { error } = await supabase.from("clinics").insert({
    name,
    nif: nif || null,
  });

  if (error) return { error: "Não foi possível criar a clínica. " + error.message };

  revalidatePath("/clinicas");
  revalidatePath("/", "layout");
  return { error: null };
}

export async function toggleClinicActive(clinicId: string, active: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("clinics").update({ active }).eq("id", clinicId);
  revalidatePath("/clinicas");
  revalidatePath("/", "layout");
}
