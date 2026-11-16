// app/api/quota/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FREE_LIMIT, PRO_LIMIT, PRO_PLUS_LIMIT } from "@/lib/quota-store";

export async function GET(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "anonymous";
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    let currentLimit = FREE_LIMIT;
    let planName = "free";

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, plan_expires_at')
        .eq('id', user.id)
        .maybeSingle();
        
      if (profile) {
        const isExpired = profile.plan_expires_at && new Date(profile.plan_expires_at) < new Date();
        if (!isExpired && profile.plan !== 'free') {
          planName = profile.plan;
          currentLimit = profile.plan === 'pro' ? PRO_LIMIT : PRO_PLUS_LIMIT;
        }
      }
    }

    // Ищем квоту (по user_id или по IP)
    let query = supabase.from('user_quotas').select('*');
    if (user) {
      query = query.eq('user_id', user.id);
    } else {
      query = query.eq('ip_address', ip);
    }

    const { data: quotaData } = await query.maybeSingle();

    if (!quotaData || new Date(quotaData.reset_at) < new Date()) {
      return NextResponse.json({ used: 0, limit: currentLimit, remaining: currentLimit, plan: planName });
    }

    return NextResponse.json({
      used: quotaData.count,
      limit: currentLimit,
      remaining: Math.max(0, currentLimit - quotaData.count),
      plan: planName
    });
  } catch (error) {
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}