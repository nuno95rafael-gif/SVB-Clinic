import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const ACTIVE_CLINIC_COOKIE = "active_clinic_id";

// Clínica em que o utilizador está "a trabalhar" neste momento. Guardada em
// cookie (não na sessão) porque um único profissional pode operar em várias
// clínicas e trocar entre elas sem isso fazer parte da identidade do login.
//
// cache() porque o layout e cada página chamam isto — sem memoização por
// pedido seria mais uma query duplicada em cada navegação.
export const getActiveClinicId = cache(async function getActiveClinicId(): Promise<
  string | null
> {
  const cookieStore = await cookies();
  const supabase = await createClient();
  const cookieValue = cookieStore.get(ACTIVE_CLINIC_COOKIE)?.value;

  if (cookieValue) {
    const { data } = await supabase
      .from("clinics")
      .select("id")
      .eq("id", cookieValue)
      .eq("active", true)
      .maybeSingle();
    if (data) return data.id;
  }

  const { data: first } = await supabase
    .from("clinics")
    .select("id")
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return first?.id ?? null;
});
