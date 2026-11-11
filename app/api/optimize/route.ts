// app/api/optimize/route.ts
import { getGigaChatClient } from "@/lib/llm-client";

const JUDGE_PROMPT = `Ты — эксперт по промптам. Сравни два промпта для одной задачи.
Задача: {task}
Промпт A: {a}
Промпт B: {b}

Оцени: ясность, конкретность, полноту ограничений, указание формата.
Верни ТОЛЬКО валидный JSON без markdown: {"winner": "A" | "B" | "tie", "reasoning": "кратко"}`;

async function callJudge(task: string, first: string, second: string) {
  const client = getGigaChatClient();
  const res = await client.chat({
    model: "GigaChat-2-Max",
    temperature: 0,
    messages: [
      {
        role: "user",
        content: JUDGE_PROMPT.replace("{task}", task)
          .replace("{a}", first)
          .replace("{b}", second),
      },
    ],
  });

  const raw = res.choices[0]?.message.content || "";
  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return { winner: "tie", reasoning: "Ошибка парсинга ответа судьи" };
  }
}

export async function POST(req: Request) {
  const { task, promptA, promptB } = await req.json();

  if (!task || !promptA || !promptB) {
    return Response.json({ error: "Не хватает полей" }, { status: 400 });
  }

  try {
    const [r1, r2] = await Promise.all([
      callJudge(task, promptA, promptB),
      callJudge(task, promptB, promptA),
    ]);

    const swapped = r2.winner === "A" ? "B" : r2.winner === "B" ? "A" : "tie";

    if (r1.winner === swapped) {
      return Response.json({ winner: r1.winner, reasoning: r1.reasoning });
    }
    return Response.json({
      winner: "tie",
      reasoning: "Обнаружен position bias, результаты противоречивы.",
    });
  } catch (err) {
    return Response.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}