// lib/security.ts

// Хранилище времени последних запросов (в памяти)
const rateLimitMap = new Map<string, number[]>();

/**
 * Проверяет, не слишком ли часто пользователь делает запросы.
 * @param ip IP-адрес пользователя
 * @param maxRequests Максимальное количество запросов
 * @param windowMs Окно времени в миллисекундах (например, 60000 = 1 минута)
 * @returns boolean - true, если запрос разрешен, false - если превышен лимит
 */
export function checkRateLimit(ip: string, maxRequests: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];

  // Оставляем только те запросы, которые были в пределах временного окна
  const validTimestamps = timestamps.filter((time) => now - time < windowMs);

  if (validTimestamps.length >= maxRequests) {
    return false; // Лимит превышен
  }

  // Добавляем текущий запрос
  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);

  // Очистка памяти от старых IP (простая защита от утечки памяти)
  if (rateLimitMap.size > 10000) {
    rateLimitMap.clear();
  }

  return true; // Разрешено
}

/**
 * Очищает и проверяет текст на безопасность.
 */
export function sanitizePrompt(text: unknown): string | null {
  if (typeof text !== "string") return null;
  const trimmed = text.trim();
  if (trimmed.length < 10 || trimmed.length > 8000) return null;
  return trimmed;
}