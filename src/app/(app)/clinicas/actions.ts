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

export async function updateClinic(
  _prevState: { error: string | null; saved: boolean },
  formData: FormData
) {
  await requireAdmin();
  const clinicId = String(formData.get("clinic_id") || "");
  const name = String(formData.get("name") || "").trim();
  const nif = String(formData.get("nif") || "").trim();
  const colorHex = String(formData.get("color_hex") || "#0d7a68");
  if (!clinicId) return { error: "Clínica inválida.", saved: false };
  if (!name) return { error: "Indique o nome da clínica.", saved: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("clinics")
    .update({ name, nif: nif || null, color_hex: colorHex })
    .eq("id", clinicId);

  if (error) return { error: "Não foi possível guardar. " + error.message, saved: false };

  revalidatePath(`/clinicas/${clinicId}`);
  revalidatePath("/clinicas");
  revalidatePath("/", "layout");
  return { error: null, saved: true };
}

export async function addClinicPayment(
  _prevState: { error: string | null },
  formData: FormData
) {
  await requireAdmin();
  const clinicId = String(formData.get("clinic_id") || "");
  const amount = Number(formData.get("amount"));
  const description = String(formData.get("description") || "").trim();
  const method = String(formData.get("method") || "") || null;
  const status = String(formData.get("status") || "pending");
  const paidAtRaw = String(formData.get("paid_at") || "");

  if (!clinicId) return { error: "Clínica inválida." };
  if (!amount || amount <= 0) return { error: "Indique um valor válido." };

  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({
    clinic_id: clinicId,
    amount,
    description: description || null,
    method,
    status,
    paid_at: paidAtRaw ? new Date(paidAtRaw).toISOString() : status === "paid" ? new Date().toISOString() : null,
  });

  if (error) return { error: "Não foi possível registar o pagamento. " + error.message };

  revalidatePath(`/clinicas/${clinicId}`);
  return { error: null };
}

export async function removeClinicPayment(paymentId: string, clinicId: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("payments").delete().eq("id", paymentId);
  revalidatePath(`/clinicas/${clinicId}`);
}

export async function deleteClinic(clinicId: string): Promise<{ error: string | null }> {
  await requireAdmin();
  const supabase = await createClient();

  // Apagar arrastaria pacientes/consultas/pagamentos reais — só permite
  // apagar uma clínica que já não tenha nada associado.
  const [patients, rooms, appointments, payments, professionals, users] = await Promise.all([
    supabase.from("patients").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId),
    supabase.from("rooms").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId),
    supabase.from("appointments").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId),
    supabase.from("professionals").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId),
  ]);

  const blockers: string[] = [];
  if ((patients.count ?? 0) > 0) blockers.push("pacientes");
  if ((rooms.count ?? 0) > 0) blockers.push("espaços");
  if ((appointments.count ?? 0) > 0) blockers.push("consultas");
  if ((payments.count ?? 0) > 0) blockers.push("pagamentos");
  if ((professionals.count ?? 0) > 0) blockers.push("profissionais");
  if ((users.count ?? 0) > 0) blockers.push("utilizadores");

  if (blockers.length > 0) {
    return {
      error: `Não é possível apagar: tem ${blockers.join(", ")} associados. Desative-a em vez disso, ou remova/transfira esses registos primeiro.`,
    };
  }

  const { error } = await supabase.from("clinics").delete().eq("id", clinicId);
  if (error) return { error: "Não foi possível apagar a clínica. " + error.message };

  revalidatePath("/clinicas");
  revalidatePath("/", "layout");
  return { error: null };
}
