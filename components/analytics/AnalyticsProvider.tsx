/**
 * components/analytics/AnalyticsProvider.tsx
 * Инициализация PostHog + трекинг pageview для App Router.
 * "use client" — клиентский провайдер.
 */

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initAnalytics, trackPageview } from "@/lib/analytics-client";

export function AnalyticsProvider() {
  const pathname = usePathname();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    trackPageview(pathname);
  }, [pathname]);

  // Не рендерит ничего в DOM
  return null;
}
