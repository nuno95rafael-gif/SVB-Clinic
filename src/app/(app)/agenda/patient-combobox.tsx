"use client";

import { useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input, Label } from "@/components/ui/input";

export function PatientCombobox({
  patients,
  name,
  initialPatient,
}: {
  patients: { id: string; full_name: string }[];
  name: string;
  initialPatient?: { id: string; full_name: string };
}) {
  const [query, setQuery] = useState(initialPatient?.full_name ?? "");
  const [selectedId, setSelectedId] = useState(initialPatient?.id ?? "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients.slice(0, 8);
    return patients.filter((p) => p.full_name.toLowerCase().includes(q)).slice(0, 8);
  }, [patients, query]);

  function select(p: { id: string; full_name: string }) {
    setSelectedId(p.id);
    setQuery(p.full_name);
    setOpen(false);
  }

  function handleBlur() {
    // dá tempo ao clique na opção antes de fechar
    setTimeout(() => setOpen(false), 120);
  }

  return (
    <div ref={containerRef} className="relative">
      <Label htmlFor="patient_search">Paciente</Label>
      <input type="hidden" name={name} value={selectedId} />
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-faint" />
        <Input
          id="patient_search"
          placeholder="Pesquisar paciente…"
          className="pl-8"
          value={query}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedId("");
            setOpen(true);
          }}
          autoComplete="off"
        />
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-line bg-surface shadow-[0_8px_24px_rgba(20,30,26,0.12)]">
          {matches.length === 0 ? (
            <p className="px-3 py-2.5 text-[13px] text-foreground-faint">
              Nenhum paciente encontrado.
            </p>
          ) : (
            <ul className="max-h-56 overflow-y-auto">
              {matches.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => select(p)}
                    className={cn(
                      "w-full px-3 py-2 text-left text-[13.5px] hover:bg-accent-soft hover:text-accent-ink",
                      selectedId === p.id && "bg-accent-soft text-accent-ink"
                    )}
                  >
                    {p.full_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
