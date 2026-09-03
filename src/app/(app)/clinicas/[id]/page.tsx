import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { EditClinicForm } from "./edit-form";
import { ClinicPayments } from "./payments";
import type { Clinic, Payment } from "@/types/database";

export default async function ClinicaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin();
  const supabase = await createClient();

  const { data: clinic } = await supabase.from("clinics").select("*").eq("id", id).single();
  if (!clinic) notFound();

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("clinic_id", id)
    .order("paid_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-3xl">
      <Link
        href="/clinicas"
        className="inline-flex items-center gap-1.5 text-[13px] text-foreground-faint hover:text-foreground"
      >
        <ArrowLeft size={14} /> Clínicas
      </Link>
      <h1 className="text-2xl font-semibold mt-3 mb-6">{(clinic as Clinic).name}</h1>

      <div className="space-y-6">
        <EditClinicForm clinic={clinic as Clinic} />
        <ClinicPayments clinicId={id} payments={(payments as Payment[]) ?? []} />
      </div>
    </div>
  );
}
