/**
 * lib/analytics-server.ts
 * Серверная обёртка над PostHog-node.
 * Используется в Route Handlers для точных метрик.
 * Зависимости: posthog-node
 */

import { PostHog } from "posthog-node";

let posthogServer: PostHog | null = null;

/**
 * Получает синглтон PostHog для сервера.
 * Возвращает null если ключ не задан.
 */
export function getPostHog(): PostHog | null {
  if (posthogServer) return posthogServer;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;

  posthogServer = new PostHog(key, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });

  return posthogServer;
}

/**
 * Отслеживает серверное событие.
 * No-op если PostHog недоступен.
 */
export function trackServer(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
): void {
  const client = getPostHog();
  if (!client) return;

  client.capture({
    distinctId,
    event,
    properties,
  });
}

/**
 * Корректно останавливает клиент (вызывается при graceful shutdown).
 */
export function shutdownAnalytics(): Promise<void> {
  if (posthogServer) {
    return posthogServer.shutdown();
  }
  return Promise.resolve();
}
