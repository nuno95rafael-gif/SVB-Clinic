"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { updateProfessional, deleteProfessional } from "./professionals-actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";

interface ProfessionalRowData {
  id: string;
  specialty: string | null;
  license_number: string | null;
  color_hex: string;
  users?: { full_name: string; email: string; active: boolean } | null;
}

export function ProfessionalRow({ professional: p }: { professional: ProfessionalRowData }) {
  const [editing, setEditing] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<
    { error: string | null; saved: boolean },
    FormData
  >(updateProfessional, { error: null, saved: false });

  useEffect(() => {
    if (state.saved) setEditing(false);
  }, [state.saved]);

  function handleDelete() {
    if (
      !confirm(
        `Apagar "${p.users?.full_name}" da lista de profissionais? Só é possível se não tiver consultas nem pacientes associados. A conta de utilizador não é apagada.`
      )
    ) {
      return;
    }
    setDeleteError(null);
    startDelete(async () => {
      const res = await deleteProfessional(p.id);
      if (res.error) setDeleteError(res.error);
    });
  }

  if (editing) {
    return (
      <div className="rounded-md border border-line p-3">
        <form action={formAction} className="flex items-end gap-4">
          <input type="hidden" name="id" value={p.id} />
          <div className="w-20 shrink-0">
            <Label htmlFor={`color-${p.id}`}>Cor</Label>
            <input
              id={`color-${p.id}`}
              name="color_hex"
              type="color"
              defaultValue={p.color_hex}
              className="h-10 w-full rounded-md border border-line"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor={`specialty-${p.id}`}>Especialidade</Label>
            <Input id={`specialty-${p.id}`} name="specialty" defaultValue={p.specialty ?? ""} />
          </div>
          <div className="flex-1">
            <Label htmlFor={`license-${p.id}`}>Cédula profissional</Label>
            <Input
              id={`license-${p.id}`}
              name="license_number"
              defaultValue={p.license_number ?? ""}
            />
          </div>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "A guardar…" : "Guardar"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
        </form>
        {state.error && <p className="mt-1.5 text-[12.5px] text-rose">{state.error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-line p-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
            style={{ backgroundColor: p.color_hex }}
          >
            {initials(p.users?.full_name ?? "?")}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{p.users?.full_name}</p>
            <p className="truncate text-[12.5px] text-foreground-faint">
              {p.specialty || "Sem especialidade"}
              {p.license_number ? ` · Cédula ${p.license_number}` : ""}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <Badge tone={p.users?.active ? "accent" : "neutral"}>
            {p.users?.active ? "Ativo" : "Inativo"}
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
      </div>
      {deleteError && <p className="mt-1.5 text-[12.5px] text-rose">{deleteError}</p>}
    </div>
  );
}
