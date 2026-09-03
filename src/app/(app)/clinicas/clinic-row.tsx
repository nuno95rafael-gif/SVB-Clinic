"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { toggleClinicActive, updateClinic } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Clinic } from "@/types/database";

export function ClinicRow({ clinic }: { clinic: Clinic }) {
  const [editing, setEditing] = useState(false);
  const [toggling, startToggle] = useTransition();
  const [state, formAction, pending] = useActionState<
    { error: string | null; saved: boolean },
    FormData
  >(updateClinic, { error: null, saved: false });

  useEffect(() => {
    if (state.saved) setEditing(false);
  }, [state.saved]);

  if (editing) {
    return (
      <li className="px-5 py-3">
        <form action={formAction} className="flex items-center gap-3">
          <input type="hidden" name="clinic_id" value={clinic.id} />
          <input
            type="color"
            name="color_hex"
            defaultValue={clinic.color_hex}
            className="h-10 w-10 shrink-0 rounded-md border border-line"
            title="Cor na agenda"
          />
          <Input name="name" defaultValue={clinic.name} placeholder="Nome" className="flex-1" required />
          <Input name="nif" defaultValue={clinic.nif ?? ""} placeholder="NIF" className="w-36" />
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "A guardar…" : "Guardar"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
        </form>
        {state.error && <p className="mt-1.5 text-[12.5px] text-rose">{state.error}</p>}
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between px-5 py-3">
      <Link href={`/clinicas/${clinic.id}`} className="flex min-w-0 items-center gap-2.5">
        <span
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: clinic.color_hex }}
          title="Cor na agenda"
        />
        <span>
          <p className="text-sm font-medium hover:text-accent-ink">{clinic.name}</p>
          {clinic.nif && <p className="text-[12.5px] text-foreground-faint">NIF {clinic.nif}</p>}
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <Badge tone={clinic.active ? "accent" : "neutral"}>
          {clinic.active ? "Ativa" : "Inativa"}
        </Badge>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-foreground-faint hover:text-foreground"
          aria-label="Editar"
        >
          <Pencil size={14} />
        </button>
        <Button
          size="sm"
          variant="secondary"
          disabled={toggling}
          onClick={() => startToggle(() => toggleClinicActive(clinic.id, !clinic.active))}
        >
          {clinic.active ? "Desativar" : "Ativar"}
        </Button>
      </div>
    </li>
  );
}
