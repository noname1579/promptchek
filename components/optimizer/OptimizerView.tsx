/**
 * components/optimizer/OptimizerView.tsx
 * UI для сравнения двух промптов через LLM-as-Judge.
 * Зависимости: react, lucide-react
 */

"use client";

import { useState, useCallback } from "react";
import { Scale, Sparkles, Copy, Check } from "lucide-react";

// --- Типы ---

interface JudgeResult {
  winner: "A" | "B" | "tie";
  reasoning: string;
  scores?: { A: number; B: number };
}

// --- Компонент ---

export function OptimizerView() {
  const [task, setTask] = useState("");
  const [promptA, setPromptA] = useState("");
  const [promptB, setPromptB] = useState("");
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"A" | "B" | null>(null);

  const compare = useCallback(async () => {
    if (!task.trim() || !promptA.trim() || !promptB.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: task.trim(),
          promptA: promptA.trim(),
          promptB: promptB.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? `Ошибка ${response.status}`);
      }

      const data = (await response.json()) as JudgeResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  }, [task, promptA, promptB]);

  const applyWinner = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied("A");
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const winnerText = result?.winner === "A" ? promptA : result?.winner === "B" ? promptB : null;

  const winnerLabel = result?.winner === "A" ? "A" : result?.winner === "B" ? "B" : "Ничья";
  const winnerColor =
    result?.winner === "A"
      ? "text-emerald-400"
      : result?.winner === "B"
        ? "text-blue-400"
        : "text-amber-400";

  return (
    <div className="space-y-6">
      {/* Задача */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2 tracking-tight">
          Задача
        </label>
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Опишите задачу, для которой сравниваются промпты…"
          maxLength={500}
          className="w-full rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 transition-all duration-200"
        />
      </div>

      {/* Два промпта рядом */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2 tracking-tight">
            Промпт A
          </label>
          <textarea
            value={promptA}
            onChange={(e) => setPromptA(e.target.value)}
            placeholder="Вставьте первый вариант промпта…"
            rows={10}
            maxLength={4000}
            className="w-full resize-y rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur px-4 py-3 font-mono text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 transition-all duration-200"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2 tracking-tight">
            Промпт B
          </label>
          <textarea
            value={promptB}
            onChange={(e) => setPromptB(e.target.value)}
            placeholder="Вставьте второй вариант промпта…"
            rows={10}
            maxLength={4000}
            className="w-full resize-y rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur px-4 py-3 font-mono text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 transition-all duration-200"
          />
        </div>
      </div>

      {/* Кнопка сравнения */}
      <button
        type="button"
        onClick={compare}
        disabled={loading || !task.trim() || !promptA.trim() || !promptB.trim()}
        className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 flex items-center justify-center gap-2"
      >
        <Scale className="w-4 h-4" />
        {loading ? "Судья анализирует…" : "Сравнить"}
      </button>

      {/* Лоадер */}
      {loading && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur p-6 text-center">
          <div className="inline-flex items-center gap-2 animate-pulse text-sm text-slate-400">
            <Sparkles className="w-4 h-4" />
            Судья анализирует…
          </div>
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Результат */}
      {result && !loading && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur p-6 space-y-4">
          {/* Бейдж победителя */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-300">Победитель:</span>
            <span className={`text-lg font-bold tracking-tight ${winnerColor}`}>
              {winnerLabel}
            </span>
          </div>

          {/* Счёт */}
          {result.scores && (
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-slate-500">A: </span>
                <span className="font-semibold text-white">{result.scores.A}</span>
              </div>
              <span className="text-slate-600">—</span>
              <div>
                <span className="text-slate-500">B: </span>
                <span className="font-semibold text-white">{result.scores.B}</span>
              </div>
            </div>
          )}

          {/* Обоснование */}
          <div className="rounded-xl bg-slate-800/50 p-4">
            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
              {result.reasoning}
            </p>
          </div>

          {/* Кнопка применить */}
          {winnerText && (
            <button
              type="button"
              onClick={() => applyWinner(winnerText)}
              className="w-full rounded-xl border border-indigo-500/50 bg-indigo-500/10 px-4 py-2.5 text-sm font-medium text-indigo-300 transition-all duration-200 hover:bg-indigo-500/20 hover:border-indigo-500 flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" /> Скопировано
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Применить победителя
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
