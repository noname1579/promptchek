/**
 * app/optimizer/page.tsx
 * Страница Optimizer — сравнение двух промптов через LLM-as-Judge.
 * Server Component, рендерит <OptimizerView>.
 */

import { OptimizerView } from "@/components/optimizer/OptimizerView";

export const metadata = {
  title: "Optimizer — LLM-as-Judge",
  description: "Сравните два промпта через LLM-судью",
};

export default function OptimizerPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Optimizer
        </h1>
        <p className="text-sm text-slate-400">
          LLM-as-Judge сравнит два варианта промпта и определит лучший.
        </p>
      </div>

      <OptimizerView />
    </div>
  );
}
