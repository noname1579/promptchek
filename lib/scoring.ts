import type { PromptMode, ScoreCriterion, ScoreResult } from "@/lib/types";

interface Rule {
  id: string;
  label: string;
  weight: number;
  hint: string;
  test: (prompt: string) => boolean;
}

const ROLE_PATTERN =
  /(ты\s*[-—:]?\s*|you are\b|act as\b|выступай|представь,? что ты|роль\s*:)/i;
const FORMAT_PATTERN =
  /(формат|format|json|markdown|таблиц|список|списком|bullet|схем|структур[аеу]\s+ответа|output)/i;
const CONSTRAINT_PATTERN =
  /(не\s+(делай|пиши|используй|добавляй)|только|максимум|минимум|не более|не менее|ограничен|avoid|do not|don't|must not|only)/i;
const EXAMPLE_PATTERN =
  /(пример|example|например|e\.g\.|for instance|образец)/i;
const CONTEXT_PATTERN =
  /(контекст|context|фон|предыстори|дано|исходн|входн|input|background)/i;
const AUDIENCE_PATTERN =
  /(аудитори|для\s+(новичк|эксперт|разработчик|менеджер)|audience|target reader|для кого)/i;
const CRITERIA_PATTERN =
  /(критери|требован|должен|должна|должно|должны|requirements?|acceptance|критерии готовности)/i;
const STACK_PATTERN =
  /(typescript|javascript|python|react|next\.?js|node|go\b|rust|java|kotlin|swift|php|sql|верси|version|стек|framework|фреймворк)/i;
const EDGE_CASE_PATTERN =
  /(граничн|edge case|ошибк|error|исключени|exception|null|undefined|пуст|валидац|валидацию)/i;
const TESTS_PATTERN = /(тест|test|spec|покрыт|coverage|unit)/i;
const TOOLS_PATTERN =
  /(инструмент|tool|команд|terminal|файл|file|read_file|grep|search|mcp|api)/i;
const STOP_PATTERN =
  /(останов|спроси|уточни|ask (me|the user)|не\s+продолжай|если неясно|если неоднозначн)/i;
const REFUSAL_PATTERN =
  /(откаж|не могу|не раскрывай|не предоставляй|refuse|do not reveal|не отвечай на)/i;
const TONE_PATTERN = /(тон|стил|tone|style|формальн|дружелюбн|кратко|лаконичн)/i;

const RULES: Rule[] = [
  {
    id: "role",
    label: "Задана роль или персона",
    weight: 12,
    hint: "Начни с «Ты — <роль> с опытом в …» — это задаёт словарь и глубину ответа.",
    test: (p) => ROLE_PATTERN.test(p),
  },
  {
    id: "context",
    label: "Есть контекст задачи",
    weight: 14,
    hint: "Опиши фон: что уже есть, зачем это нужно, что было раньше.",
    test: (p) => CONTEXT_PATTERN.test(p) || p.length > 400,
  },
  {
    id: "format",
    label: "Указан формат вывода",
    weight: 14,
    hint: "Скажи, в каком виде нужен ответ: JSON, таблица, список, код в блоке.",
    test: (p) => FORMAT_PATTERN.test(p),
  },
  {
    id: "constraints",
    label: "Есть ограничения",
    weight: 12,
    hint: "Добавь границы: чего не делать, какой объём, какие источники допустимы.",
    test: (p) => CONSTRAINT_PATTERN.test(p),
  },
  {
    id: "criteria",
    label: "Сформулированы критерии качества",
    weight: 12,
    hint: "Опиши, по каким признакам ты поймёшь, что ответ хороший.",
    test: (p) => CRITERIA_PATTERN.test(p),
  },
  {
    id: "audience",
    label: "Указана аудитория",
    weight: 8,
    hint: "Укажи, для кого результат: новичок, тимлид, заказчик.",
    test: (p) => AUDIENCE_PATTERN.test(p),
  },
  {
    id: "examples",
    label: "Есть примеры",
    weight: 8,
    hint: "Один пример «как надо» экономит три абзаца объяснений.",
    test: (p) => EXAMPLE_PATTERN.test(p),
  },
  {
    id: "structure",
    label: "Промпт структурирован",
    weight: 10,
    hint: "Разбей на блоки: Задача / Контекст / Требования / Формат.",
    test: (p) =>
      /(^|\n)\s*(#|[-*•]|\d+\.)\s+/m.test(p) || /\n\s*\n/.test(p.trim()),
  },
  {
    id: "length",
    label: "Достаточная детализация",
    weight: 10,
    hint: "Промпт короче 120 символов почти всегда недоговаривает.",
    test: (p) => p.trim().length >= 120,
  },
];

const MODE_RULES: Record<PromptMode, Rule[]> = {
  general: [],
  code: [
    {
      id: "stack",
      label: "Указан стек и версии",
      weight: 10,
      hint: "Назови язык, фреймворк и версии — иначе получишь устаревший API.",
      test: (p) => STACK_PATTERN.test(p),
    },
    {
      id: "edge-cases",
      label: "Учтены граничные случаи",
      weight: 8,
      hint: "Перечисли, что делать с пустыми значениями, ошибками и невалидным вводом.",
      test: (p) => EDGE_CASE_PATTERN.test(p),
    },
    {
      id: "tests",
      label: "Оговорены тесты",
      weight: 7,
      hint: "Попроси тесты или хотя бы сценарии проверки.",
      test: (p) => TESTS_PATTERN.test(p),
    },
  ],
  agent: [
    {
      id: "tools",
      label: "Учтены доступные инструменты",
      weight: 10,
      hint: "Опиши, какими инструментами агент может пользоваться и какие файлы трогать.",
      test: (p) => TOOLS_PATTERN.test(p),
    },
    {
      id: "stop",
      label: "Задано поведение при неоднозначности",
      weight: 10,
      hint: "Скажи агенту: «если требования неясны — остановись и спроси».",
      test: (p) => STOP_PATTERN.test(p),
    },
    {
      id: "criteria",
      label: "Есть критерии готовности",
      weight: 8,
      hint: "Опиши Definition of Done: сборка проходит, тесты зелёные, дифф минимален.",
      test: (p) => CRITERIA_PATTERN.test(p),
    },
  ],
  system: [
    {
      id: "refusal",
      label: "Описаны правила отказа",
      weight: 12,
      hint: "Укажи, на что ассистент не отвечает и как это формулирует.",
      test: (p) => REFUSAL_PATTERN.test(p),
    },
    {
      id: "tone",
      label: "Задан тон и стиль",
      weight: 10,
      hint: "Определи тон: формальный, краткий, дружелюбный.",
      test: (p) => TONE_PATTERN.test(p),
    },
    {
      id: "priority",
      label: "Задан приоритет инструкций",
      weight: 8,
      hint: "Скажи, что важнее при конфликте: безопасность, точность или краткость.",
      test: (p) => /(приоритет|важнее|в первую очередь|priority|precedence)/i.test(p),
    },
  ],
};

export function scorePrompt(prompt: string, mode: PromptMode): ScoreResult {
  const rules = [...RULES, ...MODE_RULES[mode]];
  const totalWeight = rules.reduce((sum, rule) => sum + rule.weight, 0);

  const criteria: ScoreCriterion[] = rules.map((rule) => ({
    id: rule.id,
    label: rule.label,
    weight: rule.weight,
    passed: rule.test(prompt),
    hint: rule.hint,
  }));

  const earned = criteria.reduce(
    (sum, c) => sum + (c.passed ? c.weight : 0),
    0,
  );
  const score = Math.round((earned / totalWeight) * 100);

  return {
    score,
    criteria,
    strengths: criteria.filter((c) => c.passed).map((c) => c.label),
    gaps: criteria.filter((c) => !c.passed).map((c) => c.hint),
  };
}
