export interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export function getLlmConfig(): LlmConfig {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error(
      "LLM_API_KEY не задан. Создайте .env.local в корне проекта и перезапустите сервер.",
    );
  }

  return {
    baseUrl: (process.env.LLM_BASE_URL ?? "https://openrouter.ai/api/v1").replace(
      /\/$/,
      "",
    ),
    apiKey,
    model: process.env.LLM_MODEL ?? "nvidia/nemotron-3-ultra-550b-a55b:free",
  };
}

interface ChatChunk {
  choices?: Array<{ delta?: { content?: string } }>;
}

/**
 * Стримит ответ модели как plain text.
 * Работает с любым OpenAI-совместимым /chat/completions.
 */
export async function* streamCompletion(
  system: string,
  user: string,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const config = getLlmConfig();

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      stream: true,
      temperature: 0.4,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    signal,
  });

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `LLM request failed: ${response.status} ${detail.slice(0, 300)}`,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;

      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") return;

      try {
        const chunk = JSON.parse(payload) as ChatChunk;
        const text = chunk.choices?.[0]?.delta?.content;
        if (text) yield text;
      } catch {
        // Неполный JSON в потоке — пропускаем, следующий чанк дополнит буфер.
      }
    }
  }
}
