-- MacroFit 360° — Row Level Security
-- Regra geral: cada usuário só pode ler/escrever os próprios dados (auth.uid() = user_id).
-- Tabelas filhas sem user_id direto (meal_plan_meals, workout_sessions) verificam a posse
-- do registro pai. Nenhuma policy usa a service_role — ela ignora RLS por padrão.

alter table public.profiles enable row level security;
alter table public.meal_plans enable row level security;
alter table public.meal_plan_meals enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.progress enable row level security;
alter table public.daily_logs enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notifications enable row level security;
alter table public.ai_generations enable row level security;

-- ---------- profiles ----------
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = user_id);

-- ---------- meal_plans ----------
create policy "meal_plans_select_own" on public.meal_plans
  for select using (auth.uid() = user_id);
create policy "meal_plans_insert_own" on public.meal_plans
  for insert with check (auth.uid() = user_id);
create policy "meal_plans_update_own" on public.meal_plans
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "meal_plans_delete_own" on public.meal_plans
  for delete using (auth.uid() = user_id);

-- ---------- meal_plan_meals (posse via meal_plans.user_id) ----------
create policy "meal_plan_meals_select_own" on public.meal_plan_meals
  for select using (
    exists (
      select 1 from public.meal_plans mp
      where mp.id = meal_plan_meals.meal_plan_id and mp.user_id = auth.uid()
    )
  );
create policy "meal_plan_meals_insert_own" on public.meal_plan_meals
  for insert with check (
    exists (
      select 1 from public.meal_plans mp
      where mp.id = meal_plan_meals.meal_plan_id and mp.user_id = auth.uid()
    )
  );
create policy "meal_plan_meals_update_own" on public.meal_plan_meals
  for update using (
    exists (
      select 1 from public.meal_plans mp
      where mp.id = meal_plan_meals.meal_plan_id and mp.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.meal_plans mp
      where mp.id = meal_plan_meals.meal_plan_id and mp.user_id = auth.uid()
    )
  );
create policy "meal_plan_meals_delete_own" on public.meal_plan_meals
  for delete using (
    exists (
      select 1 from public.meal_plans mp
      where mp.id = meal_plan_meals.meal_plan_id and mp.user_id = auth.uid()
    )
  );

-- ---------- workout_plans ----------
create policy "workout_plans_select_own" on public.workout_plans
  for select using (auth.uid() = user_id);
create policy "workout_plans_insert_own" on public.workout_plans
  for insert with check (auth.uid() = user_id);
create policy "workout_plans_update_own" on public.workout_plans
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workout_plans_delete_own" on public.workout_plans
  for delete using (auth.uid() = user_id);

-- ---------- workout_sessions (posse via workout_plans.user_id) ----------
create policy "workout_sessions_select_own" on public.workout_sessions
  for select using (
    exists (
      select 1 from public.workout_plans wp
      where wp.id = workout_sessions.workout_plan_id and wp.user_id = auth.uid()
    )
  );
create policy "workout_sessions_insert_own" on public.workout_sessions
  for insert with check (
    exists (
      select 1 from public.workout_plans wp
      where wp.id = workout_sessions.workout_plan_id and wp.user_id = auth.uid()
    )
  );
create policy "workout_sessions_update_own" on public.workout_sessions
  for update using (
    exists (
      select 1 from public.workout_plans wp
      where wp.id = workout_sessions.workout_plan_id and wp.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.workout_plans wp
      where wp.id = workout_sessions.workout_plan_id and wp.user_id = auth.uid()
    )
  );
create policy "workout_sessions_delete_own" on public.workout_sessions
  for delete using (
    exists (
      select 1 from public.workout_plans wp
      where wp.id = workout_sessions.workout_plan_id and wp.user_id = auth.uid()
    )
  );

-- ---------- progress ----------
create policy "progress_select_own" on public.progress
  for select using (auth.uid() = user_id);
create policy "progress_insert_own" on public.progress
  for insert with check (auth.uid() = user_id);
create policy "progress_update_own" on public.progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "progress_delete_own" on public.progress
  for delete using (auth.uid() = user_id);

-- ---------- daily_logs ----------
create policy "daily_logs_select_own" on public.daily_logs
  for select using (auth.uid() = user_id);
create policy "daily_logs_insert_own" on public.daily_logs
  for insert with check (auth.uid() = user_id);
create policy "daily_logs_update_own" on public.daily_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "daily_logs_delete_own" on public.daily_logs
  for delete using (auth.uid() = user_id);

-- ---------- subscriptions ----------
-- Usuário pode ler a própria assinatura, mas nunca escrever diretamente:
-- status/plan só devem mudar via backend com service_role (webhook de pagamento).
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- ---------- notifications ----------
-- Usuário só pode ler as próprias notificações; criação/agendamento é feita pelo backend.
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);
create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- ai_generations ----------
-- Somente leitura para o usuário (auditoria); escrita é feita pelo backend (service_role)
-- para garantir que o registro reflita exatamente o que foi enviado/recebido da IA.
create policy "ai_generations_select_own" on public.ai_generations
  for select using (auth.uid() = user_id);
