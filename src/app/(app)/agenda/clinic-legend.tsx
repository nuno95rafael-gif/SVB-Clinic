export function ClinicLegend({
  clinics,
}: {
  clinics: { id: string; name: string; color_hex: string }[];
}) {
  if (clinics.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line px-3 py-2 text-[12px] text-foreground-faint">
      {clinics.map((c) => (
        <span key={c.id} className="flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: c.color_hex }} />
          {c.name}
        </span>
      ))}
    </div>
  );
}
