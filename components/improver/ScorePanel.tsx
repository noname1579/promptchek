// components/improver/ScorePanel.tsx
"use client";

import { Sparkles } from "lucide-react";
import type { ScoreResult } from "@/lib/types";

interface Props {
  scoreBefore: ScoreResult | null;
  scoreAfter: ScoreResult | null;
}

export function ScorePanel({ scoreBefore, scoreAfter }: Props) {
  if (!scoreBefore) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-sm text-slate-500 text-center flex flex-col items-center justify-center min-h-[200px]">
        <Sparkles className="w-8 h-8 text-slate-700 mb-3" /> Оценка появится здесь
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          {scoreAfter ? "Результат" : "Текущий промпт"}
        </span>
        <span className={`text-2xl font-bold ${scoreAfter ? 'text-emerald-400' : 'text-slate-200'}`}>
          {scoreAfter ? scoreAfter.score : scoreBefore.score}
          <span className="text-sm text-slate-500 font-normal">/100</span>
        </span>
      </div>
      
      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-5">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${scoreAfter ? 'bg-emerald-500' : 'bg-indigo-500'}`}
          style={{ width: `${scoreAfter ? scoreAfter.score : scoreBefore.score}%` }}
        />
      </div>

      <div className="space-y-2.5">
        {scoreBefore.criteria?.map((crit: any, idx: number) => {
          const isDone = scoreAfter
            ? scoreAfter.criteria?.find((c: any) => c.id === crit.id)?.passed
            : crit.passed;

          return (
            <div key={idx} className="flex items-start gap-3 text-sm">
              <div
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  isDone
                    ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
                    : "border-slate-700 bg-slate-800/50 text-transparent"
                }`}
              >
                <svg viewBox="0 0 14 14" fill="none" className={`h-3 w-3 ${isDone ? 'opacity-100' : 'opacity-0'}`}>
                  <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className={`leading-snug ${isDone ? "text-slate-300" : "text-slate-500"}`}>
                {crit.label || crit.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}