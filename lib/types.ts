export type PromptMode = "general" | "code" | "agent" | "system";

export interface ImproveRequest {
  prompt: string;
  mode: PromptMode;
}

export interface ScoreCriterion {
  id: string;
  label: string;
  weight: number;
  passed: boolean;
  hint: string;
}

export interface ScoreResult {
  score: number;
  criteria: ScoreCriterion[];
  strengths: string[];
  gaps: string[];
}

export interface ImproveResult {
  improved: string;
  scoreBefore: ScoreResult;
  scoreAfter: ScoreResult;
  notes: string[];
}
