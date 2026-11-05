-- Promptchek: базовая схема для квот и учёта прогонов.
-- Выполнить в Supabase SQL Editor (или через supabase db push).

-- Профили: один к одному с auth.users.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  created_at timestamptz not null default now()
);

-- Журнал прогонов. Источник истины для квот и юнит-экономики.
create table if not exists public.usage_events (
  id bigserial primary key,
  user_id uuid references auth.users (id) on delete set null,
  anon_id text,
  kind text not null default 'improve',
  mode text,
  prompt_chars int not null default 0,
  tokens_in int,
  tokens_out int,
  cost_usd numeric(10, 6),
  created_at timestamptz not null default now(),
  constraint usage_events_owner check (user_id is not null or anon_id is not null)
);

create index if not exists usage_events_user_month_idx
  on public.usage_events (user_id, created_at desc);
create index if not exists usage_events_anon_month_idx
  on public.usage_events (anon_id, created_at desc);

-- RLS: пользователь видит только свои записи, пишет только сервер (service role).
alter table public.profiles enable row level security;
alter table public.usage_events enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "usage_select_own" on public.usage_events;
create policy "usage_select_own" on public.usage_events
  for select using (auth.uid() = user_id);

-- Автосоздание профиля при регистрации.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Атомарный подсчёт прогонов за текущий календарный месяц.
-- Возвращает число уже использованных прогонов.
create or replace function public.count_runs_this_month(
  p_user_id uuid default null,
  p_anon_id text default null
)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.usage_events
  where created_at >= date_trunc('month', now())
    and (
      (p_user_id is not null and user_id = p_user_id)
      or (p_user_id is null and p_anon_id is not null and anon_id = p_anon_id)
    );
$$;
