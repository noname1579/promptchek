import { AuthButton } from "@/components/AuthButton";
import { Improver } from "@/components/Improver";

const EXAMPLES = [
  {
    before: "напиши функцию на js которая валидирует email",
    after:
      "Ты — senior frontend-разработчик. Напиши TypeScript-функцию `isValidEmail(value: string): boolean` для Next.js 15.\n\nТребования:\n- без внешних зависимостей;\n- пустая строка, null и undefined → false;\n- длина локальной части ≤ 64, домена ≤ 255;\n- верни только код функции и 3 unit-теста (vitest).",
  },
  {
    before: "сделай ревью кода",
    after:
      "Ты — тимлид с 10 годами опыта в Node.js. Проведи ревью диффа ниже.\n\nФормат ответа — таблица: строка | проблема | критичность (blocker/major/minor) | как исправить.\n\nОграничения: не предлагай переписать архитектуру, только локальные правки. Если проблема неоднозначна — задай вопрос вместо догадки.",
  },
  {
    before: "объясни что такое docker",
    after:
      "Ты — ментор по DevOps. Объясни Docker разработчику, который знает Python, но никогда не работал с контейнерами.\n\nСтруктура: 1) аналогия из 2 предложений; 2) чем отличается от виртуальной машины; 3) минимальный Dockerfile для FastAPI с комментариями.\n\nОграничения: без истории технологии, максимум 400 слов, без emoji.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <header className="mb-12">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-good" />
            Promptchek — beta
          </div>
          <AuthButton />
        </div>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Промпты, которые дают предсказуемый результат
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Вставьте промпт — получите разбор по 12 критериям, оценку 0-100 и
          переписанную версию. Без воды и общих советов.
        </p>
      </header>

      <section id="app" className="mb-16">
        <Improver />
      </section>

      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-semibold">До и после</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {EXAMPLES.map((example) => (
            <article
              key={example.before}
              className="flex flex-col gap-3 rounded-xl border border-line bg-ink-soft p-4"
            >
              <div>
                <span className="text-xs uppercase tracking-wider text-bad">
                  Было
                </span>
                <p className="mt-1 font-mono text-sm text-muted">
                  {example.before}
                </p>
              </div>
              <div className="border-t border-line pt-3">
                <span className="text-xs uppercase tracking-wider text-good">
                  Стало
                </span>
                <p className="mt-1 whitespace-pre-line font-mono text-sm leading-relaxed">
                  {example.after}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            title: "Разбор, а не оценка",
            text: "Каждый критерий объяснён: чего не хватает и как это исправить.",
          },
          {
            title: "Режимы под задачу",
            text: "Код, агенты Cursor/Claude Code, системные промпты — разные рубрики.",
          },
          {
            title: "Без привязки к модели",
            text: "Работает с любой LLM: результат — текст, а не магический формат.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-line bg-ink-soft p-4"
          >
            <h3 className="mb-1 font-medium">{item.title}</h3>
            <p className="text-sm text-muted">{item.text}</p>
          </div>
        ))}
      </section>

      <footer className="mt-16 border-t border-line pt-6 text-sm text-muted">
        Promptchek · {new Date().getFullYear()}
      </footer>
    </main>
  );
}
