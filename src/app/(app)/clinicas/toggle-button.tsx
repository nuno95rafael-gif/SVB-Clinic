"use client";

import { useTransition } from "react";
import { toggleClinicActive } from "./actions";
import { Button } from "@/components/ui/button";

export function ToggleClinicButton({ clinicId, active }: { clinicId: string; active: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={pending}
      onClick={() => startTransition(() => toggleClinicActive(clinicId, !active))}
    >
      {active ? "Desativar" : "Ativar"}
    </Button>
  );
}
