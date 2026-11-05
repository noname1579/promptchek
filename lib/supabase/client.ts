import { createBrowserClient } from "@supabase/ssr";

/**
 * Браузерный клиент Supabase — для входа/выхода и чтения сессии в UI.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
