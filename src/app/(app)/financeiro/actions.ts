"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function addPayment(_prevState: { error: string | null }, formData: FormData) {
  await requireAdmin();
  const patientId = String(formData.get("patient_id") || "");
  const appointmentId = String(formData.get("appointment_id") || "");
  const amount = Number(formData.get("amount"));
  const method = String(formData.get("method") || "") || null;
  const status = String(formData.get("status") || "pending");
  const paidAtRaw = String(formData.get("paid_at") || "");

  if (!patientId) return { error: "Selecione um paciente." };
  if (!amount || amount <= 0) return { error: "Indique um valor válido." };

  const supabase = await createClient();

  const { data: patient } = await supabase
    .from("patients")
    .select("clinic_id")
    .eq("id", patientId)
    .single();

  const { error } = await supabase.from("payments").insert({
    patient_id: patientId,
    appointment_id: appointmentId || null,
    clinic_id: patient?.clinic_id ?? null,
    amount,
    method,
    status,
    paid_at: paidAtRaw ? new Date(paidAtRaw).toISOString() : status === "paid" ? new Date().toISOString() : null,
  });

  if (error) return { error: "Não foi possível registar o pagamento. " + error.message };

  revalidatePath("/financeiro");
  revalidatePath("/estatisticas");
  return { error: null };
}

export async function updatePayment(
  _prevState: { error: string | null; saved: boolean },
  formData: FormData
) {
  await requireAdmin();
  const paymentId = String(formData.get("payment_id") || "");
  const amount = Number(formData.get("amount"));
  const method = String(formData.get("method") || "") || null;
  const status = String(formData.get("status") || "pending");
  const paidAtRaw = String(formData.get("paid_at") || "");
  const description = String(formData.get("description") || "").trim();

  if (!paymentId) return { error: "Pagamento inválido.", saved: false };
  if (!amount || amount <= 0) return { error: "Indique um valor válido.", saved: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("payments")
    .update({
      amount,
      method,
      status,
      description: description || null,
      paid_at: paidAtRaw ? new Date(paidAtRaw).toISOString() : status === "paid" ? new Date().toISOString() : null,
    })
    .eq("id", paymentId);

  if (error) return { error: "Não foi possível guardar. " + error.message, saved: false };

  revalidatePath("/financeiro");
  revalidatePath("/estatisticas");
  return { error: null, saved: true };
}

export async function deletePayment(paymentId: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("payments").delete().eq("id", paymentId);
  revalidatePath("/financeiro");
  revalidatePath("/estatisticas");
}
