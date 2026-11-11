// app/page.tsx
import { Improver } from "@/components/Improver";
import { Sparkles, Globe, Send } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Основной контент */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        
        {/* Хедер страницы */}
        <div className="mb-12 sm:text-left text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-400 mb-6 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Promptchek — beta
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
            Промпты, которые дают <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              предсказуемый результат
            </span>
          </h1>
          
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
            Вставьте промпт — получите разбор по 12 критериям, оценку 0-100 и переписанную версию. Без воды и общих советов.
          </p>
        </div>

        {/* Основной компонент */}
        <Improver />
      </div>

      {/* Футер */}
      <footer className="border-t border-slate-800/50 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Promptchek
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-slate-500 hover:text-white transition-colors" aria-label="GitHub">
              <Globe className="w-4 h-4" />
            </a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors" aria-label="Telegram">
              <Send className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}