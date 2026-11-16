// components/PromptClarifier.tsx
"use client";

import { useState } from "react";
import { X, Sparkles, Wand2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  originalPrompt: string;
  onClarify: (clarifiedPrompt: string) => void;
}

export function PromptClarifier({ isOpen, onClose, originalPrompt, onClarify }: Props) {
  const [role, setRole] = useState("");
  const [audience, setAudience] = useState("");
  const [format, setFormat] = useState("");

  if (!isOpen) return null;

  const handleApply = () => {
    // Собираем улучшенный промпт из ответов
    let finalPrompt = `Ты — ${role || "профессиональный эксперт"}. \n\n`;
    finalPrompt += `Задача: ${originalPrompt}\n\n`;
    
    if (audience) {
      finalPrompt += `Целевая аудитория: ${audience}. Сделай акцент на их потребностях.\n`;
    }
    
    if (format) {
      finalPrompt += `Формат вывода: ${format}.\n`;
    }

    finalPrompt += `\nДействуй пошагово, давай точные и структурированные ответы.`;

    onClarify(finalPrompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/30">
          <div className="flex items-center gap-2 text-white">
            <Wand2 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold">Уточним детали</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-sm text-slate-400">
            Ответьте на пару вопросов, чтобы нейросеть выдала идеальный результат.
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Кто должен отвечать? (Роль)</label>
            <input 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Например: Senior-разработчик, Копирайтер, Аналитик..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Для кого это? (Аудитория)</label>
            <input 
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Например: Для новичков, Для B2B-клиентов..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Как должен выглядеть ответ? (Формат)</label>
            <input 
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              placeholder="Например: Маркированный список, Таблица, Краткий абзац..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-950/30 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
            Отмена
          </button>
          <button 
            onClick={handleApply}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-xl hover:brightness-110 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Собрать промпт
          </button>
        </div>
      </div>
    </div>
  );
}