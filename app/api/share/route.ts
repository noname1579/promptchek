/**
 * app/api/share/route.ts
 * POST endpoint для создания публичной ссылки на промпт.
 * Возвращает { slug, url: /share/${slug} }.
 * Зависимости: lib/store (saveSharedTemplate).
 */

import { NextRequest, NextResponse } from "next/server";
import { saveSharedTemplate } from "@/lib/store";
import { trackServer } from "@/lib/analytics-server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const { title, prompt, mode } = (body ?? {}) as {
    title?: unknown;
    prompt?: unknown;
    mode?: unknown;
  };

  if (typeof prompt !== "string" || prompt.trim().length < 10) {
    return NextResponse.json(
      { error: "Промпт должен содержать минимум 10 символов" },
      { status: 400 },
    );
  }

  try {
    const slug = await saveSharedTemplate({
      title: (title as string) ?? "Shared Prompt",
      prompt: prompt.trim(),
      mode: (mode as string) ?? "general",
      createdAt: Date.now(),
    });

    // Получаем origin из запроса
    const origin = request.headers.get("x-forwarded-host") ??
      request.headers.get("host") ??
      "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") ?? "http";

    // Analytics
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    trackServer(ip, "share_link_created", {
      mode,
    });

    return NextResponse.json({
      slug,
      url: `${protocol}://${origin}/share/${slug}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка сохранения";
    console.error("[share] Store error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
