// lib/types.ts
export type PromptMode = "general" | "code" | "agent" | "system";

export interface ScoreCriterion {
  id: string;
  label: string;
  passed: boolean;
}

export interface ScoreResult {
  score: number;
  criteria: ScoreCriterion[];
}

export interface HistoryItem {
  id: string;
  prompt: string;
  improved: string;
  mode: PromptMode;
  timestamp: number;
}