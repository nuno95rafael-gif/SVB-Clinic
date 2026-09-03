"use client";

import { useActionState } from "react";
import { addPayment } from "./actions";
import { PatientCombobox } from "../agenda/patient-combobox";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PaymentForm({
  patients,
  initialPatient,
  initialAppointmentId,
}: {
  patients: { id: string; full_name: string }[];
  initialPatient?: { id: string; full_name: string };
  initialAppointmentId?: string;
}) {
  const [state, formAction, pending] = useActionState<{ error: string | null }, FormData>(
    addPayment,
    { error: null }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo pagamento</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          {initialAppointmentId && (
            <input type="hidden" name="appointment_id" value={initialAppointmentId} />
          )}

          <PatientCombobox patients={patients} name="patient_id" initialPatient={initialPatient} />

          <div className="grid grid-cols-2 gap-3">
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="method">Método</Label>
              <Select id="method" name="method" defaultValue="">
                <option value="">—</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="multibanco">Multibanco</option>
                <option value="cartao">Cartão</option>
                <option value="transferencia">Transferência</option>
                <option value="outro">Outro</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="paid_at">Data</Label>
              <Input id="paid_at" name="paid_at" type="date" />
            </div>
          </div>

          {state.error && (
            <p className="rounded-md bg-rose-soft px-3 py-2 text-[12.5px] text-rose">
              {state.error}
            </p>
          )}

          <Button type="submit" className="w-full" size="sm" disabled={pending}>
            {pending ? "A registar…" : "Registar pagamento"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
