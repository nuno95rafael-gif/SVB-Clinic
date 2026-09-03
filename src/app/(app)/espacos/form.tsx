"use client";

import { useActionState } from "react";
import { createRoom } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NovoEspacoForm() {
  const [state, formAction, pending] = useActionState(createRoom, { error: null });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo espaço</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" name="name" placeholder="Sala 1" required />
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>
          {state.error && (
            <p className="rounded-md bg-rose-soft px-3 py-2 text-[12.5px] text-rose">
              {state.error}
            </p>
          )}
          <Button type="submit" className="w-full" size="sm" disabled={pending}>
            {pending ? "A criar…" : "Criar espaço"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
