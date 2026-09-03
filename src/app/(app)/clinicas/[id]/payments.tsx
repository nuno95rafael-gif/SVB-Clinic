"use client";

import { useActionState, useTransition } from "react";
import { Trash2, Plus } from "lucide-react";
import { addClinicPayment, removeClinicPayment } from "../actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Payment } from "@/types/database";

const METHOD_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  multibanco: "Multibanco",
  cartao: "Cartão",
  transferencia: "Transferência",
  outro: "Outro",
};

const STATUS_TONE: Record<string, "accent" | "amber" | "rose" | "neutral"> = {
  paid: "accent",
  pending: "amber",
  cancelled: "neutral",
  refunded: "rose",
};

const STATUS_LABELS: Record<string, string> = {
  paid: "Pago",
  pending: "Pendente",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

export function ClinicPayments({ clinicId, payments }: { clinicId: string; payments: Payment[] }) {
  const [state, formAction, pending] = useActionState<{ error: string | null }, FormData>(
    addClinicPayment,
    { error: null }
  );
  const [removing, startRemove] = useTransition();

  // amount é numeric(10,2) — o PostgREST devolve-o como string.
  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + Number(p.amount), 0);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Pagamentos</CardTitle>
        <span className="text-[12.5px] text-foreground-faint">
          Total recebido: <span className="font-medium text-foreground">{formatCurrency(totalPaid)}</span>
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        {payments.length === 0 ? (
          <p className="text-[13px] text-foreground-faint">Ainda sem pagamentos registados.</p>
        ) : (
          <ul className="divide-y divide-line rounded-md border border-line">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-sm font-medium">
                    {p.description || "Pagamento"}
                    {p.method && (
                      <span className="text-foreground-faint font-normal"> · {METHOD_LABELS[p.method]}</span>
                    )}
                  </p>
                  <p className="text-[12px] text-foreground-faint">
                    {p.paid_at ? formatDate(p.paid_at) : formatDate(p.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{formatCurrency(p.amount)}</span>
                  <Badge tone={STATUS_TONE[p.status]}>{STATUS_LABELS[p.status]}</Badge>
                  <button
                    type="button"
                    disabled={removing}
                    onClick={() => startRemove(() => removeClinicPayment(p.id, clinicId))}
                    className="text-foreground-faint hover:text-rose"
                    aria-label="Remover"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form action={formAction} className="grid grid-cols-2 gap-3 border-t border-line pt-4">
          <input type="hidden" name="clinic_id" value={clinicId} />
          <div>
            <Label htmlFor="amount">Valor (€)</Label>
            <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
          </div>
          <div>
            <Label htmlFor="status">Estado</Label>
            <Select id="status" name="status" defaultValue="paid">
              <option value="paid">Pago</option>
              <option value="pending">Pendente</option>
              <option value="cancelled">Cancelado</option>
              <option value="refunded">Reembolsado</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="method">Método</Label>
            <Select id="method" name="method" defaultValue="">
              <option value="">—</option>
              {Object.entries(METHOD_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="paid_at">Data</Label>
            <Input id="paid_at" name="paid_at" type="date" />
          </div>
          <div className="col-span-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" name="description" rows={2} placeholder="Ex.: Mensalidade de setembro" />
          </div>

          {state.error && (
            <p className="col-span-2 rounded-md bg-rose-soft px-3 py-2 text-[12.5px] text-rose">
              {state.error}
            </p>
          )}

          <div className="col-span-2 flex justify-end">
            <Button type="submit" variant="secondary" size="sm" disabled={pending}>
              <Plus size={14} /> Registar pagamento
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
