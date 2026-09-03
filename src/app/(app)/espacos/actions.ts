"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { getActiveClinicId } from "@/lib/clinic";

export async function createRoom(_prevState: { error: string | null }, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  if (!name) return { error: "Indique o nome do espaço." };

  const supabase = await createClient();
  const clinicId = await getActiveClinicId();

  const { error } = await supabase.from("rooms").insert({
    clinic_id: clinicId,
    name,
    description: description || null,
  });

  if (error) return { error: "Não foi possível criar o espaço. " + error.message };

  revalidatePath("/espacos");
  return { error: null };
}

export async function toggleRoomActive(roomId: string, active: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("rooms").update({ active }).eq("id", roomId);
  revalidatePath("/espacos");
}
