// components/QuotaBadge.tsx
"use client";

import { Zap, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useQuota } from "@/context/QuotaProvider";

export function QuotaBadge() {
  const { quota, loading } = useQuota();

  if (loading || !quota) {
    return <div className="w-20 h-8 bg-slate-800 animate-pulse rounded-lg" />;
  }

  const isCritical = quota.remaining <= 1;
  const isEmpty = quota.remaining === 0;

  return (
    <Link 
      href={isEmpty ? "/pricing" : "#"}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all",
        isEmpty 
          ? "border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
          : isCritical
            ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
            : "border-slate-800 bg-slate-900/50 text-slate-300"
      )}
      title={isEmpty ? "Купить Pro" : "Осталось запросов на сегодня"}
    >
      {isEmpty ? <AlertTriangle className="w-4 h-4" /> : <Zap className="w-4 h-4 text-indigo-400" />}
      <span>{quota.remaining} / {quota.limit}</span>
    </Link>
  );
}