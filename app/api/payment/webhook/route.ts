// app/api/payment/webhook/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Нас интересует только успешная оплата
    if (body.event === "payment.succeeded") {
      const payment = body.object;
      const userId = payment.metadata?.user_id;
      const plan = payment.metadata?.plan;

      if (userId && plan) {
        const supabase = await createClient();
        
        // Начисляем подписку на 30 дней
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await supabase
          .from('profiles')
          .update({
            plan: plan,
            plan_expires_at: expiresAt.toISOString(),
          })
          .eq('id', userId);
      }
    }

    // ЮKassa требует ответ 200, иначе будет повторять запрос
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}