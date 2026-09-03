"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Search, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { quickCreatePatient } from "./patient-actions";

interface PatientOption {
  id: string;
  full_name: string;
  clinic_id?: string;
}

export function PatientCombobox({
  patients,
  name,
  initialPatient,
  onSelect,
  allowCreate,
  clinics,
}: {
  patients: PatientOption[];
  name: string;
  initialPatient?: { id: string; full_name: string };
  onSelect?: (patient: PatientOption | null) => void;
  allowCreate?: boolean;
  clinics?: { id: string; name: string }[];
}) {
  const [query, setQuery] = useState(initialPatient?.full_name ?? "");
  const [selectedId, setSelectedId] = useState(initialPatient?.id ?? "");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newClinicId, setNewClinicId] = useState(clinics?.[0]?.id ?? "");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createPending, startCreate] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients.slice(0, 8);
    return patients.filter((p) => p.full_name.toLowerCase().includes(q)).slice(0, 8);
  }, [patients, query]);

  function select(p: PatientOption) {
    setSelectedId(p.id);
    setQuery(p.full_name);
    setOpen(false);
    setCreating(false);
    onSelect?.(p);
  }

  function handleBlur() {
    // dá tempo ao clique na opção (ou no formulário de criação) antes de fechar
    if (creating) return;
    setTimeout(() => setOpen(false), 150);
  }

  function handleCreate() {
    if (!newClinicId) {
      setCreateError("Selecione uma clínica.");
      return;
    }
    setCreateError(null);
    const formData = new FormData();
    formData.set("full_name", query.trim());
    formData.set("clinic_id", newClinicId);
    startCreate(async () => {
      const res = await quickCreatePatient(formData);
      if (res.error || !res.patient) {
        setCreateError(res.error ?? "Não foi possível criar o paciente.");
        return;
      }
      select(res.patient);
    });
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
            setCreating(false);
            onSelect?.(null);
          }}
          autoComplete="off"
        />
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-line bg-surface shadow-[0_8px_24px_rgba(20,30,26,0.12)]">
          {matches.length > 0 ? (
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
          ) : allowCreate && clinics && clinics.length > 0 ? (
            <div className="p-3">
              <p className="text-[13px] text-foreground-faint">Nenhum paciente encontrado.</p>
              {!creating ? (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setCreating(true)}
                  disabled={!query.trim()}
                  className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-accent-ink hover:underline disabled:opacity-50"
                >
                  <UserPlus size={14} />
                  Criar paciente "{query.trim()}"
                </button>
              ) : (
                <div className="mt-2 space-y-2" onMouseDown={(e) => e.preventDefault()}>
                  <Select value={newClinicId} onChange={(e) => setNewClinicId(e.target.value)}>
                    {clinics.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                  {createError && <p className="text-[12px] text-rose">{createError}</p>}
                  <div className="flex gap-2">
                    <Button type="button" size="sm" disabled={createPending} onClick={handleCreate}>
                      {createPending ? "A criar…" : `Criar "${query.trim()}"`}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCreating(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="px-3 py-2.5 text-[13px] text-foreground-faint">
              Nenhum paciente encontrado.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
