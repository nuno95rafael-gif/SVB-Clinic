import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const ACTIVE_CLINIC_COOKIE = "active_clinic_id";
// Valor especial do cookie que representa "Todas as clínicas" — distinto de
// um cookie em falta (que continua a cair na primeira clínica ativa).
export const ALL_CLINICS_VALUE = "all";

// Clínica em que o utilizador está "a trabalhar" neste momento. Guardada em
// cookie (não na sessão) porque um único profissional pode operar em várias
// clínicas e trocar entre elas sem isso fazer parte da identidade do login.
// null significa "todas as clínicas" — só quando escolhido explicitamente.
//
// cache() porque o layout e cada página chamam isto — sem memoização por
// pedido seria mais uma query duplicada em cada navegação.
export const getActiveClinicId = cache(async function getActiveClinicId(): Promise<
  string | null
> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ACTIVE_CLINIC_COOKIE)?.value;

  if (cookieValue === ALL_CLINICS_VALUE) return null;

  const supabase = await createClient();

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

// Para colunas obrigatórias (não-nulas) onde a clínica em si é só um valor
// de referência sem impacto funcional (ex: professionals.clinic_id, que não
// filtra nada na agenda) — usa a clínica ativa e, com "Todas" selecionado,
// cai na primeira clínica ativa em vez de bloquear a ação.
export async function getActiveClinicIdOrFirst(): Promise<string | null> {
  const activeClinicId = await getActiveClinicId();
  if (activeClinicId) return activeClinicId;

  const supabase = await createClient();
  const { data: first } = await supabase
    .from("clinics")
    .select("id")
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return first?.id ?? null;
}
