import { NextRequest } from "next/server";
import { streamCompletion } from "@/lib/llm/client";
import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/llm/prompts";
import { scorePrompt } from "@/lib/scoring";
import { checkRateLimit } from "@/lib/rate-limit";
import { getQuota, recordRun, type QuotaOwner } from "@/lib/quota";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PromptMode } from "@/lib/types";

const VALID_MODES: PromptMode[] = ["general", "code", "agent", "system"];
const MAX_PROMPT_LENGTH = 8000;

export const runtime = "nodejs";

/**
 * Определяет владельца квоты: залогиненный пользователь или аноним по IP.
 */
async function resolveOwner(request: NextRequest): Promise<QuotaOwner> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) return { userId: user.id, anonId: null };
    } catch {
      // Нет сессии или Supabase недоступен — работаем как аноним.
    }
  }

  return { userId: null, anonId: ip };
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return Response.json(
      { error: "Слишком много запросов. Попробуйте позже." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const { prompt, mode } = (body ?? {}) as {
    prompt?: unknown;
    mode?: unknown;
  };

  if (typeof prompt !== "string" || prompt.trim().length < 10) {
    return Response.json(
      { error: "Промпт должен содержать минимум 10 символов" },
      { status: 400 },
    );
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return Response.json(
      { error: `Промпт длиннее ${MAX_PROMPT_LENGTH} символов` },
      { status: 400 },
    );
  }

  const resolvedMode: PromptMode = VALID_MODES.includes(mode as PromptMode)
    ? (mode as PromptMode)
    : "general";

  const owner = await resolveOwner(request);
  const quota = await getQuota(owner);

  if (!quota.allowed) {
    return Response.json(
      {
        error: `Бесплатные прогоны на этот месяц закончились (${quota.limit}). Войдите, чтобы получить больше.`,
        quota,
      },
      { status: 402 },
    );
  }

  const scoreBefore = scorePrompt(prompt, resolvedMode);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      send("score", { scoreBefore, quota });

      let improved = "";
      try {
        for await (const chunk of streamCompletion(
          SYSTEM_PROMPT,
          buildUserMessage(prompt, resolvedMode),
          request.signal,
        )) {
          improved += chunk;
          send("delta", { text: chunk });
        }

        const scoreAfter = scorePrompt(improved, resolvedMode);

        // Списываем прогон только при успешном ответе модели.
        await recordRun({
          owner,
          mode: resolvedMode,
          promptChars: prompt.length,
        });

        send("done", {
          scoreAfter,
          quota: {
            ...quota,
            used: quota.used + 1,
            remaining: Math.max(0, quota.remaining - 1),
          },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Неизвестная ошибка";
          console.error("RAW LLM ERROR:", message);
        const isConfig = /LLM_API_KEY|api[_-]?key|configured|not configured/i.test(message);
        send("error", {
          message: isConfig
            ? "Улучшение промпта недоступно (не настроен ключ LLM). Разбор и оценка работают без него."
            : message,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
