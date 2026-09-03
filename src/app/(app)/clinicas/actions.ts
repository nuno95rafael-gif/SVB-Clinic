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
  if (!clinicId) return { error: "Clínica inválida.", saved: false };
  if (!name) return { error: "Indique o nome da clínica.", saved: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("clinics")
    .update({ name, nif: nif || null })
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
