import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NovaClinicaForm } from "./form";
import { ToggleClinicButton } from "./toggle-button";
import type { Clinic } from "@/types/database";

export default async function ClinicasPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: clinics } = await supabase.from("clinics").select("*").order("name");

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-1">Clínicas</h1>
      <p className="text-sm text-foreground-soft mb-6">
        Locais onde presta serviço. Troque entre elas no seletor da barra lateral.
      </p>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardContent className="p-0">
            {!clinics || clinics.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-foreground-faint">
                Ainda não existem clínicas. Crie a primeira no formulário ao lado.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {(clinics as Clinic[]).map((c) => (
                  <li key={c.id} className="flex items-center justify-between px-5 py-3">
                    <Link href={`/clinicas/${c.id}`} className="min-w-0">
                      <p className="text-sm font-medium hover:text-accent-ink">{c.name}</p>
                      {c.nif && <p className="text-[12.5px] text-foreground-faint">NIF {c.nif}</p>}
                    </Link>
                    <div className="flex items-center gap-3">
                      <Badge tone={c.active ? "accent" : "neutral"}>
                        {c.active ? "Ativa" : "Inativa"}
                      </Badge>
                      <ToggleClinicButton clinicId={c.id} active={c.active} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <NovaClinicaForm />
      </div>
    </div>
  );
}
