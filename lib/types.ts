// lib/types.ts

export type PromptMode = "general" | "code" | "agent" | "system";

export interface ScoreCriterion {
  id: string;
  label: string;
  passed: boolean;
  weight?: number;
  hint?: string;
}

export interface ScoreResult {
  score: number;
  criteria: ScoreCriterion[];
  strengths?: string[];
  gaps?: string[]; // Добавляем, так как scoring.ts использует это поле
}

export interface HistoryItem {
  id: string;
  prompt: string;
  improved: string;
  mode: PromptMode;
  timestamp: number;
}