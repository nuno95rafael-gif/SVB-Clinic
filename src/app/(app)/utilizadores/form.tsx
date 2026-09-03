"use client";

import { useActionState } from "react";
import { inviteUser } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function InviteUserForm() {
  const [state, formAction, pending] = useActionState<
    { error: string | null; ok: boolean },
    FormData
  >(inviteUser, { error: null, ok: false });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Convidar utilizador</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <div>
            <Label htmlFor="full_name">Nome</Label>
            <Input id="full_name" name="full_name" required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="role">Papel</Label>
            <Select id="role" name="role" defaultValue="professional">
              <option value="professional">Profissional</option>
              <option value="admin">Administrador</option>
            </Select>
          </div>
          {state.error && (
            <p className="rounded-md bg-rose-soft px-3 py-2 text-[12.5px] text-rose">
              {state.error}
            </p>
          )}
          {state.ok && (
            <p className="rounded-md bg-accent-soft px-3 py-2 text-[12.5px] text-accent-ink">
              Convite enviado por email.
            </p>
          )}
          <Button type="submit" className="w-full" size="sm" disabled={pending}>
            {pending ? "A enviar…" : "Enviar convite"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
