import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteUserForm } from "./invite-user-form";
import { UserRow } from "./user-row";
import type { UserProfile } from "@/types/database";

export default async function DefinicoesPage() {
  const { profile } = await requireUser();
  const isAdmin = profile.role === "admin";

  const supabase = await createClient();
  const { data: users } = isAdmin
    ? await supabase.from("users").select("*").order("full_name")
    : { data: null };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6">Definições</h1>

      <div className={isAdmin ? "grid grid-cols-3 gap-6" : "max-w-2xl"}>
        <div className={isAdmin ? "col-span-2 space-y-6" : "space-y-6"}>
          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-foreground-faint">Nome: </span>
                {profile.full_name}
              </p>
              <p>
                <span className="text-foreground-faint">Email: </span>
                {profile.email}
              </p>
              <p>
                <span className="text-foreground-faint">Papel: </span>
                {profile.role === "admin" ? "Administrador" : "Profissional"}
              </p>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Utilizadores</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {!users || users.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-foreground-faint">
                    Ainda não há utilizadores.
                  </p>
                ) : (
                  <ul className="divide-y divide-line">
                    {(users as UserProfile[]).map((u) => (
                      <UserRow key={u.id} user={u} isSelf={u.id === profile.id} />
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          <p className="text-[12.5px] text-foreground-faint">
            Exportação/eliminação de dados de pacientes (RGPD) e logout automático por
            inatividade — planeado.
          </p>
        </div>

        {isAdmin && <InviteUserForm />}
      </div>
    </div>
  );
}
