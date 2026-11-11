/**
 * components/share/SharedTemplateView.tsx
 * Клиентский компонент для отображения shared template в read-only режиме.
 * Зависимости: react, lucide-react
 */

"use client";

import { useState, useCallback } from "react";
import { Copy, Check, ExternalLink, Sparkles } from "lucide-react";
import type { SharedTemplate } from "@/lib/store";

interface Props {
  template: SharedTemplate;
}

export function SharedTemplateView({ template }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(template.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [template.prompt]);

  const modeLabel: Record<string, string> = {
    general: "Общий",
    code: "Код",
    agent: "Агент",
    system: "Системный",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Шапка */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
            <Sparkles className="w-3 h-3" />
            Shared Template
          </span>
          <span className="text-xs text-slate-500">
            {new Date(template.createdAt).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white">
          {template.title}
        </h1>

        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-slate-700 bg-slate-800/50 px-2.5 py-1 text-xs text-slate-400">
            {modeLabel[template.mode] ?? template.mode}
          </span>
        </div>
      </div>

      {/* Тело промпта */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
          <span className="text-xs uppercase tracking-wider text-slate-500">
            Промпт
          </span>
          <button
            type="button"
            onClick={copy}
            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" /> Скопировано
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Копировать
              </>
            )}
          </button>
        </div>
        <pre className="max-h-[500px] overflow-auto whitespace-pre-wrap p-4 font-mono text-sm leading-relaxed text-slate-300">
          {template.prompt}
        </pre>
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-indigo-950/50 to-purple-950/50 backdrop-blur p-6 text-center space-y-3">
        <p className="text-sm text-slate-300">
          Хотите улучшить свой промпт?
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110"
        >
          Собери свой промпт
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
