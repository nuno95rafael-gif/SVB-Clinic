-- Corrige os avisos do linter de segurança (mcp get_advisors) após a 0001

-- 1) função sem search_path fixo
alter function public.set_appointment_time_range() set search_path = public;

-- 2) extensão instalada em public -> mover para schema dedicado
create schema if not exists extensions;
alter extension btree_gist set schema extensions;

-- 3) funções internas (só usadas por triggers, nunca chamadas pela app)
--    não devem ficar expostas como RPC via PostgREST
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.log_audit() from anon, authenticated, public;

-- 4) helpers usados dentro das políticas RLS: o grant por omissão vive em
--    PUBLIC, por isso é preciso revogar de PUBLIC e conceder só a
--    authenticated (é assim que o RLS os invoca) — só revelam informação
--    sobre o próprio utilizador, por isso não há fuga de dados; o anon
--    não tem uso legítimo para eles.
revoke execute on function public.is_admin() from public;
revoke execute on function public.my_professional_id() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.my_professional_id() to authenticated;
