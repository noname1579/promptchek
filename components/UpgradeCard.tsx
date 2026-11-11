// components/UpgradeCard.tsx
"use client";

import Link from "next/link";
import { Zap, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  plan?: string;
  quotaLimit?: number;
}

export function UpgradeCard({ plan = "free", quotaLimit = 5 }: Props) {
  // Если у пользователя уже Pro, показываем статус
  if (plan === "pro" || plan === "pro_plus") {
    return (
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
        <div className="flex items-center gap-2 text-indigo-400 mb-2">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-semibold uppercase tracking-wider">Подписка активна</span>
        </div>
        <p className="text-sm text-slate-300">
          У вас тариф <strong className="text-white">{plan.toUpperCase()}</strong>. Лимит: {quotaLimit} запросов в день.
        </p>
      </div>
    );
  }

  // Если тариф Free, предлагаем обновиться
  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-5 shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
      {/* Декоративное свечение */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-all" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 text-amber-400 mb-3">
          <Zap className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">У вас тариф Free</span>
        </div>
        
        <h3 className="text-base font-semibold text-white mb-1">
          Улучшайте промпты без ограничений
        </h3>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Сейчас вам доступно <strong className="text-slate-200">{quotaLimit} запросов в день</strong>. Перейдите на Pro, чтобы получить 100 запросов, неограниченную историю и приоритетную скорость.
        </p>

        <Link
          href="/pricing"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:brightness-110 transition-all"
        >
          Улучшить тариф
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}