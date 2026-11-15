// app/pricing/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Check, Sparkles, Zap, Crown, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/ToastProvider";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "0",
    oldPrice: null,
    desc: "Для знакомства с сервисом",
    features: ["5 улучшений в день", "История из 10 промптов", "Стандартная скорость", "Базовые достижения"],
    icon: Sparkles,
    color: "slate",
    discount: null,
  },
  {
    id: "pro",
    name: "Pro",
    price: "149",
    oldPrice: "299",
    desc: "Для ежедневной работы с AI",
    features: ["100 улучшений в день", "Неограниченная история", "Приоритетная очередь", "Доступ к GigaChat Max", "Все достижения"],
    icon: Zap,
    color: "indigo",
    popular: true,
    discount: "Скидка 50% при запуске",
  },
  {
    id: "pro_plus",
    name: "Pro+",
    price: "399",
    oldPrice: "599",
    desc: "Для профессионалов и команд",
    features: ["500 улучшений в день", "Всё из Pro", "Ранний доступ к Optimizer", "Экспорт в JSON/Markdown", "Приоритетная поддержка"],
    icon: Crown,
    color: "amber",
    discount: "Скидка 33% при запуске",
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  // Проверяем, вернулся ли пользователь после успешной оплаты
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccess(true);
      showToast("Оплата прошла успешно! Подписка активирована.", "success");
      // Очищаем URL от параметра success
      router.replace("/pricing");
    }
  }, [searchParams, router, showToast]);

  const handleSubscribe = async (planId: string) => {
    if (planId === "free") return router.push("/");
    
    setLoading(planId);
    
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      
      const data = await res.json();
      
      if (res.status === 401) {
        showToast("Пожалуйста, войдите в аккаунт перед покупкой.", "error");
        router.push("/login");
        return;
      }

      if (data.confirmationUrl) {
        // Перенаправляем на страницу оплаты ЮKassa
        window.location.href = data.confirmationUrl;
      } else {
        showToast(data.error || "Ошибка создания платежа. Попробуйте позже.", "error");
        setLoading(null);
      }
    } catch (err) {
      showToast("Ошибка сети. Проверьте подключение.", "error");
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:py-20 relative">
      
      {/* Уведомление об успешной оплате */}
      {showSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-slide-up">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">Подписка успешно активирована!</span>
          <button onClick={() => setShowSuccess(false)} className="ml-4 text-emerald-500 hover:text-emerald-300">✕</button>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        
        {/* Кнопка назад */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> На главную
        </Link>

        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4 animate-pulse">
            <Zap className="w-3.5 h-3.5" /> Специальные цены при запуске
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Выберите свой план</h1>
          <p className="text-slate-400 text-lg">Инвестируйте в качество своих промптов</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isPopular = plan.popular;
            const hasDiscount = !!plan.oldPrice;
            const isLoading = loading === plan.id;
            
            return (
              <div 
                key={plan.id}
                className={cn(
                  "relative rounded-3xl border p-8 flex flex-col transition-all duration-300",
                  isPopular 
                    ? "border-indigo-500/50 bg-gradient-to-b from-indigo-500/10 to-transparent shadow-2xl shadow-indigo-500/20 md:scale-105 z-10" 
                    : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
                    Популярный выбор
                  </div>
                )}
                
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center mb-6",
                  plan.color === "indigo" ? "bg-indigo-500/20 text-indigo-400" :
                  plan.color === "amber" ? "bg-amber-500/20 text-amber-400" :
                  "bg-slate-800 text-slate-400"
                )}>
                  <Icon className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-slate-400 mb-6">{plan.desc}</p>
                
                <div className="flex flex-col mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-slate-400">₽ / мес</span>
                  </div>
                  {hasDiscount && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-slate-500 line-through">{plan.oldPrice} ₽</span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
                        {plan.discount}
                      </span>
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                      <Check className={cn("w-4 h-4 shrink-0 mt-0.5", isPopular ? "text-indigo-400" : "text-slate-500")} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isLoading}
                  className={cn(
                    "w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
                    isPopular
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:brightness-110"
                      : "bg-slate-800 text-white hover:bg-slate-700"
                  )}
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Создаем платеж...</>
                  ) : plan.id === "free" ? (
                    "Начать бесплатно"
                  ) : (
                    "Перейти на " + plan.name
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}