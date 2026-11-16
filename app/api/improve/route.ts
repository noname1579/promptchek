// app/api/improve/route.ts
import { getGigaChatClient, hasGigaChatKey } from "@/lib/llm-client";
import { scorePrompt } from "@/lib/scoring";
import { sanitizePrompt } from "@/lib/security";
import { FREE_LIMIT, PRO_LIMIT, PRO_PLUS_LIMIT } from "@/lib/quota-store";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "anonymous";
    
    const body = await req.json().catch(() => null);
    if (!body) return new Response(JSON.stringify({ error: "Неверный формат" }), { status: 400 });

    const safePrompt = sanitizePrompt(body.prompt);
    const mode = typeof body.mode === "string" ? body.mode : "general";

    if (!safePrompt) {
      return new Response(JSON.stringify({ error: "Текст должен быть от 10 до 8000 символов." }), { status: 400 });
    }

    if (!hasGigaChatKey()) {
      return new Response(JSON.stringify({ error: "LLM ключ не настроен" }), { status: 500 });
    }

    // --- ПРОВЕРКА ПОЛЬЗОВАТЕЛЯ И ПОДПИСКИ ---
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

    // --- ПРОВЕРКА И ОБНОВЛЕНИЕ КВОТЫ В БД ---
    const now = new Date();
    let currentQuotaInfo = { used: 0, limit: currentLimit, remaining: currentLimit, disabled: false, plan: planName };

    // Определяем, как искать квоту (по user_id или по IP)
    let query = supabase.from('user_quotas').select('*');
    if (user) {
      query = query.eq('user_id', user.id);
    } else {
      query = query.eq('ip_address', ip);
    }

    const { data: quotaData } = await query.maybeSingle();

    if (!quotaData || new Date(quotaData.reset_at) < now) {
      // Создаем новую запись
      const resetAt = new Date();
      resetAt.setDate(resetAt.getDate() + 1);
      
      await supabase.from('user_quotas').insert({
        user_id: user?.id || null,
        ip_address: user ? null : ip,
        count: 1,
        reset_at: resetAt.toISOString()
      });
      
      currentQuotaInfo = { used: 1, limit: currentLimit, remaining: currentLimit - 1, disabled: false, plan: planName };
    } else {
      if (quotaData.count >= currentLimit) {
        return new Response(
          JSON.stringify({ 
            error: "limit_reached",
            message: `Достигнут дневной лимит (${currentLimit} запросов). Попробуйте завтра или активируйте Pro.`,
            quota: { used: quotaData.count, limit: currentLimit, remaining: 0, disabled: true, plan: planName }
          }), 
          { status: 429 }
        );
      }
      
      await supabase.from('user_quotas').update({ count: quotaData.count + 1 }).eq('id', quotaData.id);
      
      currentQuotaInfo = { used: quotaData.count + 1, limit: currentLimit, remaining: currentLimit - (quotaData.count + 1), disabled: false, plan: planName };
    }

    // --- ЗАПРОС К GIGACHAT ---
    const client = getGigaChatClient();
    const scoreBefore = scorePrompt(safePrompt, mode as any);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(`event: score\ndata: ${JSON.stringify({ quota: currentQuotaInfo })}\n\n`));

        let improvedText = "";

        try {
          const instruction = `Ты — эксперт по промпт-инжинирингу. Улучши следующий промпт, сделав его более точным и структурированным. Верни ТОЛЬКО улучшенный текст промпта.\n\nИсходный промпт:\n${safePrompt}`;
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
          controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({ scoreAfter, quota: currentQuotaInfo })}\n\n`));
        } catch (err) {
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: (err as Error).message })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Внутренняя ошибка сервера" }), { status: 500 });
  }
}