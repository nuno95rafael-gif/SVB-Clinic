import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import type { Patient } from "@/types/database";

export function ResumoTab({
  patient,
  appointmentsCount,
  nextAppointment,
  lastAppointment,
}: {
  patient: Patient;
  appointmentsCount: number;
  nextAppointment?: { starts_at: string } | null;
  lastAppointment?: { starts_at: string } | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <CardContent>
          <h3 className="text-[13px] font-semibold text-foreground-soft mb-3">Contactos</h3>
          <dl className="space-y-2 text-sm">
            <Row label="Telefone" value={patient.phone} />
            <Row label="Email" value={patient.email} />
            <Row label="Notas" value={patient.notes} />
          </dl>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Mini label="Nº de consultas" value={String(appointmentsCount)} />
        <Mini
          label="Próxima consulta"
          value={nextAppointment ? formatDateTime(nextAppointment.starts_at) : "—"}
        />
        <Mini
          label="Última consulta"
          value={lastAppointment ? formatDateTime(lastAppointment.starts_at) : "—"}
        />
        <Mini label="Dor atual" value="Ver tab Corpo / Evolução" />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-foreground-faint">{label}</dt>
      <dd className="text-right">{value || "—"}</dd>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-[11px] uppercase tracking-wide text-foreground-faint">{label}</p>
        <p className="text-[15px] font-semibold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}
