import { Card, CardContent } from "@/components/ui/card";
import { AppointmentRow } from "./appointment-row";
import type { Appointment } from "@/types/database";

export function DayView({
  appointments,
  patients,
  rooms,
  professionals,
  isAdmin,
}: {
  appointments: Appointment[];
  patients: { id: string; full_name: string }[];
  rooms: { id: string; name: string }[];
  professionals: { id: string; users?: { full_name: string } }[];
  isAdmin: boolean;
}) {
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
              <AppointmentRow
                key={a.id}
                appointment={a}
                patients={patients}
                rooms={rooms}
                professionals={professionals}
                isAdmin={isAdmin}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
