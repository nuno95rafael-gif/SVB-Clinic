import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getActiveClinicId } from "@/lib/clinic";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { PatientRow } from "./patient-row";
import type { Patient } from "@/types/database";

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const { profile } = await requireUser(); // garante sessão — o âmbito por profissional é aplicado pela RLS
  const supabase = await createClient();
  const activeClinicId = await getActiveClinicId();

  let query = supabase
    .from("patients")
    .select("*, professionals(id, color_hex, users(full_name))")
    .order("full_name", { ascending: true });

  if (activeClinicId) query = query.eq("clinic_id", activeClinicId);
  if (q) query = query.ilike("full_name", `%${q}%`);
  if (status) query = query.eq("status", status);

  const [{ data: patients, error }, { data: professionals }] = await Promise.all([
    query,
    profile.role === "admin"
      ? supabase.from("professionals").select("id, users(full_name)").eq("active", true)
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Pacientes</h1>
          <p className="text-sm text-foreground-soft mt-1">
            {patients?.length ?? 0} paciente{patients?.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/pacientes/novo">
          <Button>
            <Plus size={16} /> Novo paciente
          </Button>
        </Link>
      </div>

      <form className="flex items-center gap-3 mb-5" method="get">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-faint" />
          <Input name="q" placeholder="Pesquisar por nome…" defaultValue={q} className="pl-9" />
        </div>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-10 rounded-md border border-line bg-surface px-3 text-sm"
        >
          <option value="">Todos os estados</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </select>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      <Card className="overflow-hidden">
        {error ? (
          <p className="px-5 py-8 text-center text-sm text-rose">
            Não foi possível carregar os pacientes. {error.message}
          </p>
        ) : !patients || patients.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-sm text-foreground-soft">
              {q || status ? "Nenhum paciente corresponde à pesquisa." : "Ainda não há pacientes registados."}
            </p>
            {!q && !status && (
              <Link href="/pacientes/novo" className="text-accent-ink text-sm underline mt-2 inline-block">
                Registar o primeiro paciente
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-foreground-faint">
                <th className="px-5 py-3 font-medium">Paciente</th>
                <th className="px-5 py-3 font-medium">Contacto</th>
                <th className="px-5 py-3 font-medium">Profissional</th>
                <th className="px-5 py-3 font-medium">Registo</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {(patients as unknown as Patient[]).map((p) => (
                <PatientRow
                  key={p.id}
                  patient={p}
                  professionals={
                    (professionals as unknown as { id: string; users: { full_name: string } }[]) ?? []
                  }
                  isAdmin={profile.role === "admin"}
                />
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
