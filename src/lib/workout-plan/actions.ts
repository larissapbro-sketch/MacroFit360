"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db/supabase-server";
import { getProfile } from "@/lib/profile/queries";
import { generateWorkoutPlanFromClaude } from "@/lib/ai/workout-plan/generate";
import type { WorkoutPlanPromptInput } from "@/lib/ai/workout-plan/prompt";
import type { WorkoutPlanResponse } from "@/lib/ai/workout-plan/schema";

export interface GenerateWorkoutPlanActionResult {
  error?: string;
}

const MAX_ATTEMPTS = 2;

const GENERIC_ERROR =
  "Não conseguimos gerar seu plano de treino agora. Tente novamente em instantes.";

// A progressão de dificuldade (spec seção 16 — baseada em % de adesão ao
// longo das semanas) ainda não está implementada; por enquanto todo plano
// novo começa como "iniciante". Isso é uma decisão do sistema, não da IA.
const DEFAULT_DIFFICULTY = "iniciante" as const;

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

  const promptInput: WorkoutPlanPromptInput = {
    goal: profile.goal,
    trainingDays: profile.trainingDays,
    equipment: profile.equipment,
    difficulty: DEFAULT_DIFFICULTY,
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
