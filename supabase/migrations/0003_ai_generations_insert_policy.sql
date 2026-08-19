-- MacroFit 360° — permite que o próprio usuário registre suas gerações de IA
-- (auditoria). Sem SUPABASE_SERVICE_ROLE_KEY configurada ainda, o backend
-- grava esse log usando o client autenticado do próprio usuário (server
-- action), então precisamos de uma policy de insert escopada por user_id.
-- Quando a service_role key estiver disponível, essa policy pode ser mantida
-- (não há risco extra: o usuário só consegue inserir registros do próprio
-- histórico, nunca de outro usuário) ou substituída por escrita exclusiva
-- via service_role, a critério do time.

create policy "ai_generations_insert_own" on public.ai_generations
  for insert with check (auth.uid() = user_id);
