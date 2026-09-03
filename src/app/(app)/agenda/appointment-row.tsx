"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Pencil, Trash2, Stethoscope } from "lucide-react";
import Link from "next/link";
import { updateAppointment, deleteAppointment } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { StatusSelect } from "./status-select";
import { toISODate, toStartsAtISO } from "./date-utils";
import { formatTime } from "@/lib/utils";
import type { Appointment } from "@/types/database";

function toHHMM(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function AppointmentRow({
  appointment: a,
  patients,
  rooms,
  clinics,
  professionals,
  isAdmin,
}: {
  appointment: Appointment;
  patients: { id: string; full_name: string; clinic_id: string }[];
  rooms: { id: string; name: string; clinic_id: string }[];
  clinics: { id: string; name: string; color_hex: string }[];
  professionals: { id: string; users?: { full_name: string } }[];
  isAdmin: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [state, formAction, pending] = useActionState<
    { error: string | null; saved: boolean },
    FormData
  >(updateAppointment, { error: null, saved: false });

  useEffect(() => {
    if (state.saved) setEditing(false);
  }, [state.saved]);

  const startsAt = new Date(a.starts_at);
  const dateRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const startsAtRef = useRef<HTMLInputElement>(null);
  const [clinicId, setClinicId] = useState(a.clinic_id);
  // numeric(10,2) vem do Postgres como string via PostgREST.
  const currentAmount = a.payments?.[0]?.amount != null ? Number(a.payments[0].amount) : undefined;

  const clinicPatients = useMemo(
    () => patients.filter((p) => p.clinic_id === clinicId),
    [patients, clinicId]
  );
  const clinicRooms = useMemo(() => rooms.filter((r) => r.clinic_id === clinicId), [rooms, clinicId]);

  if (editing) {
    return (
      <li className="px-5 py-3.5">
        <form
          action={formAction}
          onSubmit={() => {
            if (startsAtRef.current && dateRef.current && timeRef.current) {
              startsAtRef.current.value = toStartsAtISO(dateRef.current.value, timeRef.current.value);
            }
          }}
          className="space-y-2.5"
        >
          <input type="hidden" name="appointment_id" value={a.id} />
          <input type="hidden" name="starts_at" ref={startsAtRef} />

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <Label htmlFor={`clinic-${a.id}`}>Clínica</Label>
              <Select
                id={`clinic-${a.id}`}
                name="clinic_id"
                value={clinicId}
                onChange={(e) => setClinicId(e.target.value)}
                required
              >
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor={`patient-${a.id}`}>Paciente</Label>
              <Select
                key={clinicId}
                id={`patient-${a.id}`}
                name="patient_id"
                defaultValue={a.patient_id}
                required
              >
                {clinicPatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <Label htmlFor={`prof-${a.id}`}>Profissional</Label>
              <Select
                id={`prof-${a.id}`}
                name="professional_id"
                defaultValue={a.professional_id}
                disabled={!isAdmin}
                required
              >
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.users?.full_name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor={`room-${a.id}`}>Espaço</Label>
              <Select key={clinicId} id={`room-${a.id}`} name="room_id" defaultValue={a.room_id} required>
                {clinicRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <Label htmlFor={`date-${a.id}`}>Data</Label>
              <Input
                id={`date-${a.id}`}
                ref={dateRef}
                type="date"
                defaultValue={toISODate(startsAt)}
                required
              />
            </div>
            <div>
              <Label htmlFor={`time-${a.id}`}>Hora</Label>
              <Input
                id={`time-${a.id}`}
                ref={timeRef}
                type="time"
                defaultValue={toHHMM(startsAt)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <Label htmlFor={`duration-${a.id}`}>Duração (min)</Label>
              <Input
                id={`duration-${a.id}`}
                name="duration_min"
                type="number"
                defaultValue={a.duration_min}
                min={5}
                step={5}
                required
              />
            </div>
            <div>
              <Label htmlFor={`amount-${a.id}`}>Valor (€)</Label>
              <Input
                id={`amount-${a.id}`}
                name="amount"
                type="number"
                min={0}
                step={0.01}
                defaultValue={currentAmount ?? ""}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div>
            <Label htmlFor={`type-${a.id}`}>Tipo</Label>
            <Select id={`type-${a.id}`} name="type" defaultValue={a.type}>
              <option value="consulta">Consulta</option>
              <option value="avaliacao">Avaliação inicial</option>
              <option value="reavaliacao">Reavaliação</option>
            </Select>
          </div>

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
    <li className="flex items-center gap-4 px-5 py-3.5">
      <div
        className="w-1 self-stretch rounded-full"
        style={{ backgroundColor: a.clinics?.color_hex ?? "#0d7a68" }}
      />
      <div className="w-16 shrink-0 text-sm font-medium tabular-nums">
        {formatTime(a.starts_at)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{a.patients?.full_name}</p>
        <p className="text-[12.5px] text-foreground-faint truncate">
          {a.clinics?.name} · {a.rooms?.name} · {a.duration_min} min
          {currentAmount ? ` · ${currentAmount.toFixed(2)} €` : ""}
        </p>
      </div>
      <StatusSelect appointmentId={a.id} status={a.status} />
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
        onClick={() => {
          if (confirm("Apagar esta consulta? Esta ação não pode ser desfeita.")) {
            startDelete(() => deleteAppointment(a.id));
          }
        }}
        className="text-foreground-faint hover:text-rose disabled:opacity-50"
        aria-label="Apagar"
      >
        <Trash2 size={14} />
      </button>
      <Link href={`/consultas/${a.id}`}>
        <Button variant="secondary" size="sm">
          <Stethoscope size={14} /> Consulta
        </Button>
      </Link>
    </li>
  );
}
