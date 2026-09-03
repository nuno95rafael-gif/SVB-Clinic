import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function FinanceiroPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: payments } = await supabase
    .from("payments")
    .select("*, patients(full_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6">Financeiro</h1>
      <Card>
        <CardContent className="p-0">
          {!payments || payments.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-foreground-faint">
              Ainda não há pagamentos registados. O registo de pagamento por consulta fica
              disponível quando o ecrã de consulta (Fase 2) estiver concluído.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">{p.patients?.full_name}</p>
                    <p className="text-[12.5px] text-foreground-faint">{formatDate(p.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{formatCurrency(p.amount)}</span>
                    <Badge tone={p.status === "paid" ? "accent" : "amber"}>{p.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
