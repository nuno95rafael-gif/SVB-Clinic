import { requireUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DefinicoesPage() {
  const { profile } = await requireUser();
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Definições</h1>
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
      <p className="text-[12.5px] text-foreground-faint mt-4">
        Exportação/eliminação de dados de pacientes (RGPD) e logout automático por inatividade —
        planeado para a Fase 3.
      </p>
    </div>
  );
}
