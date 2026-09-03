"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "../login/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function RecuperarPasswordPage() {
  const [state, formAction, pending] = useActionState<
    { message: string | null; error: string | null },
    FormData
  >(requestPasswordReset, {
    message: null,
    error: null,
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-semibold text-xl mb-1">Recuperar password</h1>
        <p className="text-sm text-foreground-soft mb-6">
          Indique o seu email para receber um link de recuperação.
        </p>
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          {state.message && (
            <p className="rounded-md bg-accent-soft px-3 py-2 text-[13px] text-accent-ink">
              {state.message}
            </p>
          )}
          {state.error && (
            <p className="rounded-md bg-rose-soft px-3 py-2 text-[13px] text-rose">
              {state.error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "A enviar…" : "Enviar link"}
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-foreground-faint">
          <Link href="/login" className="text-accent-ink underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}
