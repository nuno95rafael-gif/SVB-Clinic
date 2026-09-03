"use server";

import { createClient } from "@/lib/supabase/server";

export async function updatePassword(
  _prevState: { error: string | null; ok: boolean },
  formData: FormData
) {
  const password = String(formData.get("password") || "");
  if (password.length < 8) {
    return { error: "A password deve ter pelo menos 8 caracteres.", ok: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "Não foi possível atualizar a password. Peça um novo link.", ok: false };
  }

  return { error: null, ok: true };
}
