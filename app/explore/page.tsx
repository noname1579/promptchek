// app/explore/page.tsx
import { createClient } from "@/lib/supabase/server";
import { scorePrompt } from "@/lib/scoring";
import { Sparkles, Copy, ArrowLeft, Flame } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Топ промптов — Promptchek",
  description: "Лучшие промпты от нашего сообщества. Смотрите, копируйте и используйте в работе.",
};

async function getPublicPrompts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('history')
    .select('id, prompt, improved, mode, created_at')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (!data) return [];

  return data
    .map(item => ({
      ...item,
      score: scorePrompt(item.improved, item.mode as any).score
    }))
    .filter(item => item.score >= 90)
    .sort((a, b) => b.score - a.score);
}

export default async function ExplorePage() {
  const prompts = await getPublicPrompts();

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> На главную
        </Link>

        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Flame className="w-3.5 h-3.5" /> Библиотека сообщества
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Топ промптов</h1>
          <p className="text-slate-400 text-lg">
            Лучшие промпты, которыми поделились наши пользователи. Оценка 90+.
          </p>
        </div>

        {prompts.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            Пока нет публичных промптов с оценкой 90+. Станьте первым, кто поделится!
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {prompts.map((item) => (
              <div 
                key={item.id} 
                className="group relative rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col hover:border-indigo-500/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
                    {item.mode}
                  </span>
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm bg-emerald-500/10 px-2.5 py-1 rounded-md">
                    <Sparkles className="w-3.5 h-3.5" />
                    {item.score}/100
                  </div>
                </div>

                <p className="text-sm text-slate-300 line-clamp-4 font-mono leading-relaxed mb-6 flex-1">
                  {item.improved}
                </p>

                <div className="flex items-center gap-3 mt-auto">
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-colors">
                    <Copy className="w-4 h-4" /> Копировать
                  </button>
                  <Link 
                    href={`/share/${item.id}`}
                    className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors"
                  >
                    Открыть
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}