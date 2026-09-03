import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";
import { updateProfessional } from "./actions";
import Link from "next/link";

export default async function ProfissionaisPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: professionals } = await supabase
    .from("professionals")
    .select("*, users(full_name, email, active)")
    .order("created_at");

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Profissionais</h1>
          <p className="text-sm text-foreground-soft mt-1">
            Perfis clínicos ligados a contas de utilizador.
          </p>
        </div>
        <Link href="/utilizadores">
          <Button variant="secondary">Convidar profissional</Button>
        </Link>
      </div>

      {!professionals || professionals.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-foreground-faint">
            Ainda não há profissionais. Convide um em Utilizadores.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {professionals.map((p) => (
            <Card key={p.id}>
              <CardContent>
                <form action={updateProfessional} className="flex items-end gap-4">
                  <input type="hidden" name="id" value={p.id} />
                  <div className="flex items-center gap-3 w-52 shrink-0">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                      style={{ backgroundColor: p.color_hex }}
                    >
                      {initials(p.users?.full_name ?? "?")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.users?.full_name}</p>
                      <Badge tone={p.users?.active ? "accent" : "neutral"}>
                        {p.users?.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`specialty-${p.id}`}>Especialidade</Label>
                    <Input id={`specialty-${p.id}`} name="specialty" defaultValue={p.specialty ?? ""} />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`license-${p.id}`}>Cédula profissional</Label>
                    <Input
                      id={`license-${p.id}`}
                      name="license_number"
                      defaultValue={p.license_number ?? ""}
                    />
                  </div>
                  <div className="w-24">
                    <Label htmlFor={`color-${p.id}`}>Cor (agenda)</Label>
                    <input
                      id={`color-${p.id}`}
                      name="color_hex"
                      type="color"
                      defaultValue={p.color_hex}
                      className="h-10 w-full rounded-md border border-line"
                    />
                  </div>
                  <Button type="submit" size="sm" variant="secondary">
                    Guardar
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
