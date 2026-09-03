"use client";

import { useActionState } from "react";
import { saveClinicalRecord } from "./historia-actions";
import { RED_FLAGS } from "./red-flags";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClinicalRecord } from "@/types/database";

const RED_FLAG_LABELS: Record<(typeof RED_FLAGS)[number], string> = {
  trauma_recente: "Trauma recente",
  febre: "Febre",
  perda_peso_inexplicada: "Perda de peso inexplicada",
  alteracoes_neurologicas: "Alterações neurológicas",
  dor_noturna: "Dor noturna",
  outros_sinais: "Outros sinais relevantes",
};

export function HistoriaTab({
  patientId,
  record,
}: {
  patientId: string;
  record: ClinicalRecord | null;
}) {
  const [state, formAction, pending] = useActionState<
    { error: string | null; saved: boolean },
    FormData
  >(saveClinicalRecord, {
    error: null,
    saved: false,
  });

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="patient_id" value={patientId} />

      <Card>
        <CardHeader>
          <CardTitle>Dados gerais</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field name="motivo_consulta" label="Motivo da consulta" defaultValue={record?.motivo_consulta} />
          <Field name="objetivo_paciente" label="Objetivo do paciente" defaultValue={record?.objetivo_paciente} />
          <Field name="profissao" label="Profissão" defaultValue={record?.profissao} />
          <Field name="atividade_fisica" label="Atividade física / desporto" defaultValue={record?.atividade_fisica} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>História clínica</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field name="lesoes_anteriores" label="Lesões anteriores" defaultValue={record?.lesoes_anteriores} />
          <Field name="cirurgias" label="Cirurgias" defaultValue={record?.cirurgias} />
          <Field name="patologias" label="Patologias relevantes" defaultValue={record?.patologias} />
          <Field name="medicacao" label="Medicação" defaultValue={record?.medicacao} />
          <Field name="alergias" label="Alergias" defaultValue={record?.alergias} />
          <Field name="antecedentes" label="Antecedentes relevantes" defaultValue={record?.antecedentes} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Red flags</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[12.5px] text-foreground-soft mb-3">
            Apenas registo pelo profissional — a aplicação não interpreta nem sugere diagnóstico.
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {RED_FLAGS.map((flag) => (
              <label key={flag} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name={`red_flag_${flag}`}
                  defaultChecked={Boolean(record?.red_flags?.[flag])}
                  className="h-4 w-4 rounded border-line accent-[var(--accent)]"
                />
                {RED_FLAG_LABELS[flag]}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {state.error && (
        <p className="rounded-md bg-rose-soft px-3 py-2 text-[13px] text-rose">{state.error}</p>
      )}
      {state.saved && (
        <p className="rounded-md bg-accent-soft px-3 py-2 text-[13px] text-accent-ink">
          História clínica guardada.
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "A guardar…" : "Guardar história clínica"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} rows={2} defaultValue={defaultValue ?? ""} />
    </div>
  );
}
