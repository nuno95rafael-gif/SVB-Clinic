import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { getActiveClinicId } from "@/lib/clinic";
import { Card, CardContent } from "@/components/ui/card";
import { PaymentForm } from "./payment-form";
import { PaymentRow } from "./payment-row";

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string; appointment?: string }>;
}) {
  await requireAdmin();
  const { patient: patientIdParam, appointment: appointmentIdParam } = await searchParams;
  const supabase = await createClient();
  const activeClinicId = await getActiveClinicId();

  let patientsQuery = supabase.from("patients").select("id, full_name").order("full_name");
  if (activeClinicId) patientsQuery = patientsQuery.eq("clinic_id", activeClinicId);

  const [{ data: payments }, { data: patients }, initialPatientResult] = await Promise.all([
    supabase
      .from("payments")
      .select("*, patients(full_name), clinics(name)")
      .order("created_at", { ascending: false })
      .limit(50),
    patientsQuery,
    patientIdParam
      ? supabase.from("patients").select("id, full_name").eq("id", patientIdParam).single()
      : Promise.resolve({ data: null }),
  ]);

  const initialPatient = initialPatientResult.data ?? undefined;

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-semibold mb-6">Financeiro</h1>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardContent className="p-0">
            {!payments || payments.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-foreground-faint">
                Ainda não há pagamentos registados.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {payments.map((p) => (
                  <PaymentRow key={p.id} payment={p} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <PaymentForm
          patients={patients ?? []}
          initialPatient={initialPatient}
          initialAppointmentId={appointmentIdParam}
        />
      </div>
    </div>
  );
}
