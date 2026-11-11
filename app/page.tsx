// app/page.tsx
import { Improver } from "@/components/Improver";
import { Globe, Send } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Основной контент */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        
        {/* Хедер страницы */}
        <div className="mb-12 sm:text-left text-center">
          
          {/* Логотип и название в шапке */}
          <div className="inline-flex items-center gap-3 mb-6 bg-slate-900/50 border border-slate-800 rounded-2xl px-4 py-2 shadow-sm">
            {/* Контейнер для логотипа (убрали градиент, так как у SVG свой фон) */}
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl">
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="12" fill="#0f172a"/>
                <rect x="0.5" y="0.5" width="39" height="39" rx="11.5" stroke="#334155"/>
                <path d="M11 15L17 20L11 25" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 25H23L28 18" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Promptchek</span>
            <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 ml-1">
              beta
            </span>
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          
          {/* Логотип в футере */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-md opacity-80">
              <svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="12" fill="#0f172a"/>
                <rect x="0.5" y="0.5" width="39" height="39" rx="11.5" stroke="#334155"/>
                <path d="M11 15L17 20L11 25" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 25H23L28 18" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-300">
              Promptchek
            </span>
            <span className="text-xs text-slate-600 ml-1">
              © {new Date().getFullYear()}
            </span>
          </div>

          {/* Ссылки */}
          <div className="flex items-center gap-6">
            <span className="text-xs text-slate-500 hidden sm:inline">
              Built for the AI era
            </span>
            <div className="flex items-center gap-3">
              <a 
                href="https://promptchek.ru" 
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800/50 transition-all" 
                aria-label="Website"
              >
                <Globe className="w-4 h-4" />
              </a>
              <a 
                href="https://t.me/promptchek" 
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800/50 transition-all" 
                aria-label="Telegram"
              >
                <Send className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}