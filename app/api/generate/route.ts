import { getGigaChatClient, mapModelId, hasGigaChatKey } from "@/lib/llm-client";

export async function POST(req: Request) {
  console.log("KEY EXISTS:", !!process.env.GIGACHAT_AUTH_KEY);
  console.log("KEY LENGTH:", process.env.GIGACHAT_AUTH_KEY?.length);
  console.log("SCOPE:", process.env.GIGACHAT_SCOPE);
  const { prompt, modelId } = await req.json();

  if (!prompt || prompt.length < 10) {
    return new Response("Prompt too short", { status: 400 });
  }

  if (!hasGigaChatKey()) {
    const mock = "⚠️ GigaChat ключ не настроен. Добавьте GIGACHAT_AUTH_KEY в .env.local и перезапустите сервер.";
    return new Response(
      new ReadableStream({
        start(c) {
          c.enqueue(new TextEncoder().encode(mock));
          c.close();
        },
      }),
      { headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  const client = getGigaChatClient();
  const model = mapModelId(modelId);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        // Используем stream() для потоковой передачи токенов
        for await (const chunk of client.stream({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        })) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) controller.enqueue(encoder.encode(text));
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(`\n[ERROR] ${(err as Error).message}`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}