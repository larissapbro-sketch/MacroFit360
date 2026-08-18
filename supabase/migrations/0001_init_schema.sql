-- MacroFit 360° — Schema inicial (Fase 1)
-- Baseado na seção 6 da especificação.
-- auth.users já é gerenciada pelo Supabase Auth; as tabelas abaixo referenciam auth.users(id).

-- ============================================================
-- profiles
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  weight numeric(5, 2) not null check (weight > 0),
  height numeric(5, 2) not null check (height > 0),
  age smallint not null check (age > 0 and age < 120),
  sex text not null check (sex in ('masculino', 'feminino')),
  goal text not null check (goal in ('hipertrofia', 'definicao', 'perda_de_gordura')),
  training_days smallint not null check (training_days between 0 and 7),
  equipment text[] not null default '{}',
  weekly_food_budget numeric(8, 2) not null check (weekly_food_budget >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- ============================================================
-- meal_plans
-- ============================================================
create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week integer not null check (week > 0),
  daily_calories integer not null check (daily_calories > 0),
  protein_target numeric(6, 2) not null check (protein_target >= 0),
  carb_target numeric(6, 2) not null check (carb_target >= 0),
  fat_target numeric(6, 2) not null check (fat_target >= 0),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- meal_plan_meals
-- ============================================================
create table if not exists public.meal_plan_meals (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans (id) on delete cascade,
  meal_type text not null check (
    meal_type in ('cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar', 'outra')
  ),
  food text not null,
  quantity text not null,
  calories numeric(7, 2) not null check (calories >= 0),
  protein numeric(6, 2) not null check (protein >= 0),
  carbs numeric(6, 2) not null check (carbs >= 0),
  fat numeric(6, 2) not null check (fat >= 0),
  alternatives jsonb not null default '[]'::jsonb
);

-- ============================================================
-- workout_plans
-- ============================================================
create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week integer not null check (week > 0),
  difficulty text not null check (difficulty in ('iniciante', 'intermediario', 'avancado')),
  total_days smallint not null check (total_days between 1 and 7),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- workout_sessions
-- ============================================================
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  workout_plan_id uuid not null references public.workout_plans (id) on delete cascade,
  day smallint not null check (day between 1 and 7),
  muscle_group text not null,
  exercise text not null,
  sets smallint not null check (sets > 0),
  reps text not null,
  rest_seconds smallint not null check (rest_seconds >= 0),
  estimated_duration smallint not null check (estimated_duration >= 0),
  completed boolean not null default false
);

-- ============================================================
-- progress
-- ============================================================
create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recorded_at date not null default current_date,
  weight numeric(5, 2),
  measurements jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- daily_logs
-- ============================================================
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null default current_date,
  calories numeric(7, 2),
  protein numeric(6, 2),
  carbs numeric(6, 2),
  fat numeric(6, 2),
  workouts_completed smallint not null default 0,
  adherence numeric(5, 2),
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

-- ============================================================
-- subscriptions
-- ============================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'premium')),
  status text not null default 'free' check (status in ('free', 'premium', 'pending', 'canceled', 'expired')),
  subscription_id text,
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id)
);

-- ============================================================
-- notifications
-- ============================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('lembrete', 'motivacional', 'progresso', 'nutricao')),
  title text not null,
  message text not null,
  scheduled_for timestamptz,
  sent_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'sent', 'canceled')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- ai_generations (auditoria de chamadas à IA)
-- ============================================================
create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  generation_type text not null check (generation_type in ('meal_plan', 'workout_plan', 'substitution', 'weekly_adjustment')),
  prompt jsonb not null,
  raw_response jsonb,
  status text not null default 'pending' check (status in ('pending', 'success', 'invalid', 'error')),
  error_message text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Índices de apoio
-- ============================================================
create index if not exists idx_profiles_user_id on public.profiles (user_id);
create index if not exists idx_meal_plans_user_id on public.meal_plans (user_id);
create index if not exists idx_meal_plan_meals_meal_plan_id on public.meal_plan_meals (meal_plan_id);
create index if not exists idx_workout_plans_user_id on public.workout_plans (user_id);
create index if not exists idx_workout_sessions_workout_plan_id on public.workout_sessions (workout_plan_id);
create index if not exists idx_progress_user_id on public.progress (user_id);
create index if not exists idx_daily_logs_user_id on public.daily_logs (user_id);
create index if not exists idx_subscriptions_user_id on public.subscriptions (user_id);
create index if not exists idx_notifications_user_id on public.notifications (user_id);
create index if not exists idx_ai_generations_user_id on public.ai_generations (user_id);

-- ============================================================
-- updated_at automático em profiles
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();
