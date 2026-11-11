# promptchek

Сервис, который превращает слабые промпты в рабочие: разбор по критериям, оценка 0-100 и переписанная версия.

## Стек

- Next.js 16 (App Router, Turbopack)
- React 19, TypeScript strict
- Tailwind CSS 4
- LLM — OpenAI, Anthropic, любой OpenAI-совместимый endpoint (Groq, OpenRouter, локальный vLLM/Ollama)
- Analytics — PostHog

## Запуск

```bash
npm install
cp .env.example .env.local   # заполнить ключи
npm run dev
```

Открыть http://localhost:3000

## Переменные окружения

| Переменная | Назначение | Где получить |
|---|---|---|
| `LLM_BASE_URL` | Базовый URL API (Groq по умолчанию) | [groq.com](https://console.groq.com/keys) |
| `LLM_API_KEY` | Ключ провайдера (обязателен) | там же |
| `LLM_MODEL` | Модель, по умолчанию `openai/gpt-oss-120b` | — |
| `OPENAI_API_KEY` | Ключ OpenAI (для AI-движка и Optimizer) | [platform.openai.com](https://platform.openai.com/api-keys) |
| `ANTHROPIC_API_KEY` | Ключ Anthropic (для Claude) | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| `FREE_MONTHLY_RUNS` | Лимит бесплатных прогонов в dev | — |
| `NEXT_PUBLIC_POSTHOG_KEY` | Ключ PostHog для аналитики | [app.posthog.com](https://app.posthog.com/projects) |
| `NEXT_PUBLIC_POSTHOG_HOST` | Host PostHog, по умолчанию `https://app.posthog.com` | — |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL (опционально, auth + quota) | [supabase.com](https://supabase.com/dashboard) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key Supabase | там же |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role Supabase | там же |

## Новые API-эндпоинты

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/generate` | Потоковая генерация улучшенного промпта (OpenAI / Anthropic) |
| POST | `/api/optimize` | Сравнение двух промптов через LLM-as-Judge |
| POST | `/api/share` | Создание публичной ссылки на промпт |

## Новые страницы

| Путь | Описание |
|---|---|
| `/optimizer` | LLM-as-Judge: сравнение A/B двух промптов |
| `/analytics` | Дашборд аналитики (ссылка на PostHog) |
| `/share/[slug]` | Read-only просмотр shared template |

## Структура

```
app/
  page.tsx                  — лендинг + Improver
  api/improve/route.ts      — SSE: скоринг → стрим LLM → скоринг
  api/generate/route.ts     — стрим генерации (OpenAI/Anthropic)
  api/optimize/route.ts     — LLM-as-Judge сравнение
  api/share/route.ts        — создание shared ссылки
  optimizer/page.tsx        — страница Optimizer
  analytics/page.tsx        — страница Аналитика
  share/[slug]/page.tsx     — shared template (read-only)
components/
  Improver.tsx              — клиентский экран улучшателя
  ScoreCard.tsx             — карточка оценки
  optimizer/OptimizerView.tsx — UI Optimizer
  share/SharedTemplateView.tsx — UI shared template
  analytics/AnalyticsProvider.tsx — инициализация PostHog
lib/
  scoring.ts                — гибридный скоринг
  modes.ts                  — режимы и инструкции
  llm/client.ts             — провайдер-агностик стриминг
  llm/prompts.ts            — системный промпт
  llm-client.ts             — унифицированный OpenAI + Anthropic
  prompt-builder.ts         — buildPrompt + streamPrompt
  judge.ts                  — LLM-as-Judge comparison
  store.ts                  — хранилище shared templates
  analytics-client.ts       — PostHog client wrapper
  analytics-server.ts       — PostHog server wrapper
  rate-limit.ts             — in-memory rate limiter
```

## Как работает скоринг

Детерминированные правила с весами: роль, контекст, формат вывода, ограничения, критерии качества, аудитория, примеры, структура, детализация. Для режимов `code`, `agent`, `system` добавляются свои критерии (стек, граничные случаи, тесты / инструменты, поведение при неоднозначности / правила отказа, тон, приоритет инструкций).

Правила дают воспроизводимость — один и тот же промпт всегда получает одну и ту же оценку.

## Roadmap

- [x] AI-движок (OpenAI + Anthropic, потоковая передача)
- [x] Optimizer (LLM-as-Judge A/B сравнение)
- [x] Sharing (публичные ссылки на шаблоны)
- [x] Analytics (PostHog: события + воронки)
- [ ] Collaborative workspace (Yjs + WebSocket)
- [ ] Private templates (авторизованные пользователи)
- [ ] Prompt versioning (история изменений промптов)
- [ ] Квоты и биллинг (Supabase + Stripe)
- [ ] Библиотека шаблонов с SEO-страницами
- [ ] API-ключи для Pro-плана
- [ ] Персистентный rate limit (Redis/Upstash) для мультиинстансного деплоя
