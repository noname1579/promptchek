// components/improver/PromptInput.tsx
"use client";

import { RefreshCw, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { MODE_LABELS, MODE_HINTS } from "@/lib/modes";
import type { PromptMode } from "@/lib/types";
import { cn } from "@/lib/utils";

const MODES: PromptMode[] = ["general", "code", "agent", "system"];
const EXAMPLES: Record<PromptMode, string> = {
  general: "напиши функцию на js которая валидирует email",
  code: "сделай компонент React для кнопки с лоадером, используя Tailwind и TypeScript",
  agent: "проанализируй папку с логами, найди ошибки 500 и предложи план исправления",
  system: "напиши системный промпт для AI-ассистента, который помогает писать SQL запросы, но не знает схемы БД",
};

interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  disabled?: boolean;
}

interface Props {
  prompt: string;
  setPrompt: (v: string) => void;
  mode: PromptMode;
  setMode: (v: PromptMode) => void;
  isRunning: boolean;
  quota: QuotaInfo | null;
  run: () => void;
}

export function PromptInput({ prompt, setPrompt, mode, setMode, isRunning, quota, run }: Props) {
  const isLimitReached = quota?.remaining === 0;

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-wrap sm:flex-nowrap gap-2 overflow-x-auto scrollbar-thin pb-1 -mx-1 px-1">
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            title={MODE_HINTS[m]}
            className={cn(
              "shrink-0 rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200",
              mode === m
                ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            )}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl overflow-hidden focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Вставьте промпт, который хотите улучшить…"
          rows={6}
          maxLength={8000}
          className="w-full resize-y bg-transparent p-4 sm:p-5 font-mono text-sm leading-relaxed text-slate-200 outline-none placeholder:text-slate-600"
        />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80 bg-slate-950/30 px-4 py-3">
          <button
            onClick={() => setPrompt(EXAMPLES[mode])}
            className="text-xs font-medium text-slate-500 hover:text-indigo-400 transition-colors flex items-center justify-center sm:justify-start gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> 
            Пример ({MODE_LABELS[mode]})
          </button>
          
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              {quota && !quota.disabled && (
                <span
                  className={cn(
                    "text-[11px] sm:text-xs font-medium px-2 py-1 rounded-md bg-slate-800/50",
                    quota.remaining === 0 ? "text-rose-400" : "text-slate-400"
                  )}
                >
                  Осталось: {quota.remaining}
                </span>
              )}
              <span className="text-[11px] sm:text-xs text-slate-600 font-mono">{prompt.length}/8000</span>
            </div>
            
            {/* Если лимит исчерпан, показываем кнопку "Купить Pro" вместо "Улучшить" */}
            {isLimitReached ? (
              <Link
                href="/pricing"
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:brightness-110 flex items-center gap-2 min-h-[40px]"
              >
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Купить Pro</span>
              </Link>
            ) : (
              <button
                onClick={run}
                disabled={isRunning || prompt.trim().length < 10}
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2 min-h-[40px]"
              >
                {isRunning ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> <span className="hidden sm:inline">Улучшаю…</span></>
                ) : (
                  <><Sparkles className="w-4 h-4" /> <span className="hidden sm:inline">Улучшить</span></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}