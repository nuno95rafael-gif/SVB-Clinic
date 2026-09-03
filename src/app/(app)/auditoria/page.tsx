import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

const ENTITY_LABELS: Record<string, string> = {
  patients: "Paciente",
  clinical_records: "História clínica",
  appointments: "Consulta agendada",
  consultations: "Consulta",
  payments: "Pagamento",
};

const ACTION_TONE: Record<string, "accent" | "amber" | "rose" | "neutral"> = {
  INSERT: "accent",
  UPDATE: "amber",
  DELETE: "rose",
};

const ACTION_LABELS: Record<string, string> = {
  INSERT: "Criado",
  UPDATE: "Alterado",
  DELETE: "Eliminado",
};

interface AuditLog {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  diff: Record<string, unknown> | null;
  occurred_at: string;
  users?: { full_name: string } | null;
}

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string }>;
}) {
  await requireAdmin();
  const { entity } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("audit_logs")
    .select("*, users(full_name)")
    .order("occurred_at", { ascending: false })
    .limit(100);

  if (entity) query = query.eq("entity_type", entity);

  const { data: logs } = await query;

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-1">Auditoria</h1>
      <p className="text-sm text-foreground-soft mb-6">
        Registo automático de alterações a dados clínicos — últimas 100 entradas.
      </p>

      <div className="flex flex-wrap gap-1.5 mb-5">
        <FilterLink entity={undefined} active={!entity} label="Todas" />
        {Object.entries(ENTITY_LABELS).map(([value, label]) => (
          <FilterLink key={value} entity={value} active={entity === value} label={label} />
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {!logs || logs.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-foreground-faint">
              Sem registos de auditoria para este filtro.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {(logs as unknown as AuditLog[]).map((log) => (
                <li key={log.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{log.users?.full_name ?? "Sistema"}</span>{" "}
                        <span className="text-foreground-faint">
                          {ACTION_LABELS[log.action]?.toLowerCase() ?? log.action.toLowerCase()}
                        </span>{" "}
                        {ENTITY_LABELS[log.entity_type] ?? log.entity_type}
                      </p>
                      <p className="text-[12px] text-foreground-faint mt-0.5">
                        {formatDateTime(log.occurred_at)}
                      </p>
                    </div>
                    <Badge tone={ACTION_TONE[log.action] ?? "neutral"}>
                      {ACTION_LABELS[log.action] ?? log.action}
                    </Badge>
                  </div>
                  {log.diff && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[12px] text-accent-ink">
                        Ver detalhes
                      </summary>
                      <pre className="mt-2 overflow-x-auto rounded-md bg-background px-3 py-2 text-[11px] leading-relaxed text-foreground-soft">
                        {JSON.stringify(log.diff, null, 2)}
                      </pre>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FilterLink({
  entity,
  active,
  label,
}: {
  entity: string | undefined;
  active: boolean;
  label: string;
}) {
  return (
    <Link href={entity ? `/auditoria?entity=${entity}` : "/auditoria"}>
      <Button variant={active ? "primary" : "secondary"} size="sm">
        {label}
      </Button>
    </Link>
  );
}
