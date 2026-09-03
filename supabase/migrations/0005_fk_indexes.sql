-- =========================================================================
-- Migração 0005: índices em chaves estrangeiras
-- =========================================================================
-- O linter do Supabase assinalou 24 FKs sem índice de cobertura. Como quase
-- todas as políticas RLS e as queries da app filtram por clinic_id,
-- patient_id, professional_id ou consultation_id, isto obriga a sequential
-- scans em cada pedido — cresce mal à medida que a base de dados cresce.

create index if not exists idx_appointments_clinic on public.appointments(clinic_id);
create index if not exists idx_appointments_created_by on public.appointments(created_by);

create index if not exists idx_audit_logs_actor on public.audit_logs(actor_user_id);

create index if not exists idx_care_plan_exercises_exercise on public.care_plan_exercises(exercise_id);

create index if not exists idx_clinical_records_updated_by on public.clinical_records(updated_by);

create index if not exists idx_consent_records_patient on public.consent_records(patient_id);

create index if not exists idx_documents_patient on public.documents(patient_id);
create index if not exists idx_documents_uploaded_by on public.documents(uploaded_by);

create index if not exists idx_exercise_library_clinic on public.exercise_library(clinic_id);

create index if not exists idx_notifications_user on public.notifications(user_id);

create index if not exists idx_pain_assessments_consultation on public.pain_assessments(consultation_id);

create index if not exists idx_patients_clinic on public.patients(clinic_id);
create index if not exists idx_patients_created_by on public.patients(created_by);
create index if not exists idx_patients_professional on public.patients(professional_id);

create index if not exists idx_payments_appointment on public.payments(appointment_id);
create index if not exists idx_payments_clinic on public.payments(clinic_id);
create index if not exists idx_payments_patient on public.payments(patient_id);

create index if not exists idx_physical_assessments_consultation on public.physical_assessments(consultation_id);

create index if not exists idx_professionals_clinic on public.professionals(clinic_id);

create index if not exists idx_rooms_clinic on public.rooms(clinic_id);

create index if not exists idx_symptoms_consultation on public.symptoms(consultation_id);

create index if not exists idx_treatment_records_consultation on public.treatment_records(consultation_id);
create index if not exists idx_treatment_records_treatment on public.treatment_records(treatment_id);

create index if not exists idx_treatments_catalog_clinic on public.treatments_catalog(clinic_id);

create index if not exists idx_users_clinic on public.users(clinic_id);
