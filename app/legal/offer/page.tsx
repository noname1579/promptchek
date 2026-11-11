// app/legal/offer/page.tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function OfferPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4" /> На главную
        </Link>
        
        <h1 className="text-2xl font-bold text-white mb-6">Публичная оферта на оказание услуг</h1>
        <p className="text-sm text-slate-500 mb-8">Дата последнего обновления: {new Date().toLocaleDateString("ru-RU")}</p>

        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Общие положения</h2>
            <p>Настоящая оферта является официальным предложением физического лица, применяющего специальный налоговый режим «Налог на профессиональный доход» (далее — Исполнитель), заключить договор на оказание услуг (далее — Услуги) с любым дееспособным физическим лицом (далее — Заказчик).</p>
            <p>Исполнитель: Ляшенко Илья Александрович, ИНН: 616513540703.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Предмет договора</h2>
            <p>Исполнитель оказывает Заказчику услуги по предоставлению доступа к функционалу платформы Promptchek (далее — Сервис), включая улучшение промптов с использованием технологий искусственного интеллекта, в соответствии с выбранным тарифным планом.</p>
            <p>Актуальные тарифы и их стоимость размещены на странице <Link href="/pricing" className="text-indigo-400 underline">Тарифы</Link>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Порядок оплаты и акцепт</h2>
            <p>Оплата Услуг производится на условиях 100% предоплаты. Акцептом настоящей оферты является факт успешной оплаты Заказчиком выбранного тарифного плана.</p>
            <p>Оплата осуществляется с использованием банковских карт или электронных средств платежа через платежный сервис ЮKassa.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Порядок оказания услуг</h2>
            <p>Услуги оказываются дистанционно. Доступ к расширенному функционалу Сервиса (в соответствии с тарифом) предоставляется автоматически сразу после подтверждения оплаты.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Возврат средств</h2>
            <p>Заказчик вправе отказаться от Услуг до момента начала их оказания (до активации подписки). Возврат средств осуществляется в течение 10 рабочих дней с момента получения требования.</p>
            <p>Если Услуга была фактически оказана (активирован доступ), возврат средств не производится, за исключением случаев, предусмотренных законом.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Статус Исполнителя</h2>
            <p>Исполнитель применяет специальный налоговый режим «Налог на профессиональный доход» (самозанятый) в соответствии с ФЗ № 422-ФЗ. Чек об оплате формируется в приложении «Мой налог» и направляется Заказчику.</p>
          </section>
        </div>
      </div>
    </div>
  );
}