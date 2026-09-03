"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { updatePatient, deletePatient } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDate, initials } from "@/lib/utils";
import type { Patient } from "@/types/database";

export function PatientRow({
  patient: p,
  professionals,
  isAdmin,
}: {
  patient: Patient;
  professionals: { id: string; users: { full_name: string } }[];
  isAdmin: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<
    { error: string | null; saved: boolean },
    FormData
  >(updatePatient, { error: null, saved: false });

  useEffect(() => {
    if (state.saved) setEditing(false);
  }, [state.saved]);

  function handleDelete() {
    if (
      !confirm(`Apagar "${p.full_name}"? Só é possível se não tiver consultas nem pagamentos associados.`)
    ) {
      return;
    }
    setDeleteError(null);
    startDelete(async () => {
      const res = await deletePatient(p.id);
      if (res.error) setDeleteError(res.error);
    });
  }

  if (editing) {
    return (
      <tr className="border-b border-line last:border-0">
        <td colSpan={6} className="px-5 py-3.5">
          <form action={formAction} className="space-y-2.5">
            <input type="hidden" name="patient_id" value={p.id} />
            <div className="grid grid-cols-4 gap-2.5">
              <div className="col-span-2">
                <Label htmlFor={`name-${p.id}`}>Nome completo</Label>
                <Input id={`name-${p.id}`} name="full_name" defaultValue={p.full_name} required />
              </div>
              <div>
                <Label htmlFor={`birth-${p.id}`}>Nascimento</Label>
                <Input id={`birth-${p.id}`} name="birth_date" type="date" defaultValue={p.birth_date ?? ""} />
              </div>
              <div>
                <Label htmlFor={`phone-${p.id}`}>Telefone</Label>
                <Input id={`phone-${p.id}`} name="phone" type="tel" defaultValue={p.phone ?? ""} />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              <div className="col-span-2">
                <Label htmlFor={`email-${p.id}`}>Email</Label>
                <Input id={`email-${p.id}`} name="email" type="email" defaultValue={p.email ?? ""} />
              </div>
              {isAdmin && (
                <div>
                  <Label htmlFor={`prof-${p.id}`}>Profissional</Label>
                  <Select id={`prof-${p.id}`} name="professional_id" defaultValue={p.professional_id ?? ""}>
                    <option value="">Por atribuir</option>
                    {professionals.map((pr) => (
                      <option key={pr.id} value={pr.id}>
                        {pr.users?.full_name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              <div>
                <Label htmlFor={`status-${p.id}`}>Estado</Label>
                <Select id={`status-${p.id}`} name="status" defaultValue={p.status}>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </Select>
              </div>
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
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-line last:border-0 hover:bg-background">
      <td className="px-5 py-3">
        <Link href={`/pacientes/${p.id}`} className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent-ink">
            {initials(p.full_name)}
          </div>
          <span className="font-medium">{p.full_name}</span>
        </Link>
      </td>
      <td className="px-5 py-3 text-foreground-soft">{p.phone || p.email || "—"}</td>
      <td className="px-5 py-3 text-foreground-soft">{p.professionals?.users?.full_name ?? "—"}</td>
      <td className="px-5 py-3 text-foreground-soft">{formatDate(p.registered_at)}</td>
      <td className="px-5 py-3">
        <Badge tone={p.status === "active" ? "accent" : "neutral"}>
          {p.status === "active" ? "Ativo" : "Inativo"}
        </Badge>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-foreground-faint hover:text-foreground"
            aria-label="Editar"
          >
            <Pencil size={14} />
          </button>
          {isAdmin && (
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="text-foreground-faint hover:text-rose disabled:opacity-50"
              aria-label="Apagar"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
        {deleteError && <p className="mt-1 max-w-[180px] text-[11.5px] text-rose">{deleteError}</p>}
      </td>
    </tr>
  );
}
