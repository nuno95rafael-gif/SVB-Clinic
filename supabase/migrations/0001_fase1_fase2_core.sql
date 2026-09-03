-- =========================================================================
-- SVB Clinic — Migração 0001: Core (Fase 1) + Clínica (Fase 2)
-- =========================================================================
-- Extensões necessárias
create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- =========================================================================
-- 1. CLINICS  — preparado para multi-clínica desde o dia 1
-- =========================================================================
create table public.clinics (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  nif         text,
  timezone    text not null default 'Europe/Lisbon',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- =========================================================================
-- 2. USERS  — perfil ligado a auth.users (identidade + papel)
-- =========================================================================
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  clinic_id   uuid references public.clinics(id),
  email       text not null,
  full_name   text not null,
  role        text not null check (role in ('admin','professional')) default 'professional',
  phone       text,
  avatar_url  text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Cria automaticamente o perfil em public.users quando alguém regista em auth.users
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'professional')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- 3. PROFESSIONALS
-- =========================================================================
create table public.professionals (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  clinic_id       uuid not null references public.clinics(id),
  specialty       text,
  license_number  text,
  color_hex       text not null default '#0d7a68',
  bio             text,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  unique(user_id)
);

-- =========================================================================
-- 4. ROOMS (espaços)
-- =========================================================================
create table public.rooms (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinics(id),
  name        text not null,
  description text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- =========================================================================
-- 5. PATIENTS
-- =========================================================================
create table public.patients (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references public.clinics(id),
  professional_id uuid references public.professionals(id),
  full_name       text not null,
  birth_date      date,
  phone           text,
  email           text,
  avatar_url      text,
  status          text not null check (status in ('active','inactive')) default 'active',
  notes           text,
  registered_at   timestamptz not null default now(),
  created_by      uuid references public.users(id),
  updated_at      timestamptz not null default now()
);

-- =========================================================================
-- 6. CLINICAL_RECORDS  (história clínica — 1:1 com paciente)
-- =========================================================================
create table public.clinical_records (
  id                  uuid primary key default gen_random_uuid(),
  patient_id          uuid not null unique references public.patients(id) on delete cascade,
  motivo_consulta     text,
  objetivo_paciente   text,
  profissao           text,
  atividade_fisica    text,
  lesoes_anteriores   text,
  cirurgias           text,
  patologias          text,
  medicacao           text,
  alergias            text,
  antecedentes        text,
  red_flags           jsonb not null default '{}'::jsonb,
  updated_by          uuid references public.users(id),
  updated_at          timestamptz not null default now()
);

-- =========================================================================
-- 7. APPOINTMENTS  — com proteção anti-conflito na própria BD
-- =========================================================================
create table public.appointments (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references public.clinics(id),
  patient_id      uuid not null references public.patients(id),
  professional_id uuid not null references public.professionals(id),
  room_id         uuid not null references public.rooms(id),
  starts_at       timestamptz not null,
  duration_min    int not null default 45 check (duration_min > 0),
  type            text not null default 'consulta',
  status          text not null default 'scheduled'
                    check (status in ('scheduled','confirmed','in_progress','completed','cancelled','no_show')),
  notes           text,
  created_by      uuid references public.users(id),
  created_at      timestamptz not null default now(),
  time_range      tstzrange
);

-- time_range não pode ser uma coluna gerada (STORED) porque a soma de
-- timestamptz + interval é STABLE, não IMMUTABLE, em Postgres. Em vez disso,
-- é calculada por trigger — continua a não poder ser manipulada pelo cliente.
create or replace function public.set_appointment_time_range()
returns trigger language plpgsql as $$
begin
  new.time_range := tstzrange(new.starts_at, new.starts_at + (new.duration_min || ' minutes')::interval, '[)');
  return new;
end;
$$;

create trigger appointments_set_time_range
  before insert or update on public.appointments
  for each row execute function public.set_appointment_time_range();

-- Um profissional não pode ter duas consultas em simultâneo (exceto canceladas)
alter table public.appointments
  add constraint no_overlap_professional
  exclude using gist (professional_id with =, time_range with &&)
  where (status not in ('cancelled','no_show'));

-- Uma sala não pode ter duas consultas em simultâneo (exceto canceladas)
alter table public.appointments
  add constraint no_overlap_room
  exclude using gist (room_id with =, time_range with &&)
  where (status not in ('cancelled','no_show'));

create index idx_appointments_professional on public.appointments(professional_id, starts_at);
create index idx_appointments_patient on public.appointments(patient_id, starts_at);
create index idx_appointments_room on public.appointments(room_id, starts_at);

-- =========================================================================
-- 8. CONSULTATIONS  (registo clínico de uma consulta realizada)
-- =========================================================================
create table public.consultations (
  id              uuid primary key default gen_random_uuid(),
  appointment_id  uuid not null unique references public.appointments(id) on delete cascade,
  chief_complaint text,
  session_notes   text,
  started_at      timestamptz not null default now(),
  finished_at     timestamptz
);

-- =========================================================================
-- 9. SYMPTOMS
-- =========================================================================
create table public.symptoms (
  id              uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  symptom_type    text not null check (symptom_type in
                    ('dor','rigidez','limitacao_movimento','formigueiro','dormencia','fraqueza','outro')),
  notes           text
);

-- =========================================================================
-- 10. PAIN_ASSESSMENTS  — núcleo do mapa corporal + evolução da dor
-- =========================================================================
create table public.pain_assessments (
  id              uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  patient_id      uuid not null references public.patients(id),
  body_view       text not null check (body_view in ('anterior','posterior','lateral_esquerda','lateral_direita')),
  region          text not null,
  side            text check (side in ('esquerdo','direito','bilateral','central')),
  x               numeric(5,4),
  y               numeric(5,4),
  intensity       int not null check (intensity between 0 and 10),
  pain_type       text check (pain_type in ('dor','pressao','queimacao','formigueiro','dormencia','rigidez','outro')),
  frequency       text check (frequency in ('constante','intermitente')),
  context_tags    jsonb not null default '[]'::jsonb,
  observations    text,
  recorded_at     timestamptz not null default now()
);

create index idx_pain_patient_region on public.pain_assessments(patient_id, region, recorded_at);

-- =========================================================================
-- 11. PHYSICAL_ASSESSMENTS
-- =========================================================================
create table public.physical_assessments (
  id              uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  mobility        text,
  rom_notes       text,
  tests           jsonb not null default '{}'::jsonb,
  asymmetry       text,
  limitations     text,
  custom_fields   jsonb not null default '{}'::jsonb
);

-- =========================================================================
-- 12. TREATMENTS_CATALOG + TREATMENT_RECORDS
-- =========================================================================
create table public.treatments_catalog (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinics(id),
  name        text not null,
  category    text,
  active      boolean not null default true
);

create table public.treatment_records (
  id              uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  treatment_id    uuid references public.treatments_catalog(id),
  region          text,
  technique       text,
  observations    text
);

-- =========================================================================
-- 13. CARE_PLANS + EXERCISE_LIBRARY
-- =========================================================================
create table public.care_plans (
  id                          uuid primary key default gen_random_uuid(),
  consultation_id             uuid not null unique references public.consultations(id) on delete cascade,
  recommendations             text,
  home_care                   text,
  education_notes             text,
  next_appointment_suggested_at date
);

create table public.exercise_library (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinics(id),
  name        text not null,
  description text,
  media_url   text,
  category    text
);

create table public.care_plan_exercises (
  care_plan_id uuid not null references public.care_plans(id) on delete cascade,
  exercise_id  uuid not null references public.exercise_library(id) on delete cascade,
  sets_reps    text,
  notes        text,
  primary key (care_plan_id, exercise_id)
);

-- =========================================================================
-- 14. PAYMENTS
-- =========================================================================
create table public.payments (
  id             uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id),
  patient_id     uuid not null references public.patients(id),
  amount         numeric(10,2) not null,
  status         text not null default 'pending' check (status in ('paid','pending','cancelled','refunded')),
  method         text check (method in ('dinheiro','multibanco','cartao','transferencia','outro')),
  paid_at        timestamptz,
  created_at     timestamptz not null default now()
);

-- =========================================================================
-- 15. DOCUMENTS
-- =========================================================================
create table public.documents (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references public.patients(id) on delete cascade,
  type        text,
  file_url    text not null,
  uploaded_by uuid references public.users(id),
  uploaded_at timestamptz not null default now()
);

-- =========================================================================
-- 16. CONSENT_RECORDS  — exigido por ser dado de saúde (RGPD Art. 9º)
-- =========================================================================
create table public.consent_records (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references public.patients(id) on delete cascade,
  type          text not null,
  granted_at    timestamptz not null default now(),
  revoked_at    timestamptz,
  document_url  text
);

-- =========================================================================
-- 17. AUDIT_LOGS
-- =========================================================================
create table public.audit_logs (
  id              uuid primary key default gen_random_uuid(),
  actor_user_id   uuid references public.users(id),
  action          text not null,
  entity_type     text not null,
  entity_id       uuid,
  diff            jsonb,
  occurred_at     timestamptz not null default now()
);

create or replace function public.log_audit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, diff)
  values (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    coalesce(new.id, old.id),
    case
      when TG_OP = 'INSERT' then jsonb_build_object('new', to_jsonb(new))
      when TG_OP = 'UPDATE' then jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new))
      when TG_OP = 'DELETE' then jsonb_build_object('old', to_jsonb(old))
    end
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_patients after insert or update or delete on public.patients
  for each row execute function public.log_audit();
create trigger audit_clinical_records after insert or update or delete on public.clinical_records
  for each row execute function public.log_audit();
create trigger audit_appointments after insert or update or delete on public.appointments
  for each row execute function public.log_audit();
create trigger audit_consultations after insert or update or delete on public.consultations
  for each row execute function public.log_audit();
create trigger audit_payments after insert or update or delete on public.payments
  for each row execute function public.log_audit();

-- =========================================================================
-- 18. NOTIFICATIONS
-- =========================================================================
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  type        text not null,
  payload     jsonb not null default '{}'::jsonb,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- =========================================================================
-- 19. FUNÇÕES AUXILIARES DE AUTORIZAÇÃO (usadas pelas policies RLS)
-- =========================================================================
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users u where u.id = auth.uid() and u.role = 'admin' and u.active
  );
$$;

create or replace function public.my_professional_id()
returns uuid language sql stable security definer set search_path = public as $$
  select p.id from public.professionals p where p.user_id = auth.uid();
$$;

-- =========================================================================
-- 20. ROW LEVEL SECURITY
-- =========================================================================
alter table public.clinics enable row level security;
alter table public.users enable row level security;
alter table public.professionals enable row level security;
alter table public.rooms enable row level security;
alter table public.patients enable row level security;
alter table public.clinical_records enable row level security;
alter table public.appointments enable row level security;
alter table public.consultations enable row level security;
alter table public.symptoms enable row level security;
alter table public.pain_assessments enable row level security;
alter table public.physical_assessments enable row level security;
alter table public.treatments_catalog enable row level security;
alter table public.treatment_records enable row level security;
alter table public.care_plans enable row level security;
alter table public.exercise_library enable row level security;
alter table public.care_plan_exercises enable row level security;
alter table public.payments enable row level security;
alter table public.documents enable row level security;
alter table public.consent_records enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;

-- Utilizador autenticado consegue sempre ler/atualizar o seu próprio perfil
create policy users_self_select on public.users for select using (id = auth.uid() or is_admin());
create policy users_self_update on public.users for update using (id = auth.uid() or is_admin());
create policy users_admin_all on public.users for insert with check (is_admin());
create policy users_admin_delete on public.users for delete using (is_admin());

create policy clinics_read on public.clinics for select using (true);
create policy clinics_admin_write on public.clinics for all using (is_admin()) with check (is_admin());

create policy professionals_read on public.professionals for select using (true);
create policy professionals_admin_write on public.professionals for insert with check (is_admin());
create policy professionals_admin_update on public.professionals for update using (is_admin() or user_id = auth.uid());
create policy professionals_admin_delete on public.professionals for delete using (is_admin());

create policy rooms_read on public.rooms for select using (true);
create policy rooms_admin_write on public.rooms for all using (is_admin()) with check (is_admin());

create policy patients_select on public.patients for select
  using (is_admin() or professional_id = my_professional_id());
create policy patients_insert on public.patients for insert
  with check (is_admin() or professional_id = my_professional_id());
create policy patients_update on public.patients for update
  using (is_admin() or professional_id = my_professional_id());
create policy patients_delete on public.patients for delete using (is_admin());

create policy clinical_records_all on public.clinical_records for all
  using (is_admin() or exists (
    select 1 from public.patients pt where pt.id = clinical_records.patient_id
    and pt.professional_id = my_professional_id()
  ))
  with check (is_admin() or exists (
    select 1 from public.patients pt where pt.id = clinical_records.patient_id
    and pt.professional_id = my_professional_id()
  ));

create policy appointments_select on public.appointments for select
  using (is_admin() or professional_id = my_professional_id());
create policy appointments_insert on public.appointments for insert
  with check (is_admin() or professional_id = my_professional_id());
create policy appointments_update on public.appointments for update
  using (is_admin() or professional_id = my_professional_id());
create policy appointments_delete on public.appointments for delete
  using (is_admin() or professional_id = my_professional_id());

create policy consultations_all on public.consultations for all
  using (is_admin() or exists (
    select 1 from public.appointments a where a.id = consultations.appointment_id
    and a.professional_id = my_professional_id()
  ))
  with check (is_admin() or exists (
    select 1 from public.appointments a where a.id = consultations.appointment_id
    and a.professional_id = my_professional_id()
  ));

create policy symptoms_all on public.symptoms for all
  using (is_admin() or exists (
    select 1 from public.consultations c join public.appointments a on a.id = c.appointment_id
    where c.id = symptoms.consultation_id and a.professional_id = my_professional_id()
  ))
  with check (is_admin() or exists (
    select 1 from public.consultations c join public.appointments a on a.id = c.appointment_id
    where c.id = symptoms.consultation_id and a.professional_id = my_professional_id()
  ));

create policy pain_assessments_all on public.pain_assessments for all
  using (is_admin() or exists (
    select 1 from public.patients pt where pt.id = pain_assessments.patient_id
    and pt.professional_id = my_professional_id()
  ))
  with check (is_admin() or exists (
    select 1 from public.patients pt where pt.id = pain_assessments.patient_id
    and pt.professional_id = my_professional_id()
  ));

create policy physical_assessments_all on public.physical_assessments for all
  using (is_admin() or exists (
    select 1 from public.consultations c join public.appointments a on a.id = c.appointment_id
    where c.id = physical_assessments.consultation_id and a.professional_id = my_professional_id()
  ))
  with check (is_admin() or exists (
    select 1 from public.consultations c join public.appointments a on a.id = c.appointment_id
    where c.id = physical_assessments.consultation_id and a.professional_id = my_professional_id()
  ));

create policy treatments_catalog_read on public.treatments_catalog for select using (true);
create policy treatments_catalog_admin_write on public.treatments_catalog for all
  using (is_admin()) with check (is_admin());

create policy treatment_records_all on public.treatment_records for all
  using (is_admin() or exists (
    select 1 from public.consultations c join public.appointments a on a.id = c.appointment_id
    where c.id = treatment_records.consultation_id and a.professional_id = my_professional_id()
  ))
  with check (is_admin() or exists (
    select 1 from public.consultations c join public.appointments a on a.id = c.appointment_id
    where c.id = treatment_records.consultation_id and a.professional_id = my_professional_id()
  ));

create policy care_plans_all on public.care_plans for all
  using (is_admin() or exists (
    select 1 from public.consultations c join public.appointments a on a.id = c.appointment_id
    where c.id = care_plans.consultation_id and a.professional_id = my_professional_id()
  ))
  with check (is_admin() or exists (
    select 1 from public.consultations c join public.appointments a on a.id = c.appointment_id
    where c.id = care_plans.consultation_id and a.professional_id = my_professional_id()
  ));

create policy exercise_library_read on public.exercise_library for select using (true);
create policy exercise_library_admin_write on public.exercise_library for all
  using (is_admin()) with check (is_admin());

create policy care_plan_exercises_read on public.care_plan_exercises for select using (true);
create policy care_plan_exercises_write on public.care_plan_exercises for all
  using (is_admin()) with check (is_admin());

create policy payments_select on public.payments for select
  using (is_admin() or exists (
    select 1 from public.patients pt where pt.id = payments.patient_id
    and pt.professional_id = my_professional_id()
  ));
create policy payments_admin_write on public.payments for insert with check (is_admin());
create policy payments_admin_update on public.payments for update using (is_admin());
create policy payments_admin_delete on public.payments for delete using (is_admin());

create policy documents_all on public.documents for all
  using (is_admin() or exists (
    select 1 from public.patients pt where pt.id = documents.patient_id
    and pt.professional_id = my_professional_id()
  ))
  with check (is_admin() or exists (
    select 1 from public.patients pt where pt.id = documents.patient_id
    and pt.professional_id = my_professional_id()
  ));

create policy consent_records_all on public.consent_records for all
  using (is_admin() or exists (
    select 1 from public.patients pt where pt.id = consent_records.patient_id
    and pt.professional_id = my_professional_id()
  ))
  with check (is_admin() or exists (
    select 1 from public.patients pt where pt.id = consent_records.patient_id
    and pt.professional_id = my_professional_id()
  ));

create policy audit_logs_admin_read on public.audit_logs for select using (is_admin());

create policy notifications_own on public.notifications for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =========================================================================
-- 21. Seed mínimo — clínica única + salas de exemplo (ajustável em Definições)
-- =========================================================================
insert into public.clinics (name, timezone) values ('SVB Clinic', 'Europe/Lisbon');
