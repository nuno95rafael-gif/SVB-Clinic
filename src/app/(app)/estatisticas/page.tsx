import { requireUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";

export default async function EstatisticasPage() {
  await requireUser();
  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6">Estatísticas</h1>
      <Card>
        <CardContent className="py-10 text-center text-sm text-foreground-faint">
          Analytics avançado (retenção, receita por profissional/espaço, gráficos por período) —
          planeado para a Fase 3, depois de existirem dados suficientes de consultas e pagamentos.
        </CardContent>
      </Card>
    </div>
  );
}
