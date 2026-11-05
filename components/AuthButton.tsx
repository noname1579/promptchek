"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface AuthUser {
  email: string | null;
}

/**
 * Кнопка входа/выхода. Если Supabase не настроен — ничего не рендерит,
 * чтобы локальная разработка не требовала ключей.
 */
export function AuthButton() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  useEffect(() => {
    if (!configured) return;
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ? { email: data.user.email ?? null } : null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { email: session.user.email ?? null } : null);
    });

    return () => sub.subscription.unsubscribe();
  }, [configured]);

  const signIn = useCallback(async () => {
    if (!email.includes("@")) {
      setError("Введите корректный email");
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setSent(true);
  }, [email]);

  const signOut = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  if (!configured) return null;

  if (user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted">{user.email}</span>
        <button
          type="button"
          onClick={signOut}
          className="rounded-lg border border-line px-3 py-1.5 text-muted transition hover:border-muted hover:text-white"
        >
          Выйти
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted transition hover:border-muted hover:text-white"
      >
        Войти
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {sent ? (
        <p className="max-w-xs text-right text-sm text-good">
          Ссылка для входа отправлена на {email}
        </p>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-48 rounded-lg border border-line bg-ink-soft px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={signIn}
            disabled={busy}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-40"
          >
            {busy ? "…" : "Отправить"}
          </button>
        </div>
      )}
      {error && <p className="text-xs text-bad">{error}</p>}
    </div>
  );
}
