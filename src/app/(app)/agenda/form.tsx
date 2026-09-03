"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { createAppointment } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientCombobox } from "./patient-combobox";
import { toStartsAtISO } from "./date-utils";

export function NovaConsultaForm({
  date,
  patients,
  rooms,
  clinics,
  professionals,
  isAdmin,
  ownProfessionalId,
}: {
  date: string;
  patients: { id: string; full_name: string; clinic_id: string }[];
  rooms: { id: string; name: string; clinic_id: string }[];
  clinics: { id: string; name: string; color_hex: string }[];
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
  const dateRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const startsAtRef = useRef<HTMLInputElement>(null);
  // A clínica não se escolhe à parte — vem do paciente selecionado (cada
  // paciente pertence a uma única clínica).
  const [clinicId, setClinicId] = useState("");

  const clinicRooms = useMemo(() => rooms.filter((r) => r.clinic_id === clinicId), [rooms, clinicId]);
  const clinicName = clinics.find((c) => c.id === clinicId)?.name;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova consulta</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={formAction}
          onSubmit={() => {
            if (startsAtRef.current && dateRef.current && timeRef.current) {
              startsAtRef.current.value = toStartsAtISO(dateRef.current.value, timeRef.current.value);
            }
          }}
          className="space-y-3"
        >
          <input type="hidden" name="starts_at" ref={startsAtRef} />
          <input type="hidden" name="clinic_id" value={clinicId} />

          <div>
            <Label htmlFor="date">Data</Label>
            <Input id="date" ref={dateRef} type="date" defaultValue={date} required />
          </div>

          <PatientCombobox
            patients={patients}
            name="patient_id"
            onSelect={(p) => setClinicId(p?.clinic_id ?? "")}
            allowCreate
            clinics={clinics}
          />
          {clinicName && (
            <p className="text-[12.5px] text-foreground-faint -mt-1.5">Clínica: {clinicName}</p>
          )}

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
            <Select key={clinicId} id="room_id" name="room_id" required defaultValue="">
              <option value="" disabled>
                {clinicId ? "Selecionar…" : "Escolha primeiro um paciente"}
              </option>
              {clinicRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="time">Hora</Label>
              <Input id="time" ref={timeRef} type="time" required />
            </div>
            <div>
              <Label htmlFor="duration_min">Duração (min)</Label>
              <Input id="duration_min" name="duration_min" type="number" defaultValue={45} min={5} step={5} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select id="type" name="type" defaultValue="consulta">
                <option value="consulta">Consulta</option>
                <option value="avaliacao">Avaliação inicial</option>
                <option value="reavaliacao">Reavaliação</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Valor (€)</Label>
              <Input id="amount" name="amount" type="number" min={0} step={0.01} placeholder="Opcional" />
            </div>
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
