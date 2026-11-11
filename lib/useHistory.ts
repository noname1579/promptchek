// lib/useHistory.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { HistoryItem } from "@/lib/types";
import { useToast } from "@/components/ui/ToastProvider";

const HISTORY_KEY = "promptchek_history";

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { showToast } = useToast();

  // Загрузка истории при старте
  useEffect(() => {
    async function loadHistory() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Если авторизован — берем из базы
        const { data, error } = await supabase
          .from('history')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (data && !error) {
          setHistory(data.map((item: any) => ({
            id: item.id,
            prompt: item.prompt,
            improved: item.improved,
            mode: item.mode,
            timestamp: new Date(item.created_at).getTime(),
          })));
        }
      } else {
        // Если нет — берем из localStorage
        try {
          const saved = localStorage.getItem(HISTORY_KEY);
          if (saved) setHistory(JSON.parse(saved));
        } catch {}
      }
      setLoading(false);
    }
    loadHistory();
  }, [supabase]);

  const saveHistory = useCallback(async (item: Omit<HistoryItem, "id" | "timestamp">) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Сохраняем в Supabase
      const { data, error } = await supabase
        .from('history')
        .insert({
          user_id: user.id,
          prompt: item.prompt,
          improved: item.improved,
          mode: item.mode,
        })
        .select()
        .single();

      if (!error && data) {
        const newItem: HistoryItem = {
          id: data.id,
          prompt: data.prompt,
          improved: data.improved,
          mode: data.mode,
          timestamp: new Date(data.created_at).getTime(),
        };
        setHistory(prev => [newItem, ...prev].slice(0, 10));
      }
    } else {
      // Сохраняем в localStorage
      const newItem: HistoryItem = {
        ...item,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };
      const updated = [newItem, ...history].slice(0, 10);
      setHistory(updated);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)); } catch {}
    }
  }, [history, supabase]);

  const clearHistory = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from('history').delete().eq('user_id', user.id);
    } else {
      localStorage.removeItem(HISTORY_KEY);
    }
    
    setHistory([]);
    showToast("История очищена");
  }, [supabase, showToast]);

  return { history, loading, saveHistory, clearHistory };
}