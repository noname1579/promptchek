// components/PromoModal.tsx
"use client";

import { useState } from "react";
import { X, Sparkles, Send, Zap, Check } from "lucide-react";
import Link from "next/link";
import { useToast } from "./ui/ToastProvider";

export function PromoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { showToast } = useToast();
  const [code, setCode] = useState("");
  const [isActivating, setIsActivating] = useState(false);

  if (!isOpen) return null;

  const handleActivate = async () => {
    if (!code.trim()) return;
    setIsActivating(true);
    
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Ошибка активации");

      showToast(data.message, "success");
      
      // Если это бонусные запросы, перезагружаем страницу, 
      // чтобы сервер выдал новый лимит (в будущем можно сделать обновление без перезагрузки)
      onClose();
      setTimeout(() => window.location.reload(), 1000);
      
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Шапка с градиентом */}
        <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-6 text-center relative border-b border-slate-800">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 mb-3 shadow-lg">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Лимит на сегодня исчерпан</h2>
          <p className="text-sm text-slate-400">Вы использовали все 5 бесплатных запросов.</p>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Преимущества Pro */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 text-indigo-400 mb-2">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-semibold">Что дает Pro?</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-400" /> 100 запросов в день</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-400" /> Неограниченная история</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-400" /> Приоритетная скорость</li>
            </ul>
          </div>

          {/* Ввод промокода */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              У меня есть промокод
            </label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Введите код (например, TGPRO)"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <button 
                onClick={handleActivate}
                disabled={isActivating || !code}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                {isActivating ? "..." : "Применить"}
              </button>
            </div>
          </div>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink-0 mx-4 text-xs text-slate-600 uppercase">или</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Кнопка перехода на тарифы */}
          <Link 
            href="/pricing"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 hover:brightness-110 transition-all"
          >
            <Zap className="w-4 h-4" />
            Купить Pro (299 ₽/мес)
          </Link>

          {/* Кнопка Telegram */}
          <a 
            href="https://t.me/promptchek" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-800 text-white font-semibold text-sm hover:bg-slate-700 transition-all"
          >
            <Send className="w-4 h-4 text-indigo-400" />
            Получить промокод в Telegram
          </a>
          <p className="text-center text-xs text-slate-500 mt-2">
            Подпишитесь на канал, чтобы получать бесплатные запросы каждую неделю.
          </p>
        </div>
      </div>
    </div>
  );
}