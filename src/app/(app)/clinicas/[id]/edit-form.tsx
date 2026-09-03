"use client";

import { useActionState } from "react";
import { updateClinic } from "../actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Clinic } from "@/types/database";

export function EditClinicForm({ clinic }: { clinic: Clinic }) {
  const [state, formAction, pending] = useActionState<
    { error: string | null; saved: boolean },
    FormData
  >(updateClinic, { error: null, saved: false });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados da empresa</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="clinic_id" value={clinic.id} />
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" defaultValue={clinic.name} required />
          </div>
          <div>
            <Label htmlFor="nif">NIF</Label>
            <Input id="nif" name="nif" defaultValue={clinic.nif ?? ""} />
          </div>

          {state.error && (
            <p className="rounded-md bg-rose-soft px-3 py-2 text-[12.5px] text-rose">
              {state.error}
            </p>
          )}
          {state.saved && (
            <p className="rounded-md bg-accent-soft px-3 py-2 text-[12.5px] text-accent-ink">
              Guardado.
            </p>
          )}

          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "A guardar…" : "Guardar alterações"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
