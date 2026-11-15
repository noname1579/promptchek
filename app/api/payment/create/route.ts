// app/api/payment/create/route.ts
import { NextResponse } from "next/server";
import { YooKassa, CurrencyEnum, IConfirmationRedirect } from "@webzaytsev/yookassa-ts-sdk";
import { createClient } from "@/lib/supabase/server";

const sdk = YooKassa({
  shop_id: process.env.YOOKASSA_SHOP_ID!,
  secret_key: process.env.YOOKASSA_SECRET_KEY!,
});

export async function POST(req: Request) {
  try {
    const { planId } = await req.json();
    
    // Проверяем, что пользователь авторизован
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Необходимо войти в аккаунт" }, { status: 401 });
    }

    // Определяем цену и описание
    let amount = "149.00";
    let description = "Подписка Promptchek Pro (1 месяц)";
    if (planId === "pro_plus") {
      amount = "399.00";
      description = "Подписка Promptchek Pro+ (1 месяц)";
    }

    // Создаём платёж в ЮKassa
    const payment = await sdk.payments.create({
      amount: { 
        value: amount, 
        currency: CurrencyEnum.RUB // <-- Исправлено
      },
      confirmation: {
        type: "redirect",
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?success=true`,
      } as IConfirmationRedirect, // <-- Приводим тип
      capture: true,
      description,
      metadata: {
        user_id: user.id,
        plan: planId,
      },
    });

    // Возвращаем ссылку на оплату
    // Проверяем, что confirmation_url существует
    const confirmationUrl = (payment.confirmation as IConfirmationRedirect)?.confirmation_url;

    if (!confirmationUrl) {
      throw new Error("ЮKassa не вернула ссылку на оплату");
    }

    return NextResponse.json({ 
      confirmationUrl 
    });

  } catch (error) {
    console.error("YooKassa Create Error:", error);
    return NextResponse.json({ error: "Ошибка создания платежа" }, { status: 500 });
  }
}