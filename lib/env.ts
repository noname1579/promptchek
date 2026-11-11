// lib/env.ts
const requiredEnvVars = ["GIGACHAT_AUTH_KEY"];

export function validateEnv() {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`⚠️ ВНИМАНИЕ: Отсутствуют переменные окружения: ${missing.join(", ")}`);
    console.warn("Добавьте их в .env.local (или в Vercel Environment Variables)");
  }
}