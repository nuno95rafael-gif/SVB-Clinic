"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

const schema = z.object({
  patient_id: z.string().uuid("Selecione ou crie um paciente."),
  // Derivado do paciente escolhido (cada paciente pertence a uma única
  // clínica) — não há seletor de clínica próprio no formulário.
  clinic_id: z.string().uuid("Selecione ou crie um paciente."),
  professional_id: z.string().uuid("Selecione um profissional."),
  room_id: z.string().uuid("Selecione um espaço."),
  // Já vem como ISO UTC calculado no browser (ver toStartsAtISO em
  // date-utils.ts) — não se reconstrói data+hora no servidor, porque o
  // Node/Vercel interpreta "AAAA-MM-DDTHH:MM" sem offset no seu próprio
  // fuso (UTC), o que desalinha a hora sempre que o browser está noutro.
  starts_at: z.string().refine((v) => !isNaN(Date.parse(v)), "Data/hora inválida."),
  duration_min: z.coerce.number().int().min(5).max(480),
  type: z.string().min(1),
  notes: z.string().optional(),
  amount: z.string().optional(),
});

function parseAmount(amount: string | undefined) {
  if (!amount) return null;
  const n = Number(amount);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function createAppointment(
  _prevState: { error: string | null; ok: boolean },
  formData: FormData
) {
  const { profile } = await requireUser();

  const parsed = schema.safeParse({
    clinic_id: formData.get("clinic_id"),
    patient_id: formData.get("patient_id"),
    professional_id: formData.get("professional_id"),
    room_id: formData.get("room_id"),
    starts_at: formData.get("starts_at"),
    duration_min: formData.get("duration_min"),
    type: formData.get("type"),
    notes: formData.get("notes") || undefined,
    amount: formData.get("amount") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", ok: false };
  }

  const supabase = await createClient();

  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      clinic_id: parsed.data.clinic_id,
      patient_id: parsed.data.patient_id,
      professional_id: parsed.data.professional_id,
      room_id: parsed.data.room_id,
      starts_at: parsed.data.starts_at,
      duration_min: parsed.data.duration_min,
      type: parsed.data.type,
      notes: parsed.data.notes || null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) {
    // exclusion_violation = conflito de agenda (sala ou profissional já ocupado)
    if (error.code === "23P01") {
      return {
        error: "Conflito de agenda: a sala ou o profissional já têm uma consulta nesse horário.",
        ok: false,
      };
    }
    return { error: "Não foi possível criar a consulta. " + error.message, ok: false };
  }

  const amount = parseAmount(parsed.data.amount);
  if (amount && appointment) {
    await supabase.from("payments").insert({
      appointment_id: appointment.id,
      patient_id: parsed.data.patient_id,
      clinic_id: parsed.data.clinic_id,
      amount,
      status: "pending",
    });
    revalidatePath("/financeiro");
    revalidatePath("/estatisticas");
  }

  revalidatePath("/agenda");
  return { error: null, ok: true };
}

export async function updateAppointmentStatus(appointmentId: string, status: string) {
  await requireUser();
  const supabase = await createClient();
  await supabase.from("appointments").update({ status }).eq("id", appointmentId);
  revalidatePath("/agenda");
}

const updateSchema = schema.extend({
  appointment_id: z.string().uuid(),
});

export async function updateAppointment(
  _prevState: { error: string | null; saved: boolean },
  formData: FormData
) {
  await requireUser();

  const parsed = updateSchema.safeParse({
    appointment_id: formData.get("appointment_id"),
    clinic_id: formData.get("clinic_id"),
    patient_id: formData.get("patient_id"),
    professional_id: formData.get("professional_id"),
    room_id: formData.get("room_id"),
    starts_at: formData.get("starts_at"),
    duration_min: formData.get("duration_min"),
    type: formData.get("type"),
    notes: formData.get("notes") || undefined,
    amount: formData.get("amount") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", saved: false };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("appointments")
    .update({
      clinic_id: parsed.data.clinic_id,
      patient_id: parsed.data.patient_id,
      professional_id: parsed.data.professional_id,
      room_id: parsed.data.room_id,
      starts_at: parsed.data.starts_at,
      duration_min: parsed.data.duration_min,
      type: parsed.data.type,
      notes: parsed.data.notes || null,
    })
    .eq("id", parsed.data.appointment_id);

  if (error) {
    if (error.code === "23P01") {
      return {
        error: "Conflito de agenda: a sala ou o profissional já têm uma consulta nesse horário.",
        saved: false,
      };
    }
    return { error: "Não foi possível guardar a consulta. " + error.message, saved: false };
  }

  const amount = parseAmount(parsed.data.amount);
  if (amount) {
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id")
      .eq("appointment_id", parsed.data.appointment_id)
      .limit(1)
      .maybeSingle();

    if (existingPayment) {
      await supabase.from("payments").update({ amount }).eq("id", existingPayment.id);
    } else {
      await supabase.from("payments").insert({
        appointment_id: parsed.data.appointment_id,
        patient_id: parsed.data.patient_id,
        clinic_id: parsed.data.clinic_id,
        amount,
        status: "pending",
      });
    }
    revalidatePath("/financeiro");
    revalidatePath("/estatisticas");
  }

  revalidatePath("/agenda");
  return { error: null, saved: true };
}

export async function deleteAppointment(appointmentId: string) {
  await requireUser();
  const supabase = await createClient();
  // payments.appointment_id não tem cascade — desligar antes de apagar.
  await supabase
    .from("payments")
    .update({ appointment_id: null })
    .eq("appointment_id", appointmentId);
  await supabase.from("appointments").delete().eq("id", appointmentId);
  revalidatePath("/agenda");
}
