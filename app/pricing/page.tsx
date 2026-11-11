// app/pricing/page.tsx
"use client";

import { useState } from "react";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "0",
    desc: "Для знакомства с сервисом",
    features: ["5 улучшений в день", "История из 10 промптов", "Стандартная скорость", "Базовые достижения"],
    icon: Sparkles,
    color: "slate",
  },
  {
    id: "pro",
    name: "Pro",
    price: "299",
    desc: "Для ежедневной работы с AI",
    features: ["100 улучшений в день", "Неограниченная история", "Приоритетная очередь", "Доступ к GigaChat Max", "Все достижения"],
    icon: Zap,
    color: "indigo",
    popular: true,
  },
  {
    id: "pro_plus",
    name: "Pro+",
    price: "599",
    desc: "Для профессионалов и команд",
    features: ["500 улучшений в день", "Всё из Pro", "Ранний доступ к Optimizer", "Экспорт в JSON/Markdown", "Приоритетная поддержка"],
    icon: Crown,
    color: "amber",
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleSubscribe = async (planId: string) => {
    if (planId === "free") return router.push("/");
    setLoading(planId);
    // Пока заглушка, потом заменим на вызов API ЮKassa
    setTimeout(() => {
      alert(`Перенаправление на оплату тарифа ${planId} (здесь будет ЮKassa)`);
      setLoading(null);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">Выберите свой план</h1>
          <p className="text-slate-400 text-lg">Инвестируйте в качество своих промптов</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isPopular = plan.popular;
            return (
              <div 
                key={plan.id}
                className={cn(
                  "relative rounded-3xl border p-8 flex flex-col transition-all",
                  isPopular 
                    ? "border-indigo-500/50 bg-gradient-to-b from-indigo-500/10 to-transparent shadow-2xl shadow-indigo-500/20" 
                    : "border-slate-800 bg-slate-900/50"
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    ПОПУЛЯРНЫЙ
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
                
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-400">₽ / мес</span>
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
                  disabled={loading === plan.id}
                  className={cn(
                    "w-full py-3 rounded-xl font-semibold text-sm transition-all",
                    isPopular
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:brightness-110"
                      : "bg-slate-800 text-white hover:bg-slate-700"
                  )}
                >
                  {loading === plan.id ? "Загрузка..." : plan.id === "free" ? "Начать бесплатно" : "Перейти на " + plan.name}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}