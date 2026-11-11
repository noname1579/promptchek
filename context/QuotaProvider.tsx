// context/QuotaProvider.tsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

export interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  disabled?: boolean;
}

interface QuotaContextType {
  quota: QuotaInfo | null;
  setQuota: (quota: QuotaInfo) => void;
  refreshQuota: () => Promise<void>;
  loading: boolean;
}

const QuotaContext = createContext<QuotaContextType | null>(null);

export function QuotaProvider({ children }: { children: React.ReactNode }) {
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const refreshQuota = useCallback(async () => {
    try {
      const res = await fetch("/api/quota");
      if (res.ok) {
        const data = await res.json();
        setQuota(data);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  // Загружаем квоту при смене страницы или монтировании
  useEffect(() => {
    setLoading(true);
    refreshQuota();
  }, [pathname, refreshQuota]);

  return (
    <QuotaContext.Provider value={{ quota, setQuota, refreshQuota, loading }}>
      {children}
    </QuotaContext.Provider>
  );
}

export function useQuota() {
  const ctx = useContext(QuotaContext);
  if (!ctx) throw new Error("useQuota must be used within QuotaProvider");
  return ctx;
}