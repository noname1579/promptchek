import { createSupabaseAdminClient } from "@/lib/supabase/server";

export interface QuotaOwner {
  userId: string | null;
  anonId: string | null;
}

export interface QuotaState {
  used: number;
  limit: number;
  remaining: number;
  allowed: boolean;
  /** true, если Supabase не настроен и квота не применяется (локальная разработка). */
  disabled: boolean;
}

const FREE_MONTHLY_RUNS = Number(process.env.FREE_MONTHLY_RUNS ?? 3);

function isConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * Проверяет месячную квоту прогонов.
 * Без Supabase (локальная разработка) квота отключена — чтобы не блокировать работу.
 */
export async function getQuota(owner: QuotaOwner): Promise<QuotaState> {
  if (!isConfigured()) {
    return {
      used: 0,
      limit: FREE_MONTHLY_RUNS,
      remaining: FREE_MONTHLY_RUNS,
      allowed: true,
      disabled: true,
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("count_runs_this_month", {
    p_user_id: owner.userId,
    p_anon_id: owner.userId ? null : owner.anonId,
  });

  if (error) {
    // Не блокируем пользователя из-за сбоя БД, но и не теряем факт ошибки.
    console.error("quota: count_runs_this_month failed", error.message);
    return {
      used: 0,
      limit: FREE_MONTHLY_RUNS,
      remaining: FREE_MONTHLY_RUNS,
      allowed: true,
      disabled: true,
    };
  }

  const used = typeof data === "number" ? data : 0;
  const remaining = Math.max(0, FREE_MONTHLY_RUNS - used);

  return {
    used,
    limit: FREE_MONTHLY_RUNS,
    remaining,
    allowed: remaining > 0,
    disabled: false,
  };
}

/**
 * Записывает прогон в журнал. Вызывать после успешного ответа модели.
 */
export async function recordRun(params: {
  owner: QuotaOwner;
  mode: string;
  promptChars: number;
  tokensIn?: number;
  tokensOut?: number;
  costUsd?: number;
}): Promise<void> {
  if (!isConfigured()) return;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("usage_events").insert({
    user_id: params.owner.userId,
    anon_id: params.owner.userId ? null : params.owner.anonId,
    kind: "improve",
    mode: params.mode,
    prompt_chars: params.promptChars,
    tokens_in: params.tokensIn ?? null,
    tokens_out: params.tokensOut ?? null,
    cost_usd: params.costUsd ?? null,
  });

  if (error) {
    console.error("quota: recordRun failed", error.message);
  }
}
