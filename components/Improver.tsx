"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { scorePrompt } from "@/lib/scoring";
import { MODE_HINTS, MODE_LABELS } from "@/lib/modes";
import type { PromptMode, ScoreResult } from "@/lib/types";
import { Share2, Sparkles, Copy, Check, Square, RefreshCw, Zap } from "lucide-react";
import { trackEvent } from "@/lib/analytics-client";
import { cn } from "@/lib/utils";

const MODES: PromptMode[] = ["general", "code", "agent", "system"];

// Умные примеры для каждого режима
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

export function Improver() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<PromptMode>("general");
  const [improved, setImproved] = useState("");
  const [scoreBefore, setScoreBefore] = useState<ScoreResult | null>(null);
  const [scoreAfter, setScoreAfter] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [history, setHistory] = useState<Array<{
    prompt: string;
    improved: string;
    scoreBefore: ScoreResult;
    scoreAfter: ScoreResult;
    mode: PromptMode;
    ts: number;
  }>>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = prompt.trim();
    if (trimmed.length >= 10) {
      setScoreBefore(scorePrompt(trimmed, mode));
    } else {
      setScoreBefore(null);
    }
  }, [prompt, mode]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("promptchek_history");
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  const saveToHistory = (entry: Omit<typeof history[0], "ts">) => {
    const newEntry = { ...entry, ts: Date.now() };
    const updated = [newEntry, ...history].slice(0, 5);
    setHistory(updated);
    try { localStorage.setItem("promptchek_history", JSON.stringify(updated)); } catch {}
  };

  const run = useCallback(async () => {
    if (isRunning || prompt.trim().length < 10 || quota?.remaining === 0) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsRunning(true);
    setIsStreaming(true);
    setError(null);
    setImproved("");
    setScoreAfter(null);
    setCopied(false);

    try {
      const response = await fetch("/api/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, mode }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => null);
        if (data?.quota) setQuota(data.quota);
        throw new Error(data?.error ?? `Ошибка ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const raw of events) {
          const lines = raw.split("\n");
          const eventLine = lines.find((line) => line.startsWith("event:"));
          const dataLines = lines.filter((line) => line.startsWith("data:"));
          if (!eventLine || dataLines.length === 0) continue;

          const event = eventLine.slice(6).trim();
          const payload = dataLines.map((l) => l.slice(5).trim()).join("\n");
          let data: Record<string, unknown>;
          try { data = JSON.parse(payload); } catch { continue; }

          if (event === "score") {
            if (data.quota) setQuota(data.quota as QuotaInfo);
          } else if (event === "delta") {
            setImproved((prev) => prev + (data.text as string));
          } else if (event === "done") {
            setScoreAfter(data.scoreAfter as ScoreResult);
            if (data.quota) setQuota(data.quota as QuotaInfo);
            if (scoreBefore && data.scoreAfter) {
              saveToHistory({ prompt, improved: "", scoreBefore, scoreAfter: data.scoreAfter as ScoreResult, mode });
            }
            trackEvent("prompt_generated", { category: mode, scoreBefore: scoreBefore?.score, scoreAfter: (data.scoreAfter as ScoreResult).score });
          } else if (event === "error") {
            setError(data.message as string);
          }
        }
      }

      if (scoreBefore && scoreAfter) {
        saveToHistory({ prompt, improved, scoreBefore, scoreAfter, mode });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setIsRunning(false);
      setIsStreaming(false);
    }
  }, [isRunning, mode, prompt, improved, scoreBefore, scoreAfter, quota]);

  const copy = async () => {
    await navigator.clipboard.writeText(improved);
    setCopied(true);
    trackEvent("prompt_copied", { source: "builder" });
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (!improved) return;
    try {
      const res = await fetch("/api/share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Improved Prompt", prompt: improved, mode }) });
      const data = await res.json();
      if (data.url) {
        await navigator.clipboard.writeText(data.url);
        setShareLink(data.url);
        trackEvent("share_link_created", { mode });
        setTimeout(() => setShareLink(null), 2000);
      }
    } catch {}
  };

  const getFriendlyError = (raw: string) => {
    if (/LLM|API_KEY|configured|key/i.test(raw)) return "Улучшение недоступно: добавьте GIGACHAT_AUTH_KEY в .env.local и перезапустите сервер.";
    return raw;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        {/* Переключатель режимов */}
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              title={MODE_HINTS[m]}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200",
                mode === m
                  ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                  : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              )}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        {/* Инпут */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl overflow-hidden focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Вставьте промпт, который хотите улучшить…"
            rows={6}
            maxLength={8000}
            className="w-full resize-y bg-transparent p-5 font-mono text-sm leading-relaxed text-slate-200 outline-none placeholder:text-slate-600"
          />
          <div className="flex items-center justify-between gap-3 border-t border-slate-800/80 bg-slate-950/30 px-4 py-3">
            <button
              type="button"
              onClick={() => setPrompt(EXAMPLES[mode])}
              className="text-xs font-medium text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Вставить пример ({MODE_LABELS[mode]})
            </button>
            <div className="flex items-center gap-3">
              {quota && !quota.disabled && (
                <span className={cn("text-xs font-medium px-2 py-1 rounded-md bg-slate-800/50", quota.remaining === 0 ? "text-rose-400" : "text-slate-400")}>
                  Осталось: {quota.remaining}
                </span>
              )}
              <span className="text-xs text-slate-600 font-mono">{prompt.length}/8000</span>
              <button
                type="button"
                onClick={run}
                disabled={isRunning || prompt.trim().length < 10 || quota?.remaining === 0}
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2"
              >
                {quota?.remaining === 0 ? (
                  <>Лимит исчерпан</>
                ) : isRunning ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Улучшаю…</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Улучшить</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 flex items-start justify-between gap-3 animate-slide-up">
            <span>{getFriendlyError(error)}</span>
            <button type="button" onClick={() => setError(null)} className="text-rose-400 opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Уведомление о лимите */}
        {quota?.remaining === 0 && !error && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300 flex items-center gap-2 animate-slide-up">
            <span>Вы использовали все {quota.limit} бесплатных запросов на сегодня. Лимит обновится через 24 часа.</span>
          </div>
        )}

        {/* Результат */}
        {(improved || isRunning) && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl overflow-hidden animate-fade-in shadow-2xl shadow-indigo-500/5">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3 bg-slate-950/30">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" /> Результат
              </span>
              <div className="flex items-center gap-3">
                <button onClick={copy} disabled={!improved} className="text-xs font-medium text-slate-400 hover:text-white disabled:opacity-40 transition-colors flex items-center gap-1.5">
                  {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Скопировано</> : <><Copy className="w-3.5 h-3.5" /> Копировать</>}
                </button>
                <button onClick={share} disabled={!improved} className="text-xs font-medium text-slate-400 hover:text-white disabled:opacity-40 transition-colors flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" /> {shareLink ? "Ссылка!" : "Поделиться"}
                </button>
                {isStreaming && (
                  <button onClick={() => abortRef.current?.abort()} className="text-xs font-medium text-rose-400 hover:text-rose-300 flex items-center gap-1.5">
                    <Square className="w-3.5 h-3.5" /> Стоп
                  </button>
                )}
              </div>
            </div>
            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap p-5 font-mono text-sm leading-relaxed text-slate-200 scrollbar-thin">
              {improved || "…"}
              {isStreaming && <span className="inline-block w-2 h-4 bg-indigo-500 align-middle ml-1 animate-pulse" />}
            </pre>
            {improved && !isStreaming && (
              <div className="border-t border-slate-800 px-5 py-3 bg-slate-950/30">
                <button
                  onClick={() => { setPrompt(improved); setImproved(""); setScoreAfter(null); }}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" /> Использовать как новый промпт
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Правая колонка: ЕДИНАЯ ПАНЕЛЬ ОЦЕНКИ */}
      <aside className="space-y-4">
        {scoreBefore ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                {scoreAfter ? "Результат" : "Текущий промпт"}
              </span>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold ${scoreAfter ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {scoreAfter ? scoreAfter.score : scoreBefore.score}
                  <span className="text-sm text-slate-500 font-normal">/100</span>
                </span>
              </div>
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
                    <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                      isDone 
                        ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400" 
                        : "border-slate-700 bg-slate-800/50 text-transparent"
                    }`}>
                      <svg viewBox="0 0 14 14" fill="none" className={`h-3 w-3 ${isDone ? 'opacity-100' : 'opacity-0'}`}>
                        <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className={`leading-snug transition-colors ${
                      isDone 
                        ? "text-slate-300" 
                        : "text-slate-500"
                    }`}>
                      {crit.label || crit.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-sm text-slate-500 text-center flex flex-col items-center justify-center min-h-[200px]">
            <Sparkles className="w-8 h-8 text-slate-700 mb-3" />
            Оценка исходного промпта появится здесь
          </div>
        )}
      </aside>
    </div>
  );
}