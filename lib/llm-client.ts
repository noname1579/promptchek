import GigaChat from "gigachat";
import { Agent } from "node:https";

// Отключаем проверку сертификата для локальной разработки.
// В production лучше установить сертификаты Минцифры.
const httpsAgent = new Agent({
  rejectUnauthorized: false,
});

export function getGigaChatClient() {
  const credentials = process.env.GIGACHAT_AUTH_KEY;
  if (!credentials) {
    throw new Error("GIGACHAT_AUTH_KEY не задан в .env.local");
  }

  return new GigaChat({
    credentials,
    scope: process.env.GIGACHAT_SCOPE || "GIGACHAT_API_PERS",
    baseUrl: "https://api.giga.chat/v1",
    model: "GigaChat-2-Max",
    timeout: 600,
    httpsAgent,
  });
}

export function mapModelId(modelId: string): string {
  switch (modelId) {
    case "chatgpt":
    case "cursor":
      return "GigaChat-2-Max";
    case "claude":
      return "GigaChat-2-Pro";
    default:
      return "GigaChat-2-Max";
  }
}

export function hasGigaChatKey(): boolean {
  return Boolean(process.env.GIGACHAT_AUTH_KEY);
}