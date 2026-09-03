-- =========================================================================
-- Migração 0004: pagamentos ao nível da clínica/empresa
-- =========================================================================
-- O negócio fatura tanto por paciente (sessão individual) como por empresa
-- (contrato de osteomassagem nas empresas) — payments passa a aceitar as
-- duas formas, mantendo a exigência de que exista sempre pelo menos uma.

alter table public.payments
  alter column patient_id drop not null,
  add column clinic_id uuid references public.clinics(id),
  add column description text;

alter table public.payments
  add constraint payments_patient_or_clinic
  check (patient_id is not null or clinic_id is not null);

-- Leitura de pagamentos de empresa (sem paciente) fica reservada ao admin —
-- a policy já existente cobre isto (is_admin() ou associação via paciente).
