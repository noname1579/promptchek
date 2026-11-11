// components/Improver.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { scorePrompt } from "@/lib/scoring";
import type { PromptMode, ScoreResult, HistoryItem } from "@/lib/types";
import { Share2, Sparkles, Copy, Check, Square, Zap, History, Clock } from "lucide-react";
import { trackEvent } from "@/lib/analytics-client";
import { useToast } from "@/components/ui/ToastProvider";
import { PromptInput } from "@/components/improver/PromptInput";
import { ScorePanel } from "@/components/improver/ScorePanel";
import { HistoryDrawer } from "@/components/improver/HistoryDrawer";
import { cn } from "@/lib/utils";

interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  disabled?: boolean;
}

const HISTORY_KEY = "promptchek_history";

export function Improver() {
  const { showToast } = useToast();
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
  
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  const saveHistory = (item: Omit<HistoryItem, "id" | "timestamp">) => {
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    const updated = [newItem, ...history].slice(0, 10);
    setHistory(updated);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {}
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
    showToast("История очищена");
  };

  useEffect(() => {
    const trimmed = prompt.trim();
    if (trimmed.length >= 10) {
      setScoreBefore(scorePrompt(trimmed, mode));
    } else {
      setScoreBefore(null);
    }
  }, [prompt, mode]);

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
      let finalImproved = "";

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
            finalImproved += data.text as string;
            setImproved((prev) => prev + (data.text as string));
          } else if (event === "done") {
            setScoreAfter(data.scoreAfter as ScoreResult);
            if (data.quota) setQuota(data.quota as QuotaInfo);
            trackEvent("prompt_generated", { category: mode, scoreBefore: scoreBefore?.score, scoreAfter: (data.scoreAfter as ScoreResult).score });
            saveHistory({ prompt, improved: finalImproved, mode });
          } else if (event === "error") {
            setError(data.message as string);
            showToast(data.message as string, "error");
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        const msg = err instanceof Error ? err.message : "Ошибка";
        setError(msg);
        showToast(msg, "error");
      }
    } finally {
      setIsRunning(false);
      setIsStreaming(false);
    }
  }, [isRunning, mode, prompt, scoreBefore, quota, showToast]);

  const copy = async () => {
    await navigator.clipboard.writeText(improved);
    setCopied(true);
    showToast("Промпт скопирован в буфер обмена");
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
        showToast("Ссылка скопирована!");
        trackEvent("share_link_created", { mode });
        setTimeout(() => setShareLink(null), 2000);
      }
    } catch {
      showToast("Не удалось создать ссылку", "error");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 lg:gap-8 items-start">
      
      {/* ЛЕВАЯ КОЛОНКА */}
      <div className="space-y-4 sm:space-y-5">
        
        {/* Стильная шапка с кнопкой истории */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-medium">Улучшение</span>
          </div>

          <button 
            onClick={() => setIsHistoryOpen(true)}
            className={cn(
              "group flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all duration-200",
              history.length > 0 
                ? "border-slate-700 bg-slate-800/50 text-slate-200 hover:border-indigo-500/50 hover:bg-slate-800" 
                : "border-slate-800/50 bg-transparent text-slate-500 hover:text-slate-300"
            )}
          >
            <History className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">История</span>
            {history.length > 0 && (
              <span className="flex items-center justify-center bg-indigo-500 text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 rounded-full">
                {history.length}
              </span>
            )}
          </button>
        </div>

        <PromptInput 
          prompt={prompt} 
          setPrompt={setPrompt} 
          mode={mode} 
          setMode={setMode} 
          isRunning={isRunning} 
          quota={quota} 
          run={run} 
        />

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 flex items-start justify-between gap-3 animate-slide-up">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="text-rose-400 opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {quota?.remaining === 0 && !error && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300 flex items-center gap-2 animate-slide-up">
            <span>Вы использовали все {quota.limit} бесплатных запросов на сегодня. Лимит обновится через 24 часа.</span>
          </div>
        )}

        {(improved || isRunning) && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl overflow-hidden animate-fade-in shadow-2xl shadow-indigo-500/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 px-4 sm:px-5 py-3 bg-slate-950/30">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" /> Результат
              </span>
              <div className="flex items-center gap-3 sm:gap-4">
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
            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap p-4 sm:p-5 font-mono text-sm leading-relaxed text-slate-200 scrollbar-thin">
              {improved || "…"}
              {isStreaming && <span className="inline-block w-2 h-4 bg-indigo-500 align-middle ml-1 animate-pulse" />}
            </pre>
            {improved && !isStreaming && (
              <div className="border-t border-slate-800 px-4 sm:px-5 py-3 bg-slate-950/30">
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

      {/* ПРАВАЯ КОЛОНКА */}
      <aside className="w-full lg:sticky lg:top-6">
        <ScorePanel scoreBefore={scoreBefore} scoreAfter={scoreAfter} />
      </aside>

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelect={(item) => {
          setPrompt(item.prompt);
          setImproved(item.improved);
          setMode(item.mode);
          showToast("Промпт загружен из истории");
        }}
        onClear={clearHistory}
      />
    </div>
  );
}