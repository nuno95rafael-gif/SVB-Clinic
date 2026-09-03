"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { getActiveClinicId } from "@/lib/clinic";

const schema = z.object({
  email: z.string().email("Email inválido."),
  full_name: z.string().min(2, "Indique o nome."),
  role: z.enum(["admin", "professional"]),
});

export async function inviteUser(_prevState: { error: string | null; ok: boolean }, formData: FormData) {
  await requireAdmin();

  const parsed = schema.safeParse({
    email: formData.get("email"),
    full_name: formData.get("full_name"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", ok: false };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    data: { full_name: parsed.data.full_name, role: parsed.data.role },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/atualizar-password`,
  });

  if (error || !data.user) {
    return { error: "Não foi possível convidar. " + (error?.message ?? ""), ok: false };
  }

  if (parsed.data.role === "professional") {
    const clinicId = await getActiveClinicId();
    // upsert porque o trigger on_auth_user_created já criou o perfil em public.users
    await admin.from("professionals").insert({
      user_id: data.user.id,
      clinic_id: clinicId,
    });
  }

  revalidatePath("/definicoes");
  return { error: null, ok: true };
}

export async function toggleUserActive(userId: string, active: boolean) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("users").update({ active }).eq("id", userId);
  revalidatePath("/definicoes");
}

const updateSchema = z.object({
  user_id: z.string().uuid(),
  full_name: z.string().min(2, "Indique o nome."),
  role: z.enum(["admin", "professional"]),
});

export async function updateUser(
  _prevState: { error: string | null; saved: boolean },
  formData: FormData
) {
  await requireAdmin();

  const parsed = updateSchema.safeParse({
    user_id: formData.get("user_id"),
    full_name: formData.get("full_name"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", saved: false };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("users")
    .update({ full_name: parsed.data.full_name, role: parsed.data.role })
    .eq("id", parsed.data.user_id);

  if (error) return { error: "Não foi possível guardar. " + error.message, saved: false };

  revalidatePath("/definicoes");
  return { error: null, saved: true };
}
