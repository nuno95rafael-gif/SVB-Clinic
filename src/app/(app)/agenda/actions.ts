"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

const schema = z.object({
  patient_id: z.string().uuid("Selecione um paciente."),
  professional_id: z.string().uuid("Selecione um profissional."),
  room_id: z.string().uuid("Selecione um espaço."),
  date: z.string().min(1, "Selecione a data."),
  time: z.string().min(1, "Selecione a hora."),
  duration_min: z.coerce.number().int().min(5).max(480),
  type: z.string().min(1),
  notes: z.string().optional(),
});

export async function createAppointment(
  _prevState: { error: string | null; ok: boolean },
  formData: FormData
) {
  const { profile } = await requireUser();

  const parsed = schema.safeParse({
    patient_id: formData.get("patient_id"),
    professional_id: formData.get("professional_id"),
    room_id: formData.get("room_id"),
    date: formData.get("date"),
    time: formData.get("time"),
    duration_min: formData.get("duration_min"),
    type: formData.get("type"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", ok: false };
  }

  const supabase = await createClient();
  const { data: clinic } = await supabase.from("clinics").select("id").limit(1).single();
  const starts_at = new Date(`${parsed.data.date}T${parsed.data.time}:00`).toISOString();

  const { error } = await supabase.from("appointments").insert({
    clinic_id: clinic?.id,
    patient_id: parsed.data.patient_id,
    professional_id: parsed.data.professional_id,
    room_id: parsed.data.room_id,
    starts_at,
    duration_min: parsed.data.duration_min,
    type: parsed.data.type,
    notes: parsed.data.notes || null,
    created_by: profile.id,
  });

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

  revalidatePath("/agenda");
  return { error: null, ok: true };
}

export async function updateAppointmentStatus(appointmentId: string, status: string) {
  await requireUser();
  const supabase = await createClient();
  await supabase.from("appointments").update({ status }).eq("id", appointmentId);
  revalidatePath("/agenda");
}
