// lib/scoring.ts
import type { PromptMode, ScoreResult, ScoreCriterion } from "./types";

// Вспомогательная функция для проверки наличия слов
function has(text: string, words: string[]): boolean {
  const lower = text.toLowerCase();
  return words.some((w) => lower.includes(w));
}

export function scorePrompt(text: string, mode: PromptMode): ScoreResult {
  const criteria: ScoreCriterion[] = [];
  const gaps: string[] = [];
  let score = 0;

  const add = (id: string, label: string, passed: boolean, weight: number, hint: string) => {
    criteria.push({ id, label, passed, weight, hint });
    if (passed) score += weight;
    else gaps.push(hint);
  };

  // 1. Роль или персона
  const hasRole = has(text, ["ты —", "ты –", "выступи", "acting as", "роль", "представь", "ты являешься"]);
  add("role", "Задана роль или персона", hasRole, 10, "Добавьте роль (например, «Ты — Senior Developer»)");

  // 2. Контекст
  const hasContext = has(text, ["контекст", "ситуация", "проект", "задача", "проблема", "цель"]);
  add("context", "Есть контекст задачи", hasContext, 10, "Опишите контекст (для чего это нужно)");

  // 3. Формат вывода
  const hasFormat = has(text, ["формат", "выведи", "выдай", "напиши в виде", "markdown", "json", "таблиц", "список"]);
  add("format", "Указан формат вывода", hasFormat, 10, "Укажите формат ответа (таблица, список, JSON)");

  // 4. Ограничения
  const hasConstraints = has(text, ["ограничени", "не более", "до", "максимум", "без", "исключи", "избегай"]);
  add("constraints", "Есть ограничения", hasConstraints, 10, "Добавьте ограничения (длина, стиль, запреты)");

  // 5. Критерии качества
  const hasQuality = has(text, ["качеств", "критерии", "оценивай", "фокус", "акцент"]);
  add("quality", "Сформулированы критерии качества", hasQuality, 5, "Опишите, что значит «хороший» результат");

  // 6. Аудитория
  const hasAudience = has(text, ["аудитори", "для кого", "пользовател", "читател", "новичк", "эксперт", "b2b", "b2c"]);
  add("audience", "Указана аудитория", hasAudience, 5, "Для кого этот текст/код?");

  // 7. Примеры
  const hasExamples = has(text, ["пример", "образец", "например", "вроде", "похоже на"]);
  add("examples", "Есть примеры", hasExamples, 10, "Приведите пример желаемого результата (few-shot)");

  // 8. Структура
  const hasStructure = has(text, ["шаг", "пункт", "сначала", "затем", "структур", "план", "1.", "2."]);
  add("structure", "Промпт структурирован", hasStructure, 10, "Используйте списки или пошаговую структуру");

  // 9. Детализация
  const isDetailed = text.length > 150;
  add("detail", "Достаточная детализация", isDetailed, 10, "Раскройте задачу подробнее (минимум 150 символов)");

  // 10. Стек и версии (специфично для кода)
  const hasStack = mode === "code" ? has(text, ["js", "typescript", "python", "react", "vue", "node", "стек", "версия", "tailwind"]) : true;
  add("stack", "Указан стек и версии", hasStack, 5, "Укажите язык, фреймворк и версии");

  // 11. Граничные случаи (специфично для кода)
  const hasEdgeCases = mode === "code" ? has(text, ["edge case", "граничн", "ошибк", "исключени", "пустой", "null"]) : true;
  add("edge", "Учтены граничные случаи", hasEdgeCases, 5, "Упомяните обработку ошибок и крайние случаи");

  // 12. Тесты (специфично для кода)
  const hasTests = mode === "code" ? has(text, ["тест", "jest", "vitest", "unit", "проверк"]) : true;
  add("tests", "Оговорены тесты", hasTests, 10, "Попросите написать тесты или учесть их");

  // Ограничиваем счет до 100
  score = Math.min(100, score);

  // --- ИСПРАВЛЕНИЕ ОШИБОК ТИПИЗАЦИИ ---
  // Мы явно приводим типы, чтобы TypeScript не ругался на возможный undefined
  const strengths = criteria
    .filter((c) => c.passed)
    .map((c) => c.label) as string[]; // <-- Явное приведение к string[]

  // Возвращаем результат, гарантируя, что gaps — это массив строк
  return {
    score,
    criteria,
    strengths,
    gaps: gaps.filter((g): g is string => typeof g === "string"), // <-- Фильтрация undefined
  };
}