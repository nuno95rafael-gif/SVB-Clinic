"use client";

import { useTransition } from "react";
import { updateAppointmentStatus } from "./actions";

const STATUSES = [
  ["scheduled", "Agendada"],
  ["confirmed", "Confirmada"],
  ["in_progress", "Em curso"],
  ["completed", "Concluída"],
  ["cancelled", "Cancelada"],
  ["no_show", "Faltou"],
] as const;

export function StatusSelect({ appointmentId, status }: { appointmentId: string; status: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) =>
        startTransition(() => updateAppointmentStatus(appointmentId, e.target.value))
      }
      className="h-8 rounded-md border border-line bg-surface px-2 text-[12.5px]"
    >
      {STATUSES.map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
