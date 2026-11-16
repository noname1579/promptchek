// app/faq/page.tsx
import Link from "next/link";
import { ArrowLeft, HelpCircle, Shield, Zap, MessageCircle } from "lucide-react";
import { JsonLd } from "@/components/JsonLd"; // Мы создадим его на следующем шаге

const FAQS = [
  {
    question: "Чем Promptchek отличается от ChatGPT?",
    answer: "ChatGPT — это универсальная нейросеть. Promptchek — это специализированный тренажер для ваших промптов. Мы не генерируем текст за вас, а учим вас (и вашу нейросеть) общаться так, чтобы результат был предсказуемым. Мы оцениваем промпт по 12 критериям и автоматически улучшаем его до 90+ баллов.",
    icon: Zap,
  },
  {
    question: "Безопасно ли использовать Promptchek?",
    answer: "Да. Мы не сохраняем ваши промпты в открытом доступе без вашего согласия. Все данные хранятся в защищенной базе Supabase. Если вы нажимаете «Поделиться», промпт попадает в публичную библиотеку, но только с вашего явного действия.",
    icon: Shield,
  },
  {
    question: "Нужен ли мне VPN для работы с сервисом?",
    answer: "Нет. Promptchek работает на российских серверах (Vercel + GigaChat) и оптимизирован для работы из РФ без использования VPN. Мы используем GigaChat от Сбера, поэтому доступ стабилен.",
    icon: MessageCircle,
  },
  {
    question: "Что такое «Улучшить автоматически»?",
    answer: "Это функция для тарифа Pro. Нейросеть берет ваш сырой промпт и переписывает его по стандарту RCCT (Роль, Контекст, Ограничения, Задача). Вы получаете готовый профессиональный промпт в один клик, не тратя время на ручную доработку.",
    icon: Zap,
  },
  {
    question: "Можно ли использовать сервис бесплатно?",
    answer: "Да, у нас есть тариф Free с лимитом 5 улучшений в день. Этого достаточно, чтобы познакомиться с сервисом. Для активной работы мы предлагаем тарифы Pro и Pro+ с расширенными лимитами и доступом к автоматическому улучшению.",
    icon: HelpCircle,
  },
];

export const metadata = {
  title: "FAQ — Promptchek",
  description: "Ответы на частые вопросы о сервисе Promptchek: безопасность, тарифы, отличие от ChatGPT.",
};

export default function FAQPage() {
  // Генерируем JSON-LD разметку для FAQ
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6">
      {/* Вставляем Schema.org разметку */}
      <JsonLd data={faqSchema} />

      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> На главную
        </Link>

        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <HelpCircle className="w-3.5 h-3.5" /> Помощь
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Частые вопросы</h1>
          <p className="text-slate-400 text-lg">
            Всё, что нужно знать о Promptchek перед началом работы.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, index) => {
            const Icon = faq.icon;
            return (
              <div 
                key={index}
                className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{faq.question}</h3>
                    <p className="text-slate-300 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-400 mb-4">Не нашли ответ на свой вопрос?</p>
          <a 
            href="https://t.me/promptchek" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:brightness-110 transition-all"
          >
            <MessageCircle className="w-4 h-4" /> Написать в Telegram
          </a>
        </div>
      </div>
    </div>
  );
}