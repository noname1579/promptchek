// app/api/promo/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: "Введите код" }, { status: 400 });

    const supabase = await createClient();
    
    // Ищем код в базе (регистр не важен)
    const { data: promo, error } = await supabase
      .from('promo_codes')
      .select('*')
      .ilike('code', code.trim())
      .maybeSingle();

    if (error || !promo) {
      return NextResponse.json({ error: "Промокод не найден" }, { status: 404 });
    }

    // Проверки
    if (promo.used_count >= promo.max_uses) {
      return NextResponse.json({ error: "Лимит использований исчерпан" }, { status: 400 });
    }

    // Увеличиваем счетчик использований
    await supabase
      .from('promo_codes')
      .update({ used_count: promo.used_count + 1 })
      .eq('id', promo.id);

    // Возвращаем данные для фронтенда
    return NextResponse.json({
      success: true,
      message: promo.bonus_requests > 0 
        ? `Начислено +${promo.bonus_requests} запросов!` 
        : `Тариф ${promo.plan.toUpperCase()} активирован!`,
      bonus_requests: promo.bonus_requests,
      plan: promo.plan,
    });

  } catch (err) {
    console.error("Promo Error:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}