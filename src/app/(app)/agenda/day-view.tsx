import { Card, CardContent } from "@/components/ui/card";
import { AppointmentRow } from "./appointment-row";
import type { Appointment } from "@/types/database";

export function DayView({
  appointments,
  patients,
  rooms,
  clinics,
  professionals,
  isAdmin,
}: {
  appointments: Appointment[];
  patients: { id: string; full_name: string; clinic_id: string }[];
  rooms: { id: string; name: string; clinic_id: string }[];
  clinics: { id: string; name: string; color_hex: string }[];
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
                clinics={clinics}
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
