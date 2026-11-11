// app/api/share/route.ts
import { NextResponse } from "next/server";
import { saveSharedPrompt, generateSlug } from "@/lib/share-store";

export async function POST(req: Request) {
  try {
    const { title, prompt, mode } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Нет текста" }, { status: 400 });
    }

    const slug = generateSlug();
    await saveSharedPrompt(slug, { title, prompt, mode, createdAt: Date.now() });

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    
    return NextResponse.json({ url: `${protocol}://${host}/share/${slug}` });
  } catch (error) {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}