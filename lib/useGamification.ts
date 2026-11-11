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
  const supabase = createClient();

  // Загрузка данных при старте
  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Если авторизован - берем из базы (используем maybeSingle, чтобы избежать 406)
        const { data, error } = await supabase
          .from('profiles')
          .select('points, achievements')
          .eq('id', user.id)
          .maybeSingle();
          
        if (data && !error) {
          setState({ points: data.points || 0, achievements: data.achievements || [] });
        } else if (!data) {
          // Если профиля нет (баг при регистрации), создаем его
          await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            points: 0,
            achievements: []
          });
          setState({ points: 0, achievements: [] });
        }
        return;
      }
      
      // Если не авторизован - берем из localStorage
      try {
        const saved = localStorage.getItem(GAMIFICATION_KEY);
        if (saved) setState(JSON.parse(saved));
      } catch {}
    }
    loadData();
  }, [supabase]);

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

    // Сохраняем в Supabase или в localStorage
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({
        points: newPoints,
        achievements: newAchievements
      }).eq('id', user.id);
    } else {
      localStorage.setItem(GAMIFICATION_KEY, JSON.stringify(newState));
    }
  }, [state, showToast, supabase]);

  return { points: state.points, achievements: state.achievements, level: getLevel(), addReward };
}