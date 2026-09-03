import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente com a service role key — só usado em Server Actions/Route Handlers,
// nunca importado por código que corre no browser. Necessário para convidar
// utilizadores (auth.admin.*), que a anon key não pode fazer.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
