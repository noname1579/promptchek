/**
 * lib/judge.ts
 * LLM-as-Judge: сравнение двух промптов через GPT-4o-mini.
 * Двойной вызов с перестановкой порядка (A,B) и (B,A) для устранения position bias.
 * Зависимости: openai
 */

import OpenAI from "openai";

// --- Типы ---

export interface JudgeResult {
  winner: "A" | "B" | "tie";
  reasoning: string;
  scores?: { A: number; B: number };
}

export interface JudgeCompareInput {
  task: string;
  a: string;
  b: string;
}

// --- Константы ---

const JUDGE_PROMPT = `You are an expert prompt evaluator. Compare two prompts for the same task.

Task: """
{{TASK}}
"""

Prompt A: """
{{A}}
"""

Prompt B: """
{{B}}
"""

Evaluate both prompts on:
1. Clarity — how clear and unambiguous is the instruction?
2. Completeness — does it include role, context, constraints, format?
3. Actionability — can an LLM execute it without guessing?
4. Robustness — does it handle edge cases or specify behavior?

Return ONLY a JSON object with this exact structure:
{
  "winner": "A" or "B",
  "reasoning": "concise explanation (2-4 sentences)",
  "scores": { "A": 0-100, "B": 0-100 }
}

Do NOT include any text outside the JSON object.`;

/**
 * Заменяет плейсхолдеры в промпте судьи.
 */
function renderJudgePrompt(task: string, a: string, b: string): string {
  return JUDGE_PROMPT
    .replace("{{TASK}}", task)
    .replace("{{A}}", a)
    .replace("{{B}}", b);
}

/**
 * Парсит JSON-ответ от LLM-судьи.
 */
function parseJudgeResponse(text: string): JudgeResult | null {
  try {
    // Извлекаем JSON из возможного markdown-обёртывания
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]) as Partial<JudgeResult>;
    if (!parsed.winner || !parsed.reasoning) return null;
    if (!["A", "B", "tie"].includes(parsed.winner)) return null;
    return {
      winner: parsed.winner as "A" | "B" | "tie",
      reasoning: parsed.reasoning,
      scores: parsed.scores,
    } as JudgeResult;
  } catch {
    return null;
  }
}

/**
 * Делает один вызов GPT-4o-mini для судейства.
 */
async function judgeOnce(
  client: OpenAI,
  task: string,
  a: string,
  b: string,
): Promise<JudgeResult | null> {
  const prompt = renderJudgePrompt(task, a, b);

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
    response_format: { type: "json_object" },
    max_tokens: 1024,
  });

  const text = completion.choices?.[0]?.message?.content ?? "";
  return parseJudgeResponse(text);
}

/**
 * Сравнивает два промпта через LLM-as-Judge.
 * Двойной вызов: порядок (A,B) и (B,A).
 * Если оба согласны — winner определён.
 * Если противоречие — "tie" с reasoning о position bias.
 */
export async function comparePrompts(
  input: JudgeCompareInput,
): Promise<JudgeResult> {
  const { task, a, b } = input;
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.LLM_API_KEY;

  // Fallback: мок-результат если нет ключа
  if (!apiKey) {
    console.warn("[judge] API key не найден — мок-результат");
    return {
      winner: Math.random() > 0.5 ? "A" : "B",
      reasoning: "API key отсутствует. Это мок-результат для dev-режима.",
      scores: { A: Math.round(Math.random() * 40 + 50), B: Math.round(Math.random() * 40 + 50) },
    };
  }

  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  // Раунд 1: порядок A, B
  const result1 = await judgeOnce(client, task, a, b);

  // Раунд 2: порядок B, A (перестановка для устранения bias)
  const result2 = await judgeOnce(client, task, b, a);

  if (!result1 && !result2) {
    return {
      winner: "tie",
      reasoning: "Не удалось получить результат от судьи ни в одном раунде.",
    };
  }

  if (!result1 || !result2) {
    const winner = result1?.winner ?? result2?.winner ?? "tie";
    const reasoning = [result1?.reasoning, result2?.reasoning]
      .filter(Boolean)
      .join(". ")
      || "Частичный результат судьи.";
    return { winner, reasoning };
  }

  // Оба раунда вернули результат
  // Для раунда 2 мы поменяли A и B местами, поэтому нужно инвертировать winner
  let winner2 = result2.winner;
  if (winner2 === "A") winner2 = "B";
  else if (winner2 === "B") winner2 = "A";

  // Склоняемся
  if (result1.winner === winner2) {
    // Согласие — winner определён
    const combinedReasoning = [result1.reasoning, result2.reasoning].join(" ");
    const scoresA = result1.scores?.A;
    const scoresB = result1.scores?.B;

    return {
      winner: result1.winner,
      reasoning: combinedReasoning,
      scores: scoresA && scoresB ? { A: scoresA, B: scoresB } : undefined,
    };
  }

  // Противоречие — position bias
  return {
    winner: "tie",
    reasoning: "Position bias detected: судьи выбрали разные варианты при перестановке порядка. Промпты сопоставимы.",
    scores: {
      A: (result1.scores?.A ?? 50) + (result2.scores?.B ?? 50),
      B: (result1.scores?.B ?? 50) + (result2.scores?.A ?? 50),
    },
  };
}
