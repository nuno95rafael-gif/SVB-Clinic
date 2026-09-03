"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function updateProfessional(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const specialty = String(formData.get("specialty") || "");
  const license_number = String(formData.get("license_number") || "");
  const color_hex = String(formData.get("color_hex") || "#0d7a68");

  const supabase = await createClient();
  await supabase
    .from("professionals")
    .update({ specialty: specialty || null, license_number: license_number || null, color_hex })
    .eq("id", id);

  revalidatePath("/profissionais");
}
