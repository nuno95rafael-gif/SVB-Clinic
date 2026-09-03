"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { toggleUserActive, updateUser } from "./users-actions";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";
import type { UserProfile } from "@/types/database";

export function UserRow({ user, isSelf }: { user: UserProfile; isSelf: boolean }) {
  const [editing, setEditing] = useState(false);
  const [toggling, startToggle] = useTransition();
  const [state, formAction, pending] = useActionState<
    { error: string | null; saved: boolean },
    FormData
  >(updateUser, { error: null, saved: false });

  useEffect(() => {
    if (state.saved) setEditing(false);
  }, [state.saved]);

  if (editing) {
    return (
      <li className="px-5 py-3">
        <form action={formAction} className="flex items-center gap-3">
          <input type="hidden" name="user_id" value={user.id} />
          <Input name="full_name" defaultValue={user.full_name} className="flex-1" required />
          <Select name="role" defaultValue={user.role} disabled={isSelf} className="w-40">
            <option value="professional">Profissional</option>
            <option value="admin">Administrador</option>
          </Select>
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
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent-ink">
          {initials(user.full_name)}
        </div>
        <div>
          <p className="text-sm font-medium">{user.full_name}</p>
          <p className="text-[12.5px] text-foreground-faint">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <Badge tone={user.role === "admin" ? "amber" : "accent"}>
          {user.role === "admin" ? "Administrador" : "Profissional"}
        </Badge>
        <Badge tone={user.active ? "accent" : "neutral"}>{user.active ? "Ativo" : "Inativo"}</Badge>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-foreground-faint hover:text-foreground"
          aria-label="Editar"
        >
          <Pencil size={14} />
        </button>
        {!isSelf && (
          <Button
            size="sm"
            variant="secondary"
            disabled={toggling}
            onClick={() => startToggle(() => toggleUserActive(user.id, !user.active))}
          >
            {user.active ? "Desativar" : "Ativar"}
          </Button>
        )}
      </div>
    </li>
  );
}
