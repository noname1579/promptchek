/**
 * lib/store.ts
 * Абстракция хранилища для shared templates.
 * Использует fs/promises (.data/shared.json) на сервере.
 * Зависимости: fs/promises (только серверный код).
 */

import fs from "fs/promises";
import path from "path";

// --- Типы ---

export interface SharedTemplate {
  id: string;
  title: string;
  prompt: string;
  mode: string;
  createdAt: number;
  slug: string;
}

// --- Путь к файлу хранилища ---

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "shared.json");

/**
 * Гарантирует существование директории и файла хранилища.
 */
async function ensureStore(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.writeFile(STORE_FILE, JSON.stringify([], null, 2));
  }
}

/**
 * Читает всё хранилище.
 */
async function readStore(): Promise<SharedTemplate[]> {
  await ensureStore();
  const raw = await fs.readFile(STORE_FILE, "utf-8");
  return JSON.parse(raw) as SharedTemplate[];
}

/**
 * Записывает всё хранилище.
 */
async function writeStore(store: SharedTemplate[]): Promise<void> {
  await ensureStore();
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2));
}

/**
 * Генерирует уникальный slug (10 символов, alphanumeric).
 */
function generateSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Сохраняет shared template, возвращает slug.
 */
export async function saveSharedTemplate(
  template: Omit<SharedTemplate, "slug" | "id">,
): Promise<string> {
  const store = await readStore();
  const slug = generateSlug();
  const id = crypto.randomUUID();
  const entry: SharedTemplate = { ...template, slug, id };

  // Проверяем уникальность slug
  const existing = store.find((t) => t.slug === slug);
  if (existing) {
    // Если slug занял — генерируем заново (редко)
    return saveSharedTemplate(template);
  }

  store.push(entry);
  await writeStore(store);
  return slug;
}

/**
 * Получает shared template по slug.
 */
export async function getSharedTemplate(
  slug: string,
): Promise<SharedTemplate | null> {
  const store = await readStore();
  return store.find((t) => t.slug === slug) ?? null;
}

/**
 * Удаляет shared template по slug.
 */
export async function deleteSharedTemplate(slug: string): Promise<boolean> {
  const store = await readStore();
  const filtered = store.filter((t) => t.slug !== slug);
  if (filtered.length === store.length) return false;
  await writeStore(filtered);
  return true;
}
