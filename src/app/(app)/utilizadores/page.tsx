import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InviteUserForm } from "./form";
import { ToggleUserButton } from "./toggle-button";
import { initials } from "@/lib/utils";
import type { UserProfile } from "@/types/database";

export default async function UtilizadoresPage() {
  const { profile: me } = await requireAdmin();
  const supabase = await createClient();
  const { data: users } = await supabase.from("users").select("*").order("full_name");

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-1">Utilizadores</h1>
      <p className="text-sm text-foreground-soft mb-6">
        Contas com acesso à plataforma — administradores e profissionais.
      </p>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardContent className="p-0">
            {!users || users.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-foreground-faint">
                Ainda não há utilizadores.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {(users as UserProfile[]).map((u) => (
                  <li key={u.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent-ink">
                        {initials(u.full_name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.full_name}</p>
                        <p className="text-[12.5px] text-foreground-faint">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Badge tone={u.role === "admin" ? "amber" : "accent"}>
                        {u.role === "admin" ? "Administrador" : "Profissional"}
                      </Badge>
                      <Badge tone={u.active ? "accent" : "neutral"}>
                        {u.active ? "Ativo" : "Inativo"}
                      </Badge>
                      {u.id !== me.id && <ToggleUserButton userId={u.id} active={u.active} />}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <InviteUserForm />
      </div>
    </div>
  );
}
