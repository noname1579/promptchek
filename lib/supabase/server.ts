import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Серверный клиент Supabase (App Router).
 * Читает сессию из cookies, поэтому работает в route handlers и server components.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Вызов из server component — запись cookies недоступна, это нормально.
          }
        },
      },
    },
  );
}

/**
 * Клиент с service role: обходит RLS.
 * Только для серверного кода — никогда не импортировать в клиентские компоненты.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase не настроен: задайте NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createServerClient(url, key, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}
