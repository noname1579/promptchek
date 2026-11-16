// app/api/share/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { prompt, improved, mode } = await req.json();
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Необходимо войти в аккаунт, чтобы делиться промптами" }, { status: 401 });
    }

    // Сохраняем промпт в историю с флагом is_public
    const { data, error } = await supabase
      .from('history')
      .insert({
        user_id: user.id,
        prompt: prompt,
        improved: improved,
        mode: mode,
        is_public: true 
      })
      .select()
      .single();

    if (error) throw error;

    // Возвращаем ссылку на страницу /explore (или можно на /share, если хотите)
    return NextResponse.json({ url: `/explore` });
  } catch (error) {
    console.error("Share API Error:", error);
    return NextResponse.json({ error: "Ошибка при шаринге" }, { status: 500 });
  }
}