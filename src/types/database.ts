// Tipos manuais para a Fase 1/2. Depois de o projeto Supabase existir,
// substituir por: npx supabase gen types typescript --project-id <ref>

export type UserRole = "admin" | "professional";
export type PatientStatus = "active" | "inactive";
export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";
export type PaymentStatus = "paid" | "pending" | "cancelled" | "refunded";
export type PaymentMethod =
  | "dinheiro"
  | "multibanco"
  | "cartao"
  | "transferencia"
  | "outro";

export interface Clinic {
  id: string;
  name: string;
  nif: string | null;
  timezone: string;
  color_hex: string;
  active: boolean;
  created_at: string;
}

export interface UserProfile {
  id: string;
  clinic_id: string | null;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  active: boolean;
  created_at: string;
}

export interface Professional {
  id: string;
  user_id: string;
  clinic_id: string;
  specialty: string | null;
  license_number: string | null;
  color_hex: string;
  bio: string | null;
  active: boolean;
  created_at: string;
  users?: UserProfile;
}

export interface Room {
  id: string;
  clinic_id: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
}

export interface Patient {
  id: string;
  clinic_id: string;
  professional_id: string | null;
  full_name: string;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  status: PatientStatus;
  notes: string | null;
  registered_at: string;
  created_by: string | null;
  updated_at: string;
  professionals?: Pick<Professional, "id" | "color_hex"> & {
    users?: Pick<UserProfile, "full_name">;
  };
}

export interface ClinicalRecord {
  id: string;
  patient_id: string;
  motivo_consulta: string | null;
  objetivo_paciente: string | null;
  profissao: string | null;
  atividade_fisica: string | null;
  lesoes_anteriores: string | null;
  cirurgias: string | null;
  patologias: string | null;
  medicacao: string | null;
  alergias: string | null;
  antecedentes: string | null;
  red_flags: Record<string, boolean>;
  updated_by: string | null;
  updated_at: string;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  professional_id: string;
  room_id: string;
  starts_at: string;
  duration_min: number;
  type: string;
  status: AppointmentStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  patients?: Pick<Patient, "id" | "full_name">;
  professionals?: Professional;
  rooms?: Pick<Room, "id" | "name">;
  clinics?: Pick<Clinic, "id" | "name" | "color_hex">;
  payments?: Pick<Payment, "id" | "amount">[];
}

export interface Payment {
  id: string;
  appointment_id: string | null;
  patient_id: string | null;
  clinic_id: string | null;
  description: string | null;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod | null;
  paid_at: string | null;
  created_at: string;
}

export type SymptomType =
  | "dor"
  | "rigidez"
  | "limitacao_movimento"
  | "formigueiro"
  | "dormencia"
  | "fraqueza"
  | "outro";
export type PainType =
  | "dor"
  | "pressao"
  | "queimacao"
  | "formigueiro"
  | "dormencia"
  | "rigidez"
  | "outro";
export type PainFrequency = "constante" | "intermitente";
export type BodySide = "esquerdo" | "direito" | "bilateral" | "central";
export type BodyView = "anterior" | "posterior" | "lateral_esquerda" | "lateral_direita";

export interface Consultation {
  id: string;
  appointment_id: string;
  chief_complaint: string | null;
  session_notes: string | null;
  started_at: string;
  finished_at: string | null;
}

export interface Symptom {
  id: string;
  consultation_id: string;
  symptom_type: SymptomType;
  notes: string | null;
}

export interface PainAssessment {
  id: string;
  consultation_id: string;
  patient_id: string;
  body_view: BodyView;
  region: string;
  side: BodySide | null;
  x: number | null;
  y: number | null;
  intensity: number;
  pain_type: PainType | null;
  frequency: PainFrequency | null;
  context_tags: string[];
  observations: string | null;
  recorded_at: string;
}

export interface PhysicalAssessment {
  id: string;
  consultation_id: string;
  mobility: string | null;
  rom_notes: string | null;
  tests: Record<string, unknown>;
  asymmetry: string | null;
  limitations: string | null;
  custom_fields: Record<string, unknown>;
}

export interface TreatmentCatalogItem {
  id: string;
  clinic_id: string;
  name: string;
  category: string | null;
  active: boolean;
}

export interface TreatmentRecord {
  id: string;
  consultation_id: string;
  treatment_id: string | null;
  region: string | null;
  technique: string | null;
  observations: string | null;
  treatments_catalog?: Pick<TreatmentCatalogItem, "id" | "name"> | null;
}

export interface CarePlan {
  id: string;
  consultation_id: string;
  recommendations: string | null;
  home_care: string | null;
  education_notes: string | null;
  next_appointment_suggested_at: string | null;
}

// Placeholder genérico — mantém o createClient<Database> a compilar
// sem exigir todas as 21 tabelas tipadas à mão.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
