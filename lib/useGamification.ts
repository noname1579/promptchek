// lib/useGamification.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { createClient } from "@/lib/supabase/client";

export interface GamificationState {
  points: number;
  achievements: string[];
}

const GAMIFICATION_KEY = "promptchek_gamification";

export const LEVELS = [
  { min: 0, name: "Новичок", color: "text-slate-400" },
  { min: 100, name: "Промпт-инженер", color: "text-blue-400" },
  { min: 500, name: "Мастер", color: "text-purple-400" },
  { min: 1500, name: "Гуру", color: "text-amber-400" },
  { min: 5000, name: "Легенда", color: "text-rose-400" },
];

export const ALL_ACHIEVEMENTS = [
  { id: "first_prompt", title: "Первый шаг", desc: "Улучшите свой первый промпт", icon: "🚀" },
  { id: "perfect_score", title: "Идеально", desc: "Получите оценку 100/100", icon: "💯" },
  { id: "code_master", title: "Кодер", desc: "Улучшите промпт в режиме IT", icon: "💻" },
  { id: "historian", title: "Архивариус", desc: "Сохраните 5 промптов в историю", icon: "📚" },
];

export function useGamification() {
  const { showToast } = useToast();
  const [state, setState] = useState<GamificationState>({ points: 0, achievements: [] });

  // Загрузка данных при старте
  useEffect(() => {
    async function loadData() {
      // Безопасно создаем клиент (если ключей нет, просто выходим)
      let supabase;
      try {
        supabase = createClient();
      } catch (e) {
        console.warn("Supabase не настроен, используем localStorage");
        loadFromLocalStorage();
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('points, achievements')
          .eq('id', user.id)
          .maybeSingle();
          
        if (data && !error) {
          setState({ points: data.points || 0, achievements: data.achievements || [] });
          return;
        }
      }
      
      loadFromLocalStorage();
    }

    function loadFromLocalStorage() {
      try {
        const saved = localStorage.getItem(GAMIFICATION_KEY);
        if (saved) setState(JSON.parse(saved));
      } catch {}
    }

    loadData();
  }, []);

  const getLevel = useCallback(() => {
    let current = LEVELS[0];
    for (const l of LEVELS) {
      if (state.points >= l.min) current = l;
    }
    return current;
  }, [state.points]);

  const addReward = useCallback(async (points: number, achievementId?: string) => {
    const newPoints = state.points + points;
    const newAchievements = [...state.achievements];
    
    if (achievementId && !newAchievements.includes(achievementId)) {
      newAchievements.push(achievementId);
      const ach = ALL_ACHIEVEMENTS.find((a) => a.id === achievementId);
      if (ach) showToast(`Достижение: ${ach.title} ${ach.icon}`, "success");
    }

    const newState = { points: newPoints, achievements: newAchievements };
    setState(newState);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({
          points: newPoints,
          achievements: newAchievements
        }).eq('id', user.id);
      } else {
        localStorage.setItem(GAMIFICATION_KEY, JSON.stringify(newState));
      }
    } catch {
      // Если Supabase недоступен, сохраняем локально
      localStorage.setItem(GAMIFICATION_KEY, JSON.stringify(newState));
    }
  }, [state, showToast]);

  return { points: state.points, achievements: state.achievements, level: getLevel(), addReward };
}