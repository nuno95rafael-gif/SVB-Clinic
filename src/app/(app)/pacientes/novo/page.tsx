import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getActiveClinicId } from "@/lib/clinic";
import { NovoPacienteForm } from "./form";

export default async function NovoPacientePage() {
  const { profile } = await requireUser();
  const supabase = await createClient();
  const activeClinicId = await getActiveClinicId();

  const [{ data: professionals }, { data: clinics }] = await Promise.all([
    profile.role === "admin"
      ? supabase.from("professionals").select("id, users(full_name)").eq("active", true)
      : Promise.resolve({ data: null }),
    supabase.from("clinics").select("id, name, active").order("active", { ascending: false }).order("name"),
  ]);

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-1">Novo paciente</h1>
      <p className="text-sm text-foreground-soft mb-6">
        Registo mínimo — a história clínica completa é preenchida na primeira consulta.
      </p>
      <NovoPacienteForm
        professionals={
          (professionals as unknown as { id: string; users: { full_name: string } }[]) ?? []
        }
        showProfessionalSelect={profile.role === "admin"}
        clinics={clinics ?? []}
        defaultClinicId={activeClinicId}
      />
    </div>
  );
}
