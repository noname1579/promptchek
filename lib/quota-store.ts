// lib/quota-store.ts
export const quotaStore = new Map<string, { count: number; resetAt: number }>();
export const FREE_LIMIT = 5;
export const PRO_LIMIT = 100;
export const PRO_PLUS_LIMIT = 500;