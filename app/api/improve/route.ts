// app/api/improve/route.ts
import { getGigaChatClient, hasGigaChatKey } from "@/lib/llm-client";
import { scorePrompt } from "@/lib/scoring";
import { checkRateLimit, sanitizePrompt } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import { quotaStore, FREE_LIMIT, PRO_LIMIT, PRO_PLUS_LIMIT } from "@/lib/quota-store"; // <-- Импорт

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "anonymous";
    
    // Лимит для защиты от спама (запросов в минуту)
    const isAllowed = checkRateLimit(ip, process.env.NODE_ENV === "development" ? 50 : 5, 60000);

    if (!isAllowed) {
      return new Response(
        JSON.stringify({ error: "Слишком много запросов. Подождите минуту и попробуйте снова." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) return new Response(JSON.stringify({ error: "Неверный формат запроса" }), { status: 400 });

    const safePrompt = sanitizePrompt(body.prompt);
    const mode = typeof body.mode === "string" ? body.mode : "general";

    if (!safePrompt) {
      return new Response(JSON.stringify({ error: "Текст должен быть от 10 до 8000 символов." }), 
        { status: 400, headers: { "Content-Type": "application/json" } });
    }

    if (!hasGigaChatKey()) {
      return new Response(JSON.stringify({ error: "LLM ключ не настроен" }), { 
        status: 500, headers: { "Content-Type": "application/json" } });
    }

    // --- ПРОВЕРКА ПОДПИСКИ ---
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    let currentLimit = FREE_LIMIT;
    let planName = "free";

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, plan_expires_at')
        .eq('id', user.id)
        .maybeSingle();
        
      if (profile) {
        const isExpired = profile.plan_expires_at && new Date(profile.plan_expires_at) < new Date();
        if (!isExpired && profile.plan !== 'free') {
          planName = profile.plan;
          currentLimit = profile.plan === 'pro' ? PRO_LIMIT : PRO_PLUS_LIMIT;
        }
      }
    }

    // --- ПРОВЕРКА ДНЕВНОГО ЛИМИТА ---
    const now = Date.now();
    let userQuota = quotaStore.get(ip); // <-- Берем из общего хранилища

    if (!userQuota || now > userQuota.resetAt) {
      userQuota = { count: 1, resetAt: now + 24 * 60 * 60 * 1000 };
      quotaStore.set(ip, userQuota);
    } else {
      if (userQuota.count >= currentLimit) {
        return new Response(
          JSON.stringify({ 
            error: "limit_reached",
            message: `Достигнут дневной лимит (${currentLimit} запросов). Попробуйте завтра или активируйте Pro.`,
            quota: { used: userQuota.count, limit: currentLimit, remaining: 0, disabled: true }
          }), 
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }
      userQuota.count += 1;
      quotaStore.set(ip, userQuota);
    }

    const currentQuotaInfo = {
      used: userQuota.count,
      limit: currentLimit,
      remaining: Math.max(0, currentLimit - userQuota.count),
      disabled: false,
      plan: planName
    };

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