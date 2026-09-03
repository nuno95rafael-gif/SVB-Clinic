import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { getActiveClinicId } from "@/lib/clinic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NovoEspacoForm } from "./form";
import { ToggleRoomButton } from "./toggle-button";
import type { Room } from "@/types/database";

export default async function EspacosPage() {
  await requireAdmin();
  const supabase = await createClient();
  const activeClinicId = await getActiveClinicId();
  let roomsQuery = supabase.from("rooms").select("*").order("name");
  if (activeClinicId) roomsQuery = roomsQuery.eq("clinic_id", activeClinicId);
  const { data: rooms } = await roomsQuery;

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-1">Espaços</h1>
      <p className="text-sm text-foreground-soft mb-6">
        Salas e espaços da clínica usados na agenda.
      </p>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardContent className="p-0">
            {!rooms || rooms.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-foreground-faint">
                Ainda não existem espaços. Crie o primeiro no formulário ao lado.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {(rooms as Room[]).map((r) => (
                  <li key={r.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium">{r.name}</p>
                      {r.description && (
                        <p className="text-[12.5px] text-foreground-faint">{r.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={r.active ? "accent" : "neutral"}>
                        {r.active ? "Ativo" : "Inativo"}
                      </Badge>
                      <ToggleRoomButton roomId={r.id} active={r.active} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <NovoEspacoForm />
      </div>
    </div>
  );
}
