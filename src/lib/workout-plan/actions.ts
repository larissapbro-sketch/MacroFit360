"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db/supabase-server";
import { getProfile } from "@/lib/profile/queries";
import { generateWorkoutPlanFromClaude } from "@/lib/ai/workout-plan/generate";
import type { WorkoutPlanPromptInput } from "@/lib/ai/workout-plan/prompt";
import type { WorkoutPlanResponse } from "@/lib/ai/workout-plan/schema";
import { getSubscription, isPremiumActive } from "@/lib/subscription/queries";
import { canGenerate } from "@/lib/subscription/limits";
import { determineNextDifficulty, type Difficulty } from "@/lib/calculations/workout-progression";

export interface GenerateWorkoutPlanActionResult {
  error?: string;
}

const MAX_ATTEMPTS = 2;

const GENERIC_ERROR =
  "Não conseguimos gerar seu plano de treino agora. Tente novamente em instantes.";

// Quantas semanas recentes olhar para decidir progressão (spec seção 16:
// precisa de pelo menos 2 semanas seguidas com 90%+ para a progressão
// "adicional" de 2 níveis de uma vez).
const PROGRESSION_LOOKBACK_WEEKS = 3;

interface RecentWeekAdherence {
  difficulty: Difficulty;
  adherencePercent: number;
}

/**
 * Busca as últimas semanas de treino do usuário (mais recente primeiro)
 * com a dificuldade e o % de adesão de cada uma, para alimentar a regra
 * de progressão (spec seção 16).
 */
async function getRecentWorkoutAdherence(
  supabase: SupabaseClient,
  userId: string
): Promise<RecentWeekAdherence[]> {
  const { data: plans } = await supabase
    .from("workout_plans")
    .select("id, difficulty")
    .eq("user_id", userId)
    .order("week", { ascending: false })
    .limit(PROGRESSION_LOOKBACK_WEEKS);

  const results: RecentWeekAdherence[] = [];
  for (const plan of plans ?? []) {
    const { data: sessions } = await supabase
      .from("workout_sessions")
      .select("completed")
      .eq("workout_plan_id", plan.id);

    const total = sessions?.length ?? 0;
    const done = sessions?.filter((s) => s.completed).length ?? 0;

    results.push({
      difficulty: plan.difficulty as Difficulty,
      adherencePercent: total > 0 ? Math.round((done / total) * 100) : 0,
    });
  }

  return results;
}

// useActionState sempre chama a action com (state, formData); como este
// fluxo não depende de nenhum campo de formulário, os parâmetros são
// omitidos aqui (JS ignora argumentos extras passados em runtime).
export async function generateWorkoutPlanAction(): Promise<GenerateWorkoutPlanActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Você precisa estar logado." };
  }

  const profile = await getProfile();
  if (!profile) {
    return { error: "Complete seu perfil antes de gerar um plano de treino." };
  }

  if (profile.trainingDays <= 0) {
    return {
      error: "Você informou 0 dias disponíveis para treino. Atualize seu perfil para gerar um plano.",
    };
  }

  const subscription = await getSubscription();
  const { allowed, used, limit } = await canGenerate(
    supabase,
    user.id,
    "workout_plan",
    isPremiumActive(subscription)
  );
  if (!allowed) {
    return {
      error: `Você atingiu o limite do plano gratuito (${used}/${limit} treinos gerados). Assine o Premium para gerar ilimitado.`,
    };
  }

  // Progressão de dificuldade (spec seção 16): decidida pelo SISTEMA, não
  // pela IA, a partir da adesão real registrada nas semanas anteriores.
  const recentAdherence = await getRecentWorkoutAdherence(supabase, user.id);
  const previous = recentAdherence[0] ?? null;
  let consecutiveHighAdherenceWeeks = 0;
  for (const week of recentAdherence) {
    if (week.adherencePercent >= 90) consecutiveHighAdherenceWeeks++;
    else break;
  }
  const difficulty = determineNextDifficulty(
    previous?.difficulty ?? "iniciante",
    previous?.adherencePercent ?? null,
    consecutiveHighAdherenceWeeks
  );

  const promptInput: WorkoutPlanPromptInput = {
    goal: profile.goal,
    trainingDays: profile.trainingDays,
    equipment: profile.equipment,
    difficulty,
  };

  let lastError = GENERIC_ERROR;
  let lastRaw: unknown = null;
  let previousError: string | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const result = await generateWorkoutPlanFromClaude(promptInput, previousError);
    lastRaw = result.raw;

    if (result.success) {
      await supabase.from("ai_generations").insert({
        user_id: user.id,
        generation_type: "workout_plan",
        prompt: promptInput,
        raw_response: safeJson(result.raw),
        status: "success",
      });

      const saveError = await saveWorkoutPlan(supabase, user.id, promptInput, result.data);
      if (saveError) {
        return { error: "Plano gerado, mas houve um erro ao salvar. Tente novamente." };
      }

      revalidatePath("/plano-treino");
      revalidatePath("/dashboard");
      return {};
    }

    lastError = result.error;
    previousError = result.error;
  }

  // Falhou em todas as tentativas — nunca salva dado incompleto/inválido,
  // apenas registra o erro para auditoria (spec seção 14).
  await supabase.from("ai_generations").insert({
    user_id: user.id,
    generation_type: "workout_plan",
    prompt: promptInput,
    raw_response: safeJson(lastRaw),
    status: "invalid",
    error_message: lastError,
  });

  return { error: GENERIC_ERROR };
}

async function saveWorkoutPlan(
  supabase: SupabaseClient,
  userId: string,
  input: WorkoutPlanPromptInput,
  data: WorkoutPlanResponse
): Promise<string | null> {
  const { data: existingActive } = await supabase
    .from("workout_plans")
    .select("id, week")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  const nextWeek = existingActive ? existingActive.week + 1 : 1;

  const { data: planRow, error: planError } = await supabase
    .from("workout_plans")
    .insert({
      user_id: userId,
      week: nextWeek,
      difficulty: input.difficulty,
      total_days: input.trainingDays,
      status: "active",
    })
    .select("id")
    .single();

  if (planError || !planRow) {
    return planError?.message ?? "Erro desconhecido ao criar o plano.";
  }

  const sessionRows = data.days.flatMap((day) =>
    day.exercises.map((ex) => ({
      workout_plan_id: planRow.id,
      day: day.day,
      muscle_group: day.muscleGroup,
      exercise: ex.exercise,
      sets: ex.sets,
      reps: ex.reps,
      rest_seconds: ex.restSeconds,
      estimated_duration: ex.estimatedDurationMinutes,
      completed: false,
    }))
  );

  const { error: sessionsError } = await supabase.from("workout_sessions").insert(sessionRows);

  if (sessionsError) {
    // Plano ficou incompleto (sem sessões) — remove para não deixar lixo.
    await supabase.from("workout_plans").delete().eq("id", planRow.id);
    return sessionsError.message;
  }

  // Só arquiva o plano anterior depois que o novo foi salvo com sucesso.
  if (existingActive) {
    await supabase.from("workout_plans").update({ status: "archived" }).eq("id", existingActive.id);
  }

  return null;
}

function safeJson(value: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}
