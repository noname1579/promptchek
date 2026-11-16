import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { QuotaProvider } from "@/context/QuotaProvider";
import { AppShell } from "@/components/layout/AppShell";
import { validateEnv } from "@/lib/env";
import { Analytics } from "@vercel/analytics/next"; // <-- Импорт аналитики

validateEnv();

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Promptchek — платформа точных AI-промптов",
  description: "Улучшайте промпты, получайте оценку по 12 критериям и добивайтесь предсказуемого результата от нейросетей.",
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`dark ${inter.variable}`}>
      <body className="font-sans antialiased bg-slate-950 text-slate-100">
        <AppProvider>
          <ToastProvider>
            <QuotaProvider>
              <AppShell>{children}</AppShell>
            </QuotaProvider>
          </ToastProvider>
        </AppProvider>
        
        {/* Аналитика Vercel */}
        <Analytics />
        
      </body>
    </html>
  );
}