import type { ScoreResult } from "@/lib/types";

function scoreColor(score: number): string {
  if (score >= 75) return "text-good";
  if (score >= 45) return "text-warn";
  return "text-bad";
}

function barColor(score: number): string {
  if (score >= 75) return "bg-good";
  if (score >= 45) return "bg-warn";
  return "bg-bad";
}

function CheckIcon({ passed }: { passed: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={`mt-0.5 shrink-0 ${passed ? "text-good" : "text-muted"}`}
    >
      {passed ? (
        <path
          d="M3 8.5 6.2 11.7 13 5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <circle cx="8" cy="8" r="5.2" stroke="currentColor" strokeWidth="1.4" />
      )}
    </svg>
  );
}

export function ScoreCard({
  title,
  result,
  compact = false,
}: {
  title: string;
  result: ScoreResult;
  compact?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-ink-soft p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs uppercase tracking-wider text-muted">
          {title}
        </span>
        <span className={`text-2xl font-semibold ${scoreColor(result.score)}`}>
          {result.score}
          <span className="text-sm text-muted">/100</span>
        </span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor(result.score)}`}
          style={{ width: `${result.score}%` }}
        />
      </div>

      {!compact && (
        <ul className="mt-4 space-y-1.5">
          {result.criteria.map((criterion) => (
            <li
              key={criterion.id}
              className="flex items-start gap-2 text-sm leading-snug"
            >
              <CheckIcon passed={criterion.passed} />
              <span className={criterion.passed ? "" : "text-muted"}>
                {criterion.label}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
