-- MacroFit 360° — permite que o próprio usuário registre suas notificações
-- (geradas por regras no servidor, dentro das actions já autenticadas do
-- usuário — mesmo raciocínio da 0003 para ai_generations, já que ainda não
-- há SUPABASE_SERVICE_ROLE_KEY dedicada para um worker de agendamento).

create policy "notifications_insert_own" on public.notifications
  for insert with check (auth.uid() = user_id);
