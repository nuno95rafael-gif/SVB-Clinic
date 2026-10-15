"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { getActiveClinicIdOrFirst } from "@/lib/clinic";

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
    const clinicId = await getActiveClinicIdOrFirst();
    // upsert porque o trigger on_auth_user_created já criou o perfil em public.users
    await admin.from("professionals").insert({
      user_id: data.user.id,
      clinic_id: clinicId,
    });
  }

  revalidatePath("/definicoes");
  return { error: null, ok: true };
}

const createSchema = z.object({
  email: z.string().email("Email inválido."),
  full_name: z.string().min(2, "Indique o nome."),
  role: z.enum(["admin", "professional"]),
  password: z.string().min(6, "A palavra-passe deve ter pelo menos 6 caracteres."),
});

export async function createUserManually(
  _prevState: { error: string | null; ok: boolean },
  formData: FormData
) {
  await requireAdmin();

  const parsed = createSchema.safeParse({
    email: formData.get("email"),
    full_name: formData.get("full_name"),
    role: formData.get("role"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", ok: false };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.full_name, role: parsed.data.role },
  });

  if (error || !data.user) {
    return { error: "Não foi possível criar o utilizador. " + (error?.message ?? ""), ok: false };
  }

  if (parsed.data.role === "professional") {
    const clinicId = await getActiveClinicIdOrFirst();
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

  if (parsed.data.role === "professional") {
    // cobre o caso de um utilizador ter sido convidado antes de existir esta
    // lógica, ou de ter passado de admin a profissional — sem isto ficava
    // sem entrada em professionals e não aparecia nas opções da agenda.
    const clinicId = await getActiveClinicIdOrFirst();
    await admin
      .from("professionals")
      .upsert({ user_id: parsed.data.user_id, clinic_id: clinicId }, { onConflict: "user_id", ignoreDuplicates: true });
  }

  revalidatePath("/definicoes");
  return { error: null, saved: true };
}

export async function deleteUser(userId: string): Promise<{ error: string | null }> {
  const { profile } = await requireAdmin();
  if (userId === profile.id) {
    return { error: "Não pode apagar a sua própria conta." };
  }

  const admin = createAdminClient();

  // Um profissional com consultas ou pacientes não pode desaparecer sem mais
  // (apagar o login arrastaria o profissional por cascade).
  const { data: prof } = await admin
    .from("professionals")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (prof) {
    const [appointments, patients] = await Promise.all([
      admin.from("appointments").select("id", { count: "exact", head: true }).eq("professional_id", prof.id),
      admin.from("patients").select("id", { count: "exact", head: true }).eq("professional_id", prof.id),
    ]);
    const blockers: string[] = [];
    if ((appointments.count ?? 0) > 0) blockers.push("consultas");
    if ((patients.count ?? 0) > 0) blockers.push("pacientes");
    if (blockers.length > 0) {
      return {
        error: `Não é possível apagar: este profissional tem ${blockers.join(" e ")} associados. Transfira-os primeiro, ou desative o utilizador em vez de apagar.`,
      };
    }
  }

  // Referências só de autoria (quem criou/editou) — ficam sem autor em vez de bloquear.
  await Promise.all([
    admin.from("patients").update({ created_by: null }).eq("created_by", userId),
    admin.from("appointments").update({ created_by: null }).eq("created_by", userId),
    admin.from("clinical_records").update({ updated_by: null }).eq("updated_by", userId),
    admin.from("documents").update({ uploaded_by: null }).eq("uploaded_by", userId),
  ]);

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: "Não foi possível apagar o utilizador. " + error.message };

  revalidatePath("/definicoes");
  revalidatePath("/agenda");
  return { error: null };
}
