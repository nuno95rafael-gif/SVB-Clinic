"use client";

import { useTransition } from "react";
import { toggleUserActive } from "./actions";
import { Button } from "@/components/ui/button";

export function ToggleUserButton({ userId, active }: { userId: string; active: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={pending}
      onClick={() => startTransition(() => toggleUserActive(userId, !active))}
    >
      {active ? "Desativar" : "Ativar"}
    </Button>
  );
}
