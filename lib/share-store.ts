// lib/share-store.ts

// Временное хранилище в памяти (для продакшена лучше использовать базу данных)
// Глобальная переменная, чтобы данные не терялись при горячей перезагрузке в dev-режиме
const globalForStore = global as unknown as { shareStore: Map<string, any> };
const store = globalForStore.shareStore || new Map<string, any>();

if (process.env.NODE_ENV !== "production") globalForStore.shareStore = store;

export async function saveSharedPrompt(slug: string, data: any) {
  store.set(slug, data);
}

export async function readSharedPrompt(slug: string) {
  return store.get(slug) || null;
}

export function generateSlug() {
  return Math.random().toString(36).substring(2, 10);
}