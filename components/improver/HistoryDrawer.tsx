// components/improver/HistoryDrawer.tsx
"use client";

import { useEffect } from "react";
import { History, ArrowRight, Trash2, X } from "lucide-react";
import type { HistoryItem } from "@/lib/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

export function HistoryDrawer({ isOpen, onClose, history, onSelect, onClear }: Props) {
  // Блокируем скролл страницы, когда панель открыта
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Затемненный фон (клик закрывает) */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Сама панель */}
      <div className="relative w-full max-w-md bg-slate-900 h-full shadow-2xl flex flex-col animate-slide-left border-l border-slate-800">
        
        {/* Шапка панели */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white">
            <History className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold">История</h2>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full ml-1">
              {history.length}
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Список промптов */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 space-y-3">
              <History className="w-10 h-10 text-slate-700" />
              <p>Вы еще не улучшали промпты.<br/>Самое время начать!</p>
            </div>
          ) : (
            history.map((item) => (
              <div 
                key={item.id} 
                className="group rounded-xl border border-slate-800 bg-slate-950/50 p-4 hover:border-indigo-500/40 hover:bg-slate-800/50 transition-all cursor-pointer"
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                    {item.mode}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {new Date(item.timestamp).toLocaleDateString("ru-RU", { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-slate-300 line-clamp-2 font-mono leading-relaxed mb-3">
                  {item.prompt}
                </p>
                <div className="flex items-center text-xs font-medium text-indigo-400 group-hover:text-indigo-300 transition-colors">
                  Загрузить в редактор <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Подвал панели */}
        {history.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/30">
            <button 
              onClick={() => {
                if(confirm("Вы уверены, что хотите очистить всю историю?")) {
                  onClear();
                }
              }}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Очистить историю
            </button>
          </div>
        )}
      </div>
    </div>
  );
}