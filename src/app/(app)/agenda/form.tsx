"use client";

import { useActionState } from "react";
import { createAppointment } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NovaConsultaForm({
  date,
  patients,
  rooms,
  professionals,
  isAdmin,
  ownProfessionalId,
}: {
  date: string;
  patients: { id: string; full_name: string }[];
  rooms: { id: string; name: string }[];
  professionals: { id: string; users: { full_name: string } }[];
  isAdmin: boolean;
  ownProfessionalId: string | null;
}) {
  const [state, formAction, pending] = useActionState<
    { error: string | null; ok: boolean },
    FormData
  >(createAppointment, {
    error: null,
    ok: false,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova consulta</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="date" value={date} />

          <div>
            <Label htmlFor="patient_id">Paciente</Label>
            <Select id="patient_id" name="patient_id" required defaultValue="">
              <option value="" disabled>
                Selecionar…
              </option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="professional_id">Profissional</Label>
            {isAdmin ? (
              <Select id="professional_id" name="professional_id" required defaultValue="">
                <option value="" disabled>
                  Selecionar…
                </option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.users?.full_name}
                  </option>
                ))}
              </Select>
            ) : (
              <input type="hidden" name="professional_id" value={ownProfessionalId ?? ""} />
            )}
            {!isAdmin && (
              <p className="text-[12.5px] text-foreground-faint mt-1">
                Atribuída automaticamente a si.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="room_id">Espaço</Label>
            <Select id="room_id" name="room_id" required defaultValue="">
              <option value="" disabled>
                Selecionar…
              </option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="time">Hora</Label>
              <Input id="time" name="time" type="time" required />
            </div>
            <div>
              <Label htmlFor="duration_min">Duração (min)</Label>
              <Input id="duration_min" name="duration_min" type="number" defaultValue={45} min={5} step={5} required />
            </div>
          </div>

          <div>
            <Label htmlFor="type">Tipo</Label>
            <Select id="type" name="type" defaultValue="consulta">
              <option value="consulta">Consulta</option>
              <option value="avaliacao">Avaliação inicial</option>
              <option value="reavaliacao">Reavaliação</option>
            </Select>
          </div>

          {state.error && (
            <p className="rounded-md bg-rose-soft px-3 py-2 text-[12.5px] text-rose">
              {state.error}
            </p>
          )}
          {state.ok && (
            <p className="rounded-md bg-accent-soft px-3 py-2 text-[12.5px] text-accent-ink">
              Consulta agendada.
            </p>
          )}

          <Button type="submit" className="w-full" size="sm" disabled={pending}>
            {pending ? "A agendar…" : "Agendar consulta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
