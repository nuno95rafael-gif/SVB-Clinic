"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { ACTIVE_CLINIC_COOKIE } from "@/lib/clinic";

export async function setActiveClinic(clinicId: string) {
  await requireUser();
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_CLINIC_COOKIE, clinicId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
