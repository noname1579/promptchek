// app/legal/contacts/page.tsx
import Link from "next/link";
import { ArrowLeft, Mail, User, FileText } from "lucide-react";

export default function ContactsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4" /> На главную
        </Link>
        
        <h1 className="text-2xl font-bold text-white mb-6">Реквизиты и контакты</h1>
        
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <User className="w-5 h-5 text-indigo-400 mt-1" />
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Исполнитель</div>
              <div className="text-white font-medium">Ляшенко Илья Александрович</div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <FileText className="w-5 h-5 text-indigo-400 mt-1" />
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">ИНН</div>
              <div className="text-white font-medium">616513540703</div>
              <p className="text-xs text-slate-500 mt-1">Плательщик налога на профессиональный доход (самозанятый)</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <Mail className="w-5 h-5 text-indigo-400 mt-1" />
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Email для связи</div>
              <div className="text-white font-medium">support@promptchek.ru</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}