// app/api/optimize/route.ts
import { NextResponse } from "next/server";
import { getGigaChatClient, hasGigaChatKey } from "@/lib/llm-client";
import { scorePrompt } from "@/lib/scoring";
import { sanitizePrompt } from "@/lib/security";
import { quotaStore, FREE_LIMIT, PRO_LIMIT, PRO_PLUS_LIMIT } from "@/lib/quota-store";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "anonymous";
    
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Неверный формат" }, { status: 400 });

    const safePrompt = sanitizePrompt(body.prompt);
    const mode = typeof body.mode === "string" ? body.mode : "general";

    if (!safePrompt) {
      return NextResponse.json({ error: "Текст должен быть от 10 до 8000 символов." }, { status: 400 });
    }

    if (!hasGigaChatKey()) {
      return NextResponse.json({ error: "LLM ключ не настроен" }, { status: 500 });
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

    // ЖЕСТКАЯ ЗАЩИТА: Если план free — 403
    if (planName === "free") {
      return NextResponse.json({ error: "Функция доступна только на тарифе Pro" }, { status: 403 });
    }

    // --- ПРОВЕРКА И ОБНОВЛЕНИЕ КВОТЫ ---
    const now = new Date();
    let currentQuotaInfo = { used: 0, limit: currentLimit, remaining: currentLimit, disabled: false, plan: planName };

    if (user) {
      // Если пользователь авторизован — храним в БД
      const { data: quotaData } = await supabase
        .from('user_quotas')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!quotaData || new Date(quotaData.reset_at) < now) {
        const resetAt = new Date();
        resetAt.setDate(resetAt.getDate() + 1);
        
        await supabase.from('user_quotas').upsert({
          user_id: user.id,
          count: 1,
          reset_at: resetAt.toISOString()
        });
        
        currentQuotaInfo = { used: 1, limit: currentLimit, remaining: currentLimit - 1, disabled: false, plan: planName };
      } else {
        if (quotaData.count >= currentLimit) {
          return NextResponse.json(
            { 
              error: "limit_reached",
              message: `Достигнут дневной лимит (${currentLimit} запросов).`,
              quota: { used: quotaData.count, limit: currentLimit, remaining: 0, disabled: true, plan: planName }
            }, 
            { status: 429 }
          );
        }
        
        await supabase.from('user_quotas').update({ count: quotaData.count + 1 }).eq('user_id', user.id);
        
        currentQuotaInfo = { used: quotaData.count + 1, limit: currentLimit, remaining: currentLimit - (quotaData.count + 1), disabled: false, plan: planName };
      }
    } else {
      // Для гостей (хотя сюда они не должны попадать из-за проверки тарифа выше)
      let userQuota = quotaStore.get(ip);
      if (!userQuota || Date.now() > userQuota.resetAt) {
        userQuota = { count: 1, resetAt: Date.now() + 24 * 60 * 60 * 1000 };
        quotaStore.set(ip, userQuota);
      } else {
        if (userQuota.count >= currentLimit) {
          return NextResponse.json(
            { error: "limit_reached", message: "Достигнут лимит.", quota: { used: userQuota.count, limit: currentLimit, remaining: 0, disabled: true } }, 
            { status: 429 }
          );
        }
        userQuota.count += 1;
        quotaStore.set(ip, userQuota);
      }
      currentQuotaInfo = { used: userQuota.count, limit: currentLimit, remaining: Math.max(0, currentLimit - userQuota.count), disabled: false, plan: planName };
    }

    // --- ЗАПРОС К GIGACHAT ---
    const client = getGigaChatClient();
    const instruction = `Ты — эксперт по промпт-инжинирингу. Твоя задача — улучшить следующий промпт, сделав его максимально точным, структурированным и профессиональным. 
Добавь в него недостающие элементы: роль (кто ты), контекст (для чего это нужно), ограничения (чего нельзя делать), формат вывода (как должен выглядеть ответ) и критерии качества.
Верни ТОЛЬКО улучшенный текст промпта, без лишних вступлений, объяснений и кавычек.

Исходный промпт:
${safePrompt}`;

    const response = await client.chat({
      model: "GigaChat-2-Max",
      messages: [{ role: "user", content: instruction }],
      temperature: 0.3,
    });

    const improvedText = response.choices[0]?.message.content?.trim() || safePrompt;
    const scoreAfter = scorePrompt(improvedText, mode as any);

    return NextResponse.json({ 
      improvedPrompt: improvedText,
      score: scoreAfter.score,
      quota: currentQuotaInfo // <-- Возвращаем обновленную квоту
    });

  } catch (error) {
    console.error("Optimize Error:", error);
    return NextResponse.json({ error: "Ошибка при улучшении промпта" }, { status: 500 });
  }
}