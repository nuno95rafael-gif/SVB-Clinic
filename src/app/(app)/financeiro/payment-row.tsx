"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { updatePayment, deletePayment } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  paid: "Pago",
  pending: "Pendente",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

interface PaymentRowData {
  id: string;
  amount: number | string;
  status: string;
  method: string | null;
  paid_at: string | null;
  created_at: string;
  description: string | null;
  patients?: { full_name: string } | null;
  clinics?: { name: string } | null;
}

export function PaymentRow({ payment: p }: { payment: PaymentRowData }) {
  const [editing, setEditing] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [state, formAction, pending] = useActionState<
    { error: string | null; saved: boolean },
    FormData
  >(updatePayment, { error: null, saved: false });

  useEffect(() => {
    if (state.saved) setEditing(false);
  }, [state.saved]);

  function handleDelete() {
    if (!confirm("Apagar este pagamento? Esta ação não pode ser desfeita.")) return;
    startDelete(() => deletePayment(p.id));
  }

  const name = p.patients?.full_name ?? p.clinics?.name ?? "—";
  const isClinicPayment = !p.patients && !!p.clinics;

  if (editing) {
    return (
      <li className="px-5 py-3">
        <form action={formAction} className="space-y-2.5">
          <input type="hidden" name="payment_id" value={p.id} />
          <p className="text-sm font-medium">{name}</p>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <Label htmlFor={`amount-${p.id}`}>Valor (€)</Label>
              <Input
                id={`amount-${p.id}`}
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={p.amount}
                required
              />
            </div>
            <div>
              <Label htmlFor={`status-${p.id}`}>Estado</Label>
              <Select id={`status-${p.id}`} name="status" defaultValue={p.status}>
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
                <option value="cancelled">Cancelado</option>
                <option value="refunded">Reembolsado</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <Label htmlFor={`method-${p.id}`}>Método</Label>
              <Select id={`method-${p.id}`} name="method" defaultValue={p.method ?? ""}>
                <option value="">—</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="multibanco">Multibanco</option>
                <option value="cartao">Cartão</option>
                <option value="transferencia">Transferência</option>
                <option value="outro">Outro</option>
              </Select>
            </div>
            <div>
              <Label htmlFor={`paid_at-${p.id}`}>Data</Label>
              <Input
                id={`paid_at-${p.id}`}
                name="paid_at"
                type="date"
                defaultValue={p.paid_at ? p.paid_at.slice(0, 10) : ""}
              />
            </div>
          </div>

          {isClinicPayment && (
            <div>
              <Label htmlFor={`description-${p.id}`}>Descrição</Label>
              <Input id={`description-${p.id}`} name="description" defaultValue={p.description ?? ""} />
            </div>
          )}

          {state.error && <p className="text-[12.5px] text-rose">{state.error}</p>}

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "A guardar…" : "Guardar"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between px-5 py-3">
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-[12.5px] text-foreground-faint">{formatDate(p.created_at)}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{formatCurrency(Number(p.amount))}</span>
        <Badge tone={p.status === "paid" ? "accent" : "amber"}>
          {STATUS_LABELS[p.status] ?? p.status}
        </Badge>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-foreground-faint hover:text-foreground"
          aria-label="Editar"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={handleDelete}
          className="text-foreground-faint hover:text-rose disabled:opacity-50"
          aria-label="Apagar"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}
