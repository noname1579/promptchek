/**
 * lib/prompt-builder.ts
 * Функции для сборки и стриминга промптов через /api/generate.
 * Обратная совместимость: buildPrompt() вызывает API и собирает полный стрим.
 * Новая функция: streamPrompt() — построчный стрим с колбэком.
 */

import type { PromptMode } from "@/lib/types";

// --- buildPrompt: полная обратная совместимость ---

/**
 * Собирает улучшенный промпт через /api/generate.
 * Ждёт полного ответа (стрим собирается полностью).
 */
export async function buildPrompt(
  promptText: string,
  modelId?: string,
  category?: PromptMode,
): Promise<string> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: promptText, modelId, category }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Generate failed: ${response.status} ${text.slice(0, 300)}`);
  }

  const text = await response.text();
  return text.trim();
}

// --- streamPrompt: построчный стрим с колбэком ---

/**
 * Стримит улучшенный промпт по чанкам, вызывая onChunk для каждого.
 * Поддерживает отмену через AbortSignal.
 */
export async function streamPrompt(
  promptText: string,
  modelId: string,
  onChunk: (text: string) => void,
  category?: PromptMode,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: promptText, modelId, category }),
    signal,
  });

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => "");
    throw new Error(`Generate failed: ${response.status} ${text.slice(0, 300)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("");
    buffer = "";

    for (const chunk of chunks) {
      if (signal?.aborted) break;
      onChunk(chunk);
    }
  }
}
