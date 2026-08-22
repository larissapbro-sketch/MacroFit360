import type { SupabaseClient } from "@supabase/supabase-js";

// Plano gratuito (spec seção 21). Interpretação adotada: os limites
// "até 2 treinos" / "até 3 dias de cardápio" da spec viram um contador de
// GERAÇÕES bem-sucedidas via IA (não um limite de dias dentro de um único
// plano) — decisão registrada e confirmada com o usuário, para não mudar
// a arquitetura de meal_plans/workout_plans já construída na Fase 3.
export const FREE_LIMITS = {
  meal_plan: 3,
  workout_plan: 2,
} as const;

export type LimitedGenerationType = keyof typeof FREE_LIMITS;

/**
 * Conta quantas gerações bem-sucedidas desse tipo o usuário já fez.
 * Reaproveita ai_generations, que já registra todo sucesso de IA — não
 * precisa de uma tabela de contagem separada.
 */
export async function countSuccessfulGenerations(
  supabase: SupabaseClient,
  userId: string,
  type: LimitedGenerationType
): Promise<number> {
  const { count } = await supabase
    .from("ai_generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("generation_type", type)
    .eq("status", "success");

  return count ?? 0;
}

/**
 * Verifica se o usuário (free) ainda pode gerar mais um plano desse tipo.
 * Premium sempre pode. Esta checagem deve ser chamada no SERVIDOR, antes
 * de qualquer geração — nunca confiar em um bloqueio só de frontend
 * (spec seção 23).
 */
export interface UsageSummary {
  mealPlan: { used: number; limit: number };
  workoutPlan: { used: number; limit: number };
}

/** Uso atual dos contadores do plano gratuito, para exibir na UI. */
export async function getUsageSummary(
  supabase: SupabaseClient,
  userId: string
): Promise<UsageSummary> {
  const [mealPlanUsed, workoutPlanUsed] = await Promise.all([
    countSuccessfulGenerations(supabase, userId, "meal_plan"),
    countSuccessfulGenerations(supabase, userId, "workout_plan"),
  ]);

  return {
    mealPlan: { used: mealPlanUsed, limit: FREE_LIMITS.meal_plan },
    workoutPlan: { used: workoutPlanUsed, limit: FREE_LIMITS.workout_plan },
  };
}

export async function canGenerate(
  supabase: SupabaseClient,
  userId: string,
  type: LimitedGenerationType,
  isPremium: boolean
): Promise<{ allowed: boolean; used: number; limit: number }> {
  if (isPremium) {
    return { allowed: true, used: 0, limit: Infinity };
  }

  const used = await countSuccessfulGenerations(supabase, userId, type);
  const limit = FREE_LIMITS[type];
  return { allowed: used < limit, used, limit };
}
