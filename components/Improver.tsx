"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ScoreCard } from "@/components/ScoreCard";
import { scorePrompt } from "@/lib/scoring";
import { MODE_HINTS, MODE_LABELS } from "@/lib/modes";
import type { PromptMode, ScoreResult } from "@/lib/types";

const MODES: PromptMode[] = ["general", "code", "agent", "system"];

const EXAMPLE = `напиши функцию на js которая валидирует email`;

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

  // Live client-side scoring — работает без LLM ключа
  useEffect(() => {
    const trimmed = prompt.trim();
    if (trimmed.length >= 10) {
      const result = scorePrompt(trimmed, mode);
      setScoreBefore(result);
    } else {
      setScoreBefore(null);
    }
  }, [prompt, mode]);

  // Загрузка истории из localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("promptchek_history");
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  const saveToHistory = (entry: {
    prompt: string;
    improved: string;
    scoreBefore: ScoreResult;
    scoreAfter: ScoreResult;
    mode: PromptMode;
  }) => {
    const newEntry = { ...entry, ts: Date.now() };
    const updated = [newEntry, ...history].slice(0, 5);
    setHistory(updated);
    try {
      localStorage.setItem("promptchek_history", JSON.stringify(updated));
    } catch {}
  };

  const run = useCallback(async () => {
    if (isRunning || prompt.trim().length < 10) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsRunning(true);
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
        const data = (await response.json().catch(() => null)) as {
          error?: string;
          quota?: QuotaInfo;
        } | null;
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
          const payload = dataLines
            .map((line) => line.slice(5).trim())
            .join("\n");

          let data: Record<string, unknown>;
          try {
            data = JSON.parse(payload) as Record<string, unknown>;
          } catch {
            continue;
          }

          if (event === "score") {
            // Keep local live score; server score is the same
            if (data.quota) setQuota(data.quota as QuotaInfo);
          } else if (event === "delta") {
            setImproved((prev) => prev + (data.text as string));
          } else if (event === "done") {
            setScoreAfter(data.scoreAfter as ScoreResult);
            if (data.quota) setQuota(data.quota as QuotaInfo);
            if (scoreBefore && data.scoreAfter) {
              saveToHistory({
                prompt,
                improved: "", // will be filled after stream ends, but we save after
                scoreBefore,
                scoreAfter: data.scoreAfter as ScoreResult,
                mode,
              });
            }
          } else if (event === "error") {
            setError(data.message as string);
          }
        }
      }

      // Save history after full improved text is received
      if (scoreBefore && scoreAfter) {
        saveToHistory({
          prompt,
          improved,
          scoreBefore,
          scoreAfter,
          mode,
        });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err instanceof Error ? err.message : "Неизвестная ошибка");
      }
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, mode, prompt, improved, scoreBefore, scoreAfter]);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(improved);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [improved]);

  const clearAll = useCallback(() => {
    setPrompt("");
    setImproved("");
    setScoreAfter(null);
    setError(null);
    setCopied(false);
  }, []);

  const applyImproved = useCallback(() => {
    if (improved) {
      setPrompt(improved);
      setImproved("");
      setScoreAfter(null);
      setError(null);
    }
  }, [improved]);

  const loadFromHistory = useCallback((entry: any) => {
    setPrompt(entry.prompt);
    setImproved(entry.improved);
    setScoreBefore(entry.scoreBefore);
    setScoreAfter(entry.scoreAfter);
    setMode(entry.mode);
    setError(null);
  }, []);

  // Sanitize errors for user
  const getFriendlyError = (raw: string) => {
    if (/LLM|API_KEY|configured|key/i.test(raw)) {
      return "Улучшение промпта сейчас недоступно (требуется ключ LLM). Разбор и оценка работают без него.";
    }
    return raw;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              title={MODE_HINTS[m]}
              className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                mode === m
                  ? "border-accent bg-accent-soft text-white"
                  : "border-line text-muted hover:border-muted hover:text-white"
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-line bg-ink-soft">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Вставьте промпт, который хотите улучшить…"
            rows={7}
            maxLength={8000}
            className="w-full resize-y bg-transparent p-4 font-mono text-sm leading-relaxed outline-none placeholder:text-muted"
          />
          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5">
            <button
              type="button"
              onClick={() => setPrompt(EXAMPLE)}
              className="text-xs text-muted underline-offset-4 hover:text-white hover:underline"
            >
              Вставить пример
            </button>
            <div className="flex items-center gap-3">
              {quota && !quota.disabled && (
                <span
                  className={`text-xs ${
                    quota.remaining === 0 ? "text-bad" : "text-muted"
                  }`}
                  title="Бесплатные прогоны в этом месяце"
                >
                  {quota.remaining} из {quota.limit}
                </span>
              )}
              <span className="text-xs text-muted">{prompt.length}/8000</span>
              <button
                type="button"
                onClick={run}
                disabled={isRunning || prompt.trim().length < 10}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isRunning ? "Улучшаю…" : "Улучшить"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad flex items-start justify-between gap-3">
            <span>{getFriendlyError(error)}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-xs opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {(improved || isRunning) && (
          <div className="rounded-xl border border-line bg-ink-soft">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <span className="text-xs uppercase tracking-wider text-muted">
                Улучшенный промпт
              </span>
              <button
                type="button"
                onClick={copy}
                disabled={!improved}
                className="text-xs text-muted hover:text-white disabled:opacity-40"
              >
                {copied ? "Скопировано" : "Копировать"}
              </button>
            </div>
            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap p-4 font-mono text-sm leading-relaxed">
              {improved || "…"}
            </pre>
            {improved && (
              <div className="border-t border-line px-4 py-2.5 flex gap-2">
                <button
                  type="button"
                  onClick={applyImproved}
                  className="text-xs text-muted hover:text-white underline-offset-4 hover:underline"
                >
                  Использовать как новый промпт
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <aside className="space-y-4">
        {scoreBefore ? (
          <ScoreCard title="До" result={scoreBefore} />
        ) : (
          <div className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">
            Оценка исходного промпта появится здесь.
          </div>
        )}
        {scoreAfter && (
          <div>
            <ScoreCard title="После" result={scoreAfter} compact />
            {scoreBefore && (
              <div className="mt-1 text-right text-xs text-good">
                +{scoreAfter.score - scoreBefore.score} баллов
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
