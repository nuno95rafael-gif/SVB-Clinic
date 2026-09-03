"use client";

import { useActionState } from "react";
import { createClinic } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NovaClinicaForm() {
  const [state, formAction, pending] = useActionState<{ error: string | null }, FormData>(
    createClinic,
    { error: null }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova clínica</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="nif">NIF (opcional)</Label>
            <Input id="nif" name="nif" />
          </div>
          {state.error && (
            <p className="rounded-md bg-rose-soft px-3 py-2 text-[12.5px] text-rose">
              {state.error}
            </p>
          )}
          <Button type="submit" className="w-full" size="sm" disabled={pending}>
            {pending ? "A criar…" : "Criar clínica"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
