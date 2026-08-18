import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com a chave service_role — IGNORA RLS por completo.
 *
 * Uso restrito a rotinas de confiança do servidor onde não há um usuário
 * autenticado no contexto (ex.: processar webhook de pagamento, jobs agendados
 * de notificação). NUNCA importar este arquivo em código que roda no navegador
 * e NUNCA usar para responder requisições feitas diretamente por um usuário.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidas (apenas no servidor)."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
