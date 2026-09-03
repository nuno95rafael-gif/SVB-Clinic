"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updatePassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function AtualizarPasswordPage() {
  const [state, formAction, pending] = useActionState<
    { error: string | null; ok: boolean },
    FormData
  >(updatePassword, {
    error: null,
    ok: false,
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-semibold text-xl mb-1">Nova password</h1>
        <p className="text-sm text-foreground-soft mb-6">Defina a sua nova password.</p>
        {state.ok ? (
          <div className="space-y-4">
            <p className="rounded-md bg-accent-soft px-3 py-2 text-[13px] text-accent-ink">
              Password atualizada com sucesso.
            </p>
            <Link href="/dashboard">
              <Button className="w-full">Ir para o dashboard</Button>
            </Link>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="password">Nova password</Label>
              <Input id="password" name="password" type="password" minLength={8} required />
            </div>
            {state.error && (
              <p className="rounded-md bg-rose-soft px-3 py-2 text-[13px] text-rose">
                {state.error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "A guardar…" : "Guardar nova password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
