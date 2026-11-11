import { getGigaChatClient, hasGigaChatKey } from "@/lib/llm-client";
import { scorePrompt } from "@/lib/scoring";
import { checkRateLimit, sanitizePrompt } from "@/lib/security";

// Хранилище дневных квот (в памяти)
const quotaStore = new Map<string, { count: number; resetAt: number }>();
const DAILY_LIMIT = 5;

export const maxDuration = 60; // Для Vercel

export async function POST(req: Request) {
  try {
    // 1. Получаем IP
    const ip = req.headers.get("x-forwarded-for") || "anonymous";

    // 2. Защита от спама (Rate Limit): не более 5 запросов в минуту с одного IP
    const isAllowed = checkRateLimit(ip, 5, 60000);
    if (!isAllowed) {
      return new Response(
        JSON.stringify({ error: "Слишком много запросов. Подождите минуту и попробуйте снова." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Валидация данных
    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(JSON.stringify({ error: "Неверный формат запроса" }), { status: 400 });
    }

    const safePrompt = sanitizePrompt(body.prompt);
    const mode = typeof body.mode === "string" ? body.mode : "general";

    if (!safePrompt) {
      return new Response(
        JSON.stringify({ error: "Текст должен быть от 10 до 8000 символов." }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Проверка наличия ключа LLM
    if (!hasGigaChatKey()) {
      return new Response(JSON.stringify({ error: "LLM ключ не настроен" }), { 
        status: 500, headers: { "Content-Type": "application/json" } 
      });
    }

    // 5. ПРОВЕРКА ДНЕВНОГО ЛИМИТА (КВОТЫ)
    const now = Date.now();
    let userQuota = quotaStore.get(ip);

    // Если лимита нет или он истек — создаем новый
    if (!userQuota || now > userQuota.resetAt) {
      userQuota = { count: 1, resetAt: now + 24 * 60 * 60 * 1000 };
      quotaStore.set(ip, userQuota);
    } else {
      // Если лимит есть, проверяем, не исчерпан ли он
      if (userQuota.count >= DAILY_LIMIT) {
        return new Response(
          JSON.stringify({ 
            error: `Достигнут дневной лимит (${DAILY_LIMIT} запросов). Попробуйте завтра.`,
            quota: { used: userQuota.count, limit: DAILY_LIMIT, remaining: 0, disabled: true }
          }), 
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }
      // Увеличиваем счетчик
      userQuota.count += 1;
      quotaStore.set(ip, userQuota);
    }

    // Теперь TypeScript точно знает, что userQuota не undefined
    const currentQuotaInfo = {
      used: userQuota.count,
      limit: DAILY_LIMIT,
      remaining: Math.max(0, DAILY_LIMIT - userQuota.count),
      disabled: false
    };

    // 6. ОТПРАВКА ЗАПРОСА В GIGACHAT
    const client = getGigaChatClient();
    const scoreBefore = scorePrompt(safePrompt, mode as any);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(`event: score\ndata: ${JSON.stringify({ quota: currentQuotaInfo })}\n\n`));

        let improvedText = "";

        try {
          const instruction = `Ты — эксперт по промпт-инжинирингу. Улучши следующий промпт, сделав его более точным и структурированным (добавь роль, контекст, ограничения и формат вывода). Верни ТОЛЬКО улучшенный текст промпта, без лишних вступлений и кавычек.\n\nИсходный промпт:\n${safePrompt}`;

          const gigachatStream = await client.stream({
            model: "GigaChat-2-Max",
            messages: [{ role: "user", content: instruction }],
            temperature: 0.4,
          });

          for await (const chunk of gigachatStream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              improvedText += text;
              controller.enqueue(encoder.encode(`event: delta\ndata: ${JSON.stringify({ text })}\n\n`));
            }
          }

          const scoreAfter = scorePrompt(improvedText, mode as any);

          controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({ 
            scoreAfter, 
            quota: currentQuotaInfo 
          })}\n\n`));
          
        } catch (err) {
          console.error("GigaChat Stream Error:", err);
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: (err as Error).message })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Внутренняя ошибка сервера" }), { 
      status: 500, headers: { "Content-Type": "application/json" } 
    });
  }
}