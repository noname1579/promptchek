// app/api/quota/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { quotaStore, FREE_LIMIT, PRO_LIMIT, PRO_PLUS_LIMIT } from "@/lib/quota-store";

export async function GET(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "anonymous";
    
    // Проверяем тариф пользователя
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    let currentLimit = FREE_LIMIT;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, plan_expires_at')
        .eq('id', user.id)
        .maybeSingle();
        
      if (profile) {
        const isExpired = profile.plan_expires_at && new Date(profile.plan_expires_at) < new Date();
        if (!isExpired && profile.plan !== 'free') {
          currentLimit = profile.plan === 'pro' ? PRO_LIMIT : PRO_PLUS_LIMIT;
        }
      }
    }

    // Читаем текущее использование из общего хранилища
    const now = Date.now();
    let userQuota = quotaStore.get(ip);

    if (!userQuota || now > userQuota.resetAt) {
      return NextResponse.json({ used: 0, limit: currentLimit, remaining: currentLimit });
    }

    return NextResponse.json({
      used: userQuota.count,
      limit: currentLimit,
      remaining: Math.max(0, currentLimit - userQuota.count),
    });
  } catch (error) {
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}