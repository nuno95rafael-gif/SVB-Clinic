import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

// Cliente Supabase para Client Components (browser).
// Usa a anon key — a segurança real vem do RLS na base de dados, não desta chave.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
