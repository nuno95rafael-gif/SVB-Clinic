"use client";

import { useTransition } from "react";
import { toggleRoomActive } from "./actions";
import { Button } from "@/components/ui/button";

export function ToggleRoomButton({ roomId, active }: { roomId: string; active: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={pending}
      onClick={() => startTransition(() => toggleRoomActive(roomId, !active))}
    >
      {active ? "Desativar" : "Ativar"}
    </Button>
  );
}
