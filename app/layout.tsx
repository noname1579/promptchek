import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppProvider";
import { AppShell } from "@/components/layout/AppShell";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { validateEnv } from "@/lib/env";

validateEnv();

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Promptchek — платформа точных AI-промптов",
  description: "Улучшайте промпты, получайте оценку по 12 критериям и добивайтесь предсказуемого результата от нейросетей.",
  openGraph: {
    title: "Promptchek",
    description: "Платформа для улучшения и оценки AI-промптов.",
    type: "website",
  },
};

// ✅ Правильный viewport для всех устройств (чтобы не было горизонтального скролла)
export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Отключает случайный зум на iPhone
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`dark ${inter.variable}`}>
      <body className="font-sans antialiased bg-slate-950 text-slate-100 overflow-x-hidden">
        <AppProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </AppProvider>
      </body>
    </html>
  );
}