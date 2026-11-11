/**
 * lib/analytics-client.ts
 * Клиентская обёртка над PostHog-js.
 * "use client" — используется в React-компонентах.
 * Зависимости: posthog-js
 */

import posthog from "posthog-js";

let initialized = false;

/**
 * Импотентная инициализация PostHog.
 * Если ключ не задан — no-op.
 */
export function initAnalytics(): void {
  if (initialized) return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";

  if (!key) {
    // No-op если ключ не задан
    return;
  }

  posthog.init(key, {
    api_host: host,
    capture_pageview: false, // Ручной pageview для App Router
    autocapture: false,
  });

  initialized = true;
}

/**
 * Отслеживает событие.
 * No-op если PostHog не инициализирован.
 */
export function trackEvent(
  name: string,
  properties?: Record<string, unknown>,
): void {
  if (!initialized) return;
  posthog.capture(name, properties);
}

/**
 * Отслеживает просмотр страницы (для App Router).
 */
export function trackPageview(path: string): void {
  if (!initialized) return;
  posthog.capture("$pageview", { path });
}
