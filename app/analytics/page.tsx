/**
 * app/analytics/page.tsx
 * Страница аналитики — ссылка на PostHog Dashboard.
 * Server Component.
 */

import { BarChart3, ExternalLink } from "lucide-react";

const POSTHOG_PROJECT_ID = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "your-project-id";

export const metadata = {
  title: "Аналитика — PromptCraft Pro",
  description: "Дашборд аналитики PromptCraft Pro",
};

export default function AnalyticsPage() {
  const dashboardUrl = `https://app.posthog.com/projects/${POSTHOG_PROJECT_ID}/insights`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Аналитика
          </h1>
        </div>
        <p className="text-sm text-slate-400">
          Мониторинг событий и воронок в PostHog Dashboard.
        </p>
      </div>

      {/* Карточка дашборда */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur p-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
          <BarChart3 className="w-8 h-8 text-indigo-400" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">
            PostHog Dashboard
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Отслеживаем события: генерация промптов, копирование, шеринг,
            оптимизация. Открыйте полный дашборд для визуализации воронок.
          </p>
        </div>

        <a
          href={dashboardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110"
        >
          Открыть дашборд
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Отслеживаемые события */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 tracking-tight">
          Отслеживаемые события
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { event: "prompt_generated", desc: "Генерация улучшенного промпта" },
            { event: "prompt_copied", desc: "Копирование промпта" },
            { event: "template_used", desc: "Использование шаблона" },
            { event: "share_link_created", desc: "Создание ссылки на шеринг" },
            { event: "optimizer_compared", desc: "Сравнение промптов" },
          ].map((item) => (
            <div
              key={item.event}
              className="flex items-center gap-3 rounded-lg bg-slate-800/50 px-3 py-2"
            >
              <code className="text-xs font-mono text-indigo-300 flex-1 truncate">
                {item.event}
              </code>
              <span className="text-xs text-slate-500 hidden sm:inline">
                {item.desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
