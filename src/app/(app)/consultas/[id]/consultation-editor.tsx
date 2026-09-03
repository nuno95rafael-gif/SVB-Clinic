"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BodyMap } from "./body-map";
import { PainScale } from "./pain-scale";
import {
  FREQUENCY_LABELS,
  PAIN_TYPE_LABELS,
  SIDE_LABELS,
  SYMPTOM_TYPE_LABELS,
} from "./body-map-data";
import {
  addPainAssessment,
  addSymptom,
  addTreatmentRecord,
  finishConsultation,
  removePainAssessment,
  removeSymptom,
  removeTreatmentRecord,
  saveCarePlan,
  saveChiefComplaint,
  savePhysicalAssessment,
} from "./actions";
import type {
  BodySide,
  BodyView,
  CarePlan,
  Consultation,
  PainAssessment,
  PainFrequency,
  PainType,
  PhysicalAssessment,
  Symptom,
  SymptomType,
  TreatmentRecord,
} from "@/types/database";

const SECTIONS = [
  { key: "queixa", n: "01", label: "Queixa + sintomas" },
  { key: "dor", n: "02", label: "Dor + corpo" },
  { key: "avaliacao", n: "03", label: "Avaliação física" },
  { key: "tratamento", n: "04", label: "Tratamento" },
  { key: "plano", n: "05", label: "Plano" },
  { key: "guardar", n: "06", label: "Guardar" },
] as const;

export function ConsultationEditor({
  consultation,
  appointmentId,
  patientId,
  patientName,
  isAdmin,
  concluded,
  initialSymptoms,
  initialPainPoints,
  initialPhysicalAssessment,
  initialTreatmentRecords,
  treatmentsCatalog,
  initialCarePlan,
}: {
  consultation: Consultation;
  appointmentId: string;
  patientId: string;
  patientName: string;
  isAdmin: boolean;
  concluded: boolean;
  initialSymptoms: Symptom[];
  initialPainPoints: PainAssessment[];
  initialPhysicalAssessment: PhysicalAssessment | null;
  initialTreatmentRecords: TreatmentRecord[];
  treatmentsCatalog: { id: string; name: string }[];
  initialCarePlan: CarePlan | null;
}) {
  const router = useRouter();

  return (
    <div className="p-8 max-w-5xl">
      <Link
        href={`/pacientes/${patientId}?tab=consultas`}
        className="inline-flex items-center gap-1.5 text-[13px] text-foreground-faint hover:text-foreground"
      >
        <ArrowLeft size={14} /> {patientName}
      </Link>

      <div className="flex items-center justify-between mt-3 mb-8">
        <h1 className="text-2xl font-semibold">Consulta</h1>
        {concluded && <Badge tone="accent">Concluída</Badge>}
      </div>

      <nav className="flex flex-wrap gap-1 mb-8 sticky top-0 z-10 bg-background/95 backdrop-blur py-2 -mx-1 px-1">
        {SECTIONS.map((s) => (
          <a
            key={s.key}
            href={`#${s.key}`}
            className="rounded-md px-2.5 py-1 text-[12.5px] font-medium text-foreground-faint hover:bg-surface hover:text-foreground"
          >
            <span className="font-mono text-[11px] text-accent-ink mr-1">{s.n}</span>
            {s.label}
          </a>
        ))}
      </nav>

      <div className="space-y-10">
        <QueixaSection
          consultation={consultation}
          appointmentId={appointmentId}
          initialSymptoms={initialSymptoms}
        />

        <DorSection
          consultation={consultation}
          appointmentId={appointmentId}
          patientId={patientId}
          initialPainPoints={initialPainPoints}
        />

        <AvaliacaoSection
          consultation={consultation}
          appointmentId={appointmentId}
          initial={initialPhysicalAssessment}
        />

        <TratamentoSection
          consultation={consultation}
          appointmentId={appointmentId}
          initialRecords={initialTreatmentRecords}
          catalog={treatmentsCatalog}
        />

        <PlanoSection
          consultation={consultation}
          appointmentId={appointmentId}
          initial={initialCarePlan}
        />

        <GuardarSection
          consultation={consultation}
          appointmentId={appointmentId}
          patientId={patientId}
          isAdmin={isAdmin}
          concluded={concluded}
          onFinished={() => router.push(`/pacientes/${patientId}?tab=consultas`)}
        />
      </div>
    </div>
  );
}

function SectionShell({
  id,
  n,
  title,
  children,
}: {
  id: string;
  n: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-16">
      <h2 className="text-[19px] font-semibold flex items-baseline gap-2.5 mb-4">
        <span className="font-mono text-[13px] text-accent-ink">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

// --- 01: Queixa + sintomas -------------------------------------------------

function QueixaSection({
  consultation,
  appointmentId,
  initialSymptoms,
}: {
  consultation: Consultation;
  appointmentId: string;
  initialSymptoms: Symptom[];
}) {
  const [chiefComplaint, setChiefComplaint] = useState(consultation.chief_complaint ?? "");
  const [sessionNotes, setSessionNotes] = useState(consultation.session_notes ?? "");
  const [symptoms, setSymptoms] = useState(initialSymptoms);
  const [symptomType, setSymptomType] = useState<SymptomType>("dor");
  const [symptomNotes, setSymptomNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function saveText() {
    startTransition(async () => {
      await saveChiefComplaint(consultation.id, appointmentId, chiefComplaint, sessionNotes);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  function handleAddSymptom() {
    startTransition(async () => {
      const { data } = await addSymptom(consultation.id, appointmentId, symptomType, symptomNotes);
      if (data) {
        setSymptoms((prev) => [...prev, data]);
        setSymptomNotes("");
      }
    });
  }

  function handleRemoveSymptom(id: string) {
    startTransition(async () => {
      await removeSymptom(id, appointmentId);
      setSymptoms((prev) => prev.filter((s) => s.id !== id));
    });
  }

  return (
    <SectionShell id="queixa" n="01" title="Queixa + sintomas">
      <Card>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="chief_complaint">Queixa principal</Label>
            <Textarea
              id="chief_complaint"
              rows={2}
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              onBlur={saveText}
              placeholder="O que traz o paciente à consulta…"
            />
          </div>
          <div>
            <Label htmlFor="session_notes">Notas da sessão</Label>
            <Textarea
              id="session_notes"
              rows={2}
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              onBlur={saveText}
            />
          </div>
          {(pending || saved) && (
            <p className="text-[12px] text-foreground-faint">{pending ? "A guardar…" : "Guardado."}</p>
          )}

          <div className="border-t border-line pt-4">
            <Label>Sintomas</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {symptoms.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-[12.5px] text-accent-ink"
                >
                  {SYMPTOM_TYPE_LABELS[s.symptom_type] ?? s.symptom_type}
                  {s.notes ? ` — ${s.notes}` : ""}
                  <button type="button" onClick={() => handleRemoveSymptom(s.id)} aria-label="Remover">
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
              {symptoms.length === 0 && (
                <p className="text-[12.5px] text-foreground-faint">Sem sintomas registados.</p>
              )}
            </div>
            <div className="flex gap-2">
              <Select
                value={symptomType}
                onChange={(e) => setSymptomType(e.target.value as SymptomType)}
                className="w-56"
              >
                {Object.entries(SYMPTOM_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
              <Input
                placeholder="Nota (opcional)"
                value={symptomNotes}
                onChange={(e) => setSymptomNotes(e.target.value)}
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddSymptom} disabled={pending}>
                <Plus size={14} /> Adicionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </SectionShell>
  );
}

// --- 02: Dor + corpo ---------------------------------------------------------

function DorSection({
  consultation,
  appointmentId,
  patientId,
  initialPainPoints,
}: {
  consultation: Consultation;
  appointmentId: string;
  patientId: string;
  initialPainPoints: PainAssessment[];
}) {
  const [view, setView] = useState<BodyView>("anterior");
  const [points, setPoints] = useState(initialPainPoints);
  const [pending, startTransition] = useTransition();

  const [pendingPoint, setPendingPoint] = useState<{
    region: string;
    side: BodySide;
    x: number;
    y: number;
  } | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [painType, setPainType] = useState<PainType>("dor");
  const [frequency, setFrequency] = useState<PainFrequency>("intermitente");
  const [observations, setObservations] = useState("");

  function handleRegionClick(region: string, side: BodySide, x: number, y: number) {
    setPendingPoint({ region, side, x, y });
    setIntensity(5);
    setPainType("dor");
    setFrequency("intermitente");
    setObservations("");
  }

  function handleSavePoint() {
    if (!pendingPoint) return;
    startTransition(async () => {
      const { data } = await addPainAssessment({
        consultationId: consultation.id,
        appointmentId,
        patientId,
        bodyView: view,
        region: pendingPoint.region,
        side: pendingPoint.side,
        x: pendingPoint.x,
        y: pendingPoint.y,
        intensity,
        painType,
        frequency,
        observations,
      });
      if (data) {
        setPoints((prev) => [...prev, data]);
        setPendingPoint(null);
      }
    });
  }

  function handleRemovePoint(id: string) {
    startTransition(async () => {
      await removePainAssessment(id, appointmentId);
      setPoints((prev) => prev.filter((p) => p.id !== id));
    });
  }

  return (
    <SectionShell id="dor" n="02" title="Dor + corpo">
      <div className="grid grid-cols-[260px_1fr] gap-6">
        <Card>
          <CardContent>
            <BodyMap
              view={view}
              onViewChange={setView}
              points={points}
              pendingPoint={pendingPoint}
              onRegionClick={handleRegionClick}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {pendingPoint && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {pendingPoint.region}
                  {pendingPoint.side !== "central" ? ` · ${SIDE_LABELS[pendingPoint.side]}` : ""}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Lado</Label>
                    <Select
                      value={pendingPoint.side}
                      onChange={(e) =>
                        setPendingPoint({ ...pendingPoint, side: e.target.value as BodySide })
                      }
                    >
                      {Object.entries(SIDE_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Frequência</Label>
                    <Select value={frequency} onChange={(e) => setFrequency(e.target.value as PainFrequency)}>
                      {Object.entries(FREQUENCY_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={painType} onChange={(e) => setPainType(e.target.value as PainType)}>
                    {Object.entries(PAIN_TYPE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Intensidade — {intensity}</Label>
                  <PainScale value={intensity} onChange={setIntensity} />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea rows={2} value={observations} onChange={(e) => setObservations(e.target.value)} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setPendingPoint(null)}>
                    Cancelar
                  </Button>
                  <Button type="button" size="sm" onClick={handleSavePoint} disabled={pending}>
                    {pending ? "A guardar…" : "Guardar marcação"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Marcações desta consulta</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {points.length === 0 ? (
                <p className="px-5 py-8 text-center text-[13px] text-foreground-faint">
                  Ainda sem marcações. Clique numa região do corpo.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {points.map((p) => (
                    <li key={p.id} className="flex items-center justify-between px-5 py-2.5">
                      <div className="text-sm">
                        <span className="font-medium">{p.region}</span>
                        {p.side && p.side !== "central" ? ` · ${SIDE_LABELS[p.side]}` : ""}
                        <span className="text-foreground-faint text-[12.5px] ml-2">
                          {p.pain_type ? PAIN_TYPE_LABELS[p.pain_type] : ""}
                          {p.frequency ? ` · ${FREQUENCY_LABELS[p.frequency]}` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={p.intensity >= 7 ? "rose" : p.intensity >= 4 ? "amber" : "accent"}>
                          {p.intensity}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => handleRemovePoint(p.id)}
                          className="text-foreground-faint hover:text-rose"
                          aria-label="Remover"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SectionShell>
  );
}

// --- 03: Avaliação física ----------------------------------------------------

function AvaliacaoSection({
  consultation,
  appointmentId,
  initial,
}: {
  consultation: Consultation;
  appointmentId: string;
  initial: PhysicalAssessment | null;
}) {
  const [id, setId] = useState(initial?.id ?? null);
  const [mobility, setMobility] = useState(initial?.mobility ?? "");
  const [romNotes, setRomNotes] = useState(initial?.rom_notes ?? "");
  const [asymmetry, setAsymmetry] = useState(initial?.asymmetry ?? "");
  const [limitations, setLimitations] = useState(initial?.limitations ?? "");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const { data } = await savePhysicalAssessment(id, consultation.id, appointmentId, {
        mobility,
        rom_notes: romNotes,
        asymmetry,
        limitations,
      });
      if (data) {
        setId(data.id);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }
    });
  }

  return (
    <SectionShell id="avaliacao" n="03" title="Avaliação física">
      <Card>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Mobilidade</Label>
            <Textarea rows={2} value={mobility} onChange={(e) => setMobility(e.target.value)} />
          </div>
          <div>
            <Label>Notas de amplitude de movimento (ROM)</Label>
            <Textarea rows={2} value={romNotes} onChange={(e) => setRomNotes(e.target.value)} />
          </div>
          <div>
            <Label>Assimetrias</Label>
            <Textarea rows={2} value={asymmetry} onChange={(e) => setAsymmetry(e.target.value)} />
          </div>
          <div>
            <Label>Limitações</Label>
            <Textarea rows={2} value={limitations} onChange={(e) => setLimitations(e.target.value)} />
          </div>
          <div className="col-span-2 flex items-center justify-end gap-3">
            {saved && <span className="text-[12.5px] text-accent-ink">Guardado.</span>}
            <Button type="button" size="sm" onClick={handleSave} disabled={pending}>
              {pending ? "A guardar…" : "Guardar avaliação"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </SectionShell>
  );
}

// --- 04: Tratamento -----------------------------------------------------------

function TratamentoSection({
  consultation,
  appointmentId,
  initialRecords,
  catalog,
}: {
  consultation: Consultation;
  appointmentId: string;
  initialRecords: TreatmentRecord[];
  catalog: { id: string; name: string }[];
}) {
  const [records, setRecords] = useState(initialRecords);
  const [treatmentId, setTreatmentId] = useState("");
  const [region, setRegion] = useState("");
  const [technique, setTechnique] = useState("");
  const [observations, setObservations] = useState("");
  const [pending, startTransition] = useTransition();

  function handleAdd() {
    startTransition(async () => {
      const { data } = await addTreatmentRecord(consultation.id, appointmentId, {
        treatmentId: treatmentId || null,
        region,
        technique,
        observations,
      });
      if (data) {
        setRecords((prev) => [...prev, data]);
        setRegion("");
        setTechnique("");
        setObservations("");
        setTreatmentId("");
      }
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      await removeTreatmentRecord(id, appointmentId);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    });
  }

  return (
    <SectionShell id="tratamento" n="04" title="Tratamento">
      <Card>
        <CardContent className="space-y-4">
          <ul className="divide-y divide-line">
            {records.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2.5">
                <div className="text-sm">
                  <span className="font-medium">
                    {r.treatments_catalog?.name ?? r.technique ?? "Tratamento"}
                  </span>
                  {r.region ? ` · ${r.region}` : ""}
                  {r.observations && (
                    <p className="text-[12.5px] text-foreground-faint">{r.observations}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(r.id)}
                  className="text-foreground-faint hover:text-rose"
                  aria-label="Remover"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
            {records.length === 0 && (
              <p className="py-6 text-center text-[13px] text-foreground-faint">
                Ainda sem tratamentos registados.
              </p>
            )}
          </ul>

          <div className="grid grid-cols-2 gap-3 border-t border-line pt-4">
            {catalog.length > 0 && (
              <div className="col-span-2">
                <Label>Catálogo (opcional)</Label>
                <Select value={treatmentId} onChange={(e) => setTreatmentId(e.target.value)}>
                  <option value="">— nenhum —</option>
                  {catalog.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div>
              <Label>Região</Label>
              <Input value={region} onChange={(e) => setRegion(e.target.value)} />
            </div>
            <div>
              <Label>Técnica</Label>
              <Input value={technique} onChange={(e) => setTechnique(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Observações</Label>
              <Textarea rows={2} value={observations} onChange={(e) => setObservations(e.target.value)} />
            </div>
            <div className="col-span-2 flex justify-end">
              <Button type="button" variant="secondary" size="sm" onClick={handleAdd} disabled={pending}>
                <Plus size={14} /> Adicionar tratamento
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </SectionShell>
  );
}

// --- 05: Plano ------------------------------------------------------------

function PlanoSection({
  consultation,
  appointmentId,
  initial,
}: {
  consultation: Consultation;
  appointmentId: string;
  initial: CarePlan | null;
}) {
  const [recommendations, setRecommendations] = useState(initial?.recommendations ?? "");
  const [homeCare, setHomeCare] = useState(initial?.home_care ?? "");
  const [educationNotes, setEducationNotes] = useState(initial?.education_notes ?? "");
  const [nextDate, setNextDate] = useState(initial?.next_appointment_suggested_at ?? "");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const { data } = await saveCarePlan(consultation.id, appointmentId, {
        recommendations,
        home_care: homeCare,
        education_notes: educationNotes,
        next_appointment_suggested_at: nextDate,
      });
      if (data) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }
    });
  }

  return (
    <SectionShell id="plano" n="05" title="Plano">
      <Card>
        <CardContent className="space-y-4">
          <div>
            <Label>Recomendações</Label>
            <Textarea rows={2} value={recommendations} onChange={(e) => setRecommendations(e.target.value)} />
          </div>
          <div>
            <Label>Cuidados em casa</Label>
            <Textarea rows={2} value={homeCare} onChange={(e) => setHomeCare(e.target.value)} />
          </div>
          <div>
            <Label>Notas de educação ao paciente</Label>
            <Textarea rows={2} value={educationNotes} onChange={(e) => setEducationNotes(e.target.value)} />
          </div>
          <div className="max-w-xs">
            <Label>Próxima consulta sugerida para</Label>
            <Input type="date" value={nextDate ?? ""} onChange={(e) => setNextDate(e.target.value)} />
          </div>
          <div className="flex items-center justify-end gap-3">
            {saved && <span className="text-[12.5px] text-accent-ink">Guardado.</span>}
            <Button type="button" size="sm" onClick={handleSave} disabled={pending}>
              {pending ? "A guardar…" : "Guardar plano"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </SectionShell>
  );
}

// --- 06: Guardar ---------------------------------------------------------

function GuardarSection({
  consultation,
  appointmentId,
  patientId,
  isAdmin,
  concluded,
  onFinished,
}: {
  consultation: Consultation;
  appointmentId: string;
  patientId: string;
  isAdmin: boolean;
  concluded: boolean;
  onFinished: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(concluded);

  function handleFinish() {
    startTransition(async () => {
      const res = await finishConsultation(consultation.id, appointmentId);
      if (res.error) {
        setError(res.error);
        return;
      }
      setDone(true);
    });
  }

  return (
    <SectionShell id="guardar" n="06" title="Guardar">
      <Card>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground-soft">
              {done
                ? "Consulta concluída."
                : "Ao concluir, o estado da marcação passa a “Concluída”."}
            </p>
            {done && isAdmin && (
              <Link
                href={`/financeiro?patient=${patientId}&appointment=${appointmentId}`}
                className="text-[12.5px] text-accent-ink hover:underline"
              >
                Registar pagamento desta consulta →
              </Link>
            )}
            {error && <p className="text-[12.5px] text-rose mt-1">{error}</p>}
          </div>
          {done ? (
            <Button variant="secondary" onClick={onFinished}>
              <Check size={15} /> Voltar ao paciente
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={pending}>
              {pending ? "A concluir…" : "Guardar e concluir consulta"}
            </Button>
          )}
        </CardContent>
      </Card>
    </SectionShell>
  );
}
