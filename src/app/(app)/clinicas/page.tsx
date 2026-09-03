import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { NovaClinicaForm } from "./form";
import { ClinicRow } from "./clinic-row";
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
                  <ClinicRow key={c.id} clinic={c} />
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
