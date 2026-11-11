// lib/types.ts

export type PromptMode = "general" | "code" | "agent" | "system";

export interface ScoreCriterion {
  id: string;
  label: string;
  passed: boolean;
  // Добавляем необязательные поля, которые ожидает scoring.ts
  weight?: number; 
  hint?: string;
}

export interface ScoreResult {
  score: number;
  criteria: ScoreCriterion[];
  // Добавляем необязательное поле, которое ожидает scoring.ts
  strengths?: string[];
}

export interface HistoryItem {
  id: string;
  prompt: string;
  improved: string;
  mode: PromptMode;
  timestamp: number;
}