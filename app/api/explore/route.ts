// app/api/explore/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scorePrompt } from "@/lib/scoring";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Берем 50 последних публичных промптов
    const { data, error } = await supabase
      .from('history')
      .select('id, prompt, improved, mode, created_at')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Считаем оценку для каждого и фильтруем (оставляем только 90+)
    const promptsWithScore = data
      .map(item => ({
        ...item,
        score: scorePrompt(item.improved, item.mode as any).score
      }))
      .filter(item => item.score >= 90)
      .sort((a, b) => b.score - a.score);

    return NextResponse.json(promptsWithScore);
  } catch (error) {
    console.error("Explore API Error:", error);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}