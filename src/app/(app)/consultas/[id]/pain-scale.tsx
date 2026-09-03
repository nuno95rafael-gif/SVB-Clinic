"use client";

import { cn } from "@/lib/utils";
import { painColor } from "./body-map-data";

export function PainScale({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 11 }, (_, i) => i).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={cn(
            "h-8 w-8 rounded-md text-[12px] font-semibold text-white transition-transform",
            n === value ? "scale-110 ring-2 ring-offset-1 ring-[var(--foreground)]" : "opacity-80 hover:opacity-100"
          )}
          style={{ backgroundColor: painColor(n) }}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
