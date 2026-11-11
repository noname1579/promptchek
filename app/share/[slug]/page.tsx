// app/share/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, CheckCircle2 } from "lucide-react";
import { readSharedPrompt } from "@/lib/share-store"; // Утилита ниже

export default async function SharedPromptPage({ params }: { params: { slug: string } }) {
  const data = await readSharedPrompt(params.slug);
  
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-3xl space-y-6">
        {/* Навигация назад */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Вернуться на главную
        </Link>

        {/* Карточка промпта */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/30 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-white mb-1">{data.title || "Улучшенный промпт"}</h1>
              <p className="text-sm text-slate-400">Режим: {data.mode || "Общий"}</p>
            </div>
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          
          <pre className="p-6 text-sm font-mono leading-relaxed text-slate-200 whitespace-pre-wrap max-h-[600px] overflow-auto scrollbar-thin">
            {data.prompt}
          </pre>

          <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/30 flex justify-between items-center">
            <span className="text-xs text-slate-500">Создано в Promptchek</span>
            <Link 
              href="/"
              className="rounded-lg bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-400 hover:bg-indigo-500/20 transition-colors"
            >
              Попробовать самому
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}