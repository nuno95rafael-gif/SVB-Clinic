"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(_prevState: { error: string | null }, formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/dashboard");

  if (!email || !password) {
    return { error: "Preencha email e password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Credenciais inválidas. Verifique o email e a password." };
  }

  redirect(next);
}

export async function requestPasswordReset(
  _prevState: { message: string | null; error: string | null },
  formData: FormData
) {
  const email = String(formData.get("email") || "").trim();
  if (!email) return { message: null, error: "Indique o seu email." };

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/atualizar-password`,
  });

  // Resposta genérica — não confirmar/negar se o email existe
  return {
    message: "Se o email existir na nossa base de dados, enviámos um link de recuperação.",
    error: null,
  };
}
