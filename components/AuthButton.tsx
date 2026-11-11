"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { LogIn, LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Проверяем текущую сессию
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Слушаем изменения (вход/выход)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        router.refresh(); // Обновляем серверные компоненты
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (loading) {
    return <div className="w-20 h-8 bg-slate-800 animate-pulse rounded-lg" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
      >
        <LogIn className="w-4 h-4" />
        Войти
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700">
        <UserIcon className="w-4 h-4 text-indigo-400" />
        <span className="text-sm text-slate-200">{user.email?.split("@")[0]}</span>
      </div>
      <button
        onClick={handleLogout}
        className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/50 transition-colors"
        title="Выйти"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}