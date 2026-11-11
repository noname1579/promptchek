// app/not-found.tsx
import Link from "next/link";
import { ArrowLeft, Ghost } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        
        {/* Иконка призрака в круге */}
        <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl relative">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl" />
          <Ghost className="w-10 h-10 text-indigo-400 relative z-10" />
        </div>

        {/* Заголовок и текст */}
        <h1 className="text-6xl font-bold text-white mb-2 tracking-tight">404</h1>
        <h2 className="text-xl font-semibold text-slate-200 mb-3">Страница не найдена</h2>
        <p className="text-slate-400 mb-8 leading-relaxed">
          Возможно, она была удалена, переименована или вы просто ошиблись с ссылкой. 
          Давайте вернемся к созданию идеальных промптов.
        </p>

        {/* Кнопки */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link 
            href="/" 
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:brightness-110 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            На главную
          </Link>
          <Link 
            href="/pricing" 
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 text-white font-semibold text-sm hover:bg-slate-700 transition-all"
          >
            Посмотреть тарифы
          </Link>
        </div>
      </div>

      {/* Логотип внизу */}
      <div className="mt-16 flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
        <svg width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="40" rx="12" fill="#0f172a"/>
          <rect x="0.5" y="0.5" width="39" height="39" rx="11.5" stroke="#334155"/>
          <path d="M11 15L17 20L11 25" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M19 25H23L28 18" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-sm font-semibold text-slate-400">Promptchek</span>
      </div>
    </div>
  );
}