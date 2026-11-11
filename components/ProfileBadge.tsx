// components/ProfileBadge.tsx
"use client";

import { useGamification, LEVELS, ALL_ACHIEVEMENTS } from "@/lib/useGamification";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function ProfileBadge() {
  const { points, level, achievements } = useGamification();
  const [isOpen, setIsOpen] = useState(false);

  const nextLevel = LEVELS.find(l => l.min > points);
  const progress = nextLevel 
    ? ((points - level.min) / (nextLevel.min - level.min)) * 100 
    : 100;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-all"
      >
        <Trophy className={cn("w-4 h-4", level.color)} />
        <span className="text-sm font-medium text-slate-200">{level.name}</span>
        <span className="text-xs font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded">
          {points} XP
        </span>
      </button>

      {/* Выпадающая панель профиля */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-4 z-50 animate-slide-up">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-white">Прогресс</span>
            <span className="text-xs text-slate-400">{points} / {nextLevel ? nextLevel.min : 'MAX'} XP</span>
          </div>
          
          {/* Прогресс-бар */}
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" 
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 mt-4">Достижения</div>
          <div className="grid grid-cols-4 gap-2">
            {ALL_ACHIEVEMENTS.map((ach) => {
              const unlocked = achievements.includes(ach.id);
              return (
                <div 
                  key={ach.id}
                  title={`${ach.title}: ${ach.desc}`}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-lg border transition-all",
                    unlocked 
                      ? "border-indigo-500/30 bg-indigo-500/10 text-white cursor-help" 
                      : "border-slate-800 bg-slate-950/50 text-slate-600 grayscale"
                  )}
                >
                  <span className="text-xl mb-1">{ach.icon}</span>
                  <span className="text-[9px] font-medium text-center leading-tight">{ach.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}