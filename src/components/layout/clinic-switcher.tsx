"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { setActiveClinic } from "@/app/(app)/clinic-actions";
import { ALL_CLINICS_VALUE } from "@/lib/clinic-constants";

export function ClinicSwitcher({
  clinics,
  activeClinicId,
}: {
  clinics: { id: string; name: string }[];
  activeClinicId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (clinics.length === 0) return null;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const clinicId = e.target.value;
    startTransition(async () => {
      await setActiveClinic(clinicId);
      router.refresh();
    });
  }

  return (
    <div className="px-3 pb-3">
      <label className="mb-1.5 flex items-center gap-1.5 px-0.5 text-[11px] font-medium uppercase tracking-wide text-foreground-faint">
        <Building2 size={12} /> Clínica
      </label>
      <select
        value={activeClinicId ?? ALL_CLINICS_VALUE}
        onChange={handleChange}
        disabled={pending}
        className="h-9 w-full rounded-md border border-line bg-background px-2.5 text-[13px] font-medium text-foreground disabled:opacity-70"
      >
        <option value={ALL_CLINICS_VALUE}>Todas as clínicas</option>
        {clinics.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
