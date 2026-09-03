-- Corrige avisos de performance do linter (mcp get_advisors, categoria performance)

-- 1) auth.uid() reavaliado por linha -> envolver em (select auth.uid())
--    para o planeador o tratar como initplan único por query
drop policy users_self_select on public.users;
create policy users_self_select on public.users for select
  using (id = (select auth.uid()) or is_admin());

drop policy users_self_update on public.users;
create policy users_self_update on public.users for update
  using (id = (select auth.uid()) or is_admin());

drop policy professionals_admin_update on public.professionals;
create policy professionals_admin_update on public.professionals for update
  using (is_admin() or user_id = (select auth.uid()));

drop policy notifications_own on public.notifications;
create policy notifications_own on public.notifications for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- 2) políticas "for all" que se sobrepunham a uma política "for select"
--    já existente (leitura aberta) -> restringir aos comandos de escrita
drop policy clinics_admin_write on public.clinics;
create policy clinics_admin_insert on public.clinics for insert with check (is_admin());
create policy clinics_admin_update on public.clinics for update using (is_admin());
create policy clinics_admin_delete on public.clinics for delete using (is_admin());

drop policy rooms_admin_write on public.rooms;
create policy rooms_admin_insert on public.rooms for insert with check (is_admin());
create policy rooms_admin_update on public.rooms for update using (is_admin());
create policy rooms_admin_delete on public.rooms for delete using (is_admin());

drop policy exercise_library_admin_write on public.exercise_library;
create policy exercise_library_admin_insert on public.exercise_library for insert with check (is_admin());
create policy exercise_library_admin_update on public.exercise_library for update using (is_admin());
create policy exercise_library_admin_delete on public.exercise_library for delete using (is_admin());

drop policy treatments_catalog_admin_write on public.treatments_catalog;
create policy treatments_catalog_admin_insert on public.treatments_catalog for insert with check (is_admin());
create policy treatments_catalog_admin_update on public.treatments_catalog for update using (is_admin());
create policy treatments_catalog_admin_delete on public.treatments_catalog for delete using (is_admin());

drop policy care_plan_exercises_write on public.care_plan_exercises;
create policy care_plan_exercises_admin_insert on public.care_plan_exercises for insert with check (is_admin());
create policy care_plan_exercises_admin_update on public.care_plan_exercises for update using (is_admin());
create policy care_plan_exercises_admin_delete on public.care_plan_exercises for delete using (is_admin());

-- Nota: fica por resolver, intencionalmente, o aviso "unindexed foreign keys"
-- (nível INFO) em tabelas ainda sem dados — revisitar quando houver volume
-- real de utilização (ver Fase 3, Estatísticas).
