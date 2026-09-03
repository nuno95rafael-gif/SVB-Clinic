import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/types/database";

// Lê o utilizador autenticado + o seu perfil (papel, clínica). Usar em
// Server Components de páginas protegidas. Redireciona para /login se a
// sessão não existir (segunda barreira, a par do middleware).
//
// Envolvido em cache() porque tanto o layout como a própria página chamam
// isto — sem memoização por pedido, seria auth.getUser() + SELECT a users
// duas vezes em cada navegação.
export const requireUser = cache(async function requireUser(): Promise<{
  profile: UserProfile;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return { profile: profile as UserProfile };
});

export async function requireAdmin() {
  const { profile } = await requireUser();
  if (profile.role !== "admin") redirect("/dashboard");
  return { profile };
}
