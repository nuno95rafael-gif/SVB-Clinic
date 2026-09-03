import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";
import { updateProfessional } from "./professionals-actions";

interface ProfessionalRow {
  id: string;
  specialty: string | null;
  license_number: string | null;
  color_hex: string;
  users?: { full_name: string; email: string; active: boolean } | null;
}

export function ProfessionalsSection({ professionals }: { professionals: ProfessionalRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profissionais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {professionals.length === 0 ? (
          <p className="text-[13px] text-foreground-faint">
            Ainda não há profissionais. Convide um utilizador acima com o papel "Profissional" —
            fica aqui automaticamente.
          </p>
        ) : (
          professionals.map((p) => (
            <form
              key={p.id}
              action={updateProfessional}
              className="flex items-end gap-4 rounded-md border border-line p-3"
            >
              <input type="hidden" name="id" value={p.id} />
              <div className="flex w-44 shrink-0 items-center gap-2.5">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                  style={{ backgroundColor: p.color_hex }}
                >
                  {initials(p.users?.full_name ?? "?")}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.users?.full_name}</p>
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
              <div className="w-20 shrink-0">
                <Label htmlFor={`color-${p.id}`}>Cor</Label>
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
          ))
        )}
      </CardContent>
    </Card>
  );
}
