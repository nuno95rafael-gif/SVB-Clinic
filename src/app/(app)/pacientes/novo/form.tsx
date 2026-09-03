"use client";

import { useActionState } from "react";
import { createPatient } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export function NovoPacienteForm({
  professionals,
  showProfessionalSelect,
}: {
  professionals: { id: string; users: { full_name: string } }[];
  showProfessionalSelect: boolean;
}) {
  const [state, formAction, pending] = useActionState<{ error: string | null }, FormData>(
    createPatient,
    { error: null }
  );

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Nome completo *</Label>
            <Input id="full_name" name="full_name" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="birth_date">Data de nascimento</Label>
              <Input id="birth_date" name="birth_date" type="date" />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" name="phone" type="tel" />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" />
          </div>

          {showProfessionalSelect && (
            <div>
              <Label htmlFor="professional_id">Profissional responsável</Label>
              <Select id="professional_id" name="professional_id" defaultValue="">
                <option value="">Por atribuir</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.users?.full_name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notas iniciais</Label>
            <Textarea id="notes" name="notes" rows={3} />
          </div>

          {state.error && (
            <p className="rounded-md bg-rose-soft px-3 py-2 text-[13px] text-rose">{state.error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="submit" disabled={pending}>
              {pending ? "A guardar…" : "Guardar paciente"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
