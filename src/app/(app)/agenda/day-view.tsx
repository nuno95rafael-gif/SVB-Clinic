import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusSelect } from "./status-select";
import type { Appointment } from "@/types/database";

export function DayView({ appointments }: { appointments: Appointment[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        {appointments.length === 0 ? (
          <p className="px-5 py-14 text-center text-sm text-foreground-faint">
            Sem consultas agendadas neste dia.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {appointments.map((a) => (
              <li key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                <div
                  className="w-1 self-stretch rounded-full"
                  style={{ backgroundColor: a.professionals?.color_hex ?? "#0d7a68" }}
                />
                <div className="w-16 shrink-0 text-sm font-medium tabular-nums">
                  {new Intl.DateTimeFormat("pt-PT", { timeStyle: "short" }).format(
                    new Date(a.starts_at)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.patients?.full_name}</p>
                  <p className="text-[12.5px] text-foreground-faint truncate">
                    {a.rooms?.name} · {a.professionals?.users?.full_name} · {a.duration_min} min
                  </p>
                </div>
                <StatusSelect appointmentId={a.id} status={a.status} />
                <Link href={`/consultas/${a.id}`}>
                  <Button variant="secondary" size="sm">
                    <Stethoscope size={14} /> Consulta
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
