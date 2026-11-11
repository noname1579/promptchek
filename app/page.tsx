import { Improver } from "@/components/Improver";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Декоративный фон */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      <main className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-12">
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-400 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Promptchek — beta
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Промпты, которые дают <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              предсказуемый результат
            </span>
          </h1>
          <p className="text-slate-400 max-w-2xl text-lg">
            Вставьте промпт — получите разбор по 12 критериям, оценку 0-100 и переписанную версию. Без воды и общих советов.
          </p>
        </div>

        <Improver />
      </main>
    </div>
  );
}