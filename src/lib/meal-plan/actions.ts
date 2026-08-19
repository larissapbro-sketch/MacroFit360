"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db/supabase-server";
import { getProfile } from "@/lib/profile/queries";
import { calculateNutritionTargets, type NutritionTargets } from "@/lib/calculations/nutrition";
import { generateMealPlanFromClaude } from "@/lib/ai/meal-plan/generate";
import type { MealPlanPromptInput } from "@/lib/ai/meal-plan/prompt";
import type { MealPlanResponse } from "@/lib/ai/meal-plan/schema";

export interface GenerateMealPlanActionResult {
  error?: string;
}

const MAX_ATTEMPTS = 2;

const GENERIC_ERROR =
  "Não conseguimos gerar seu plano alimentar agora. Tente novamente em instantes.";

/**
 * Fluxo completo do IA Planner para o cardápio (spec seção 14):
 * perfil -> cálculos do sistema -> prompt -> IA -> validação -> salvar.
 * Tenta no máximo 2 vezes; se ambas falharem, registra o erro em
 * ai_generations e nunca salva um plano incompleto/inválido.
 */
// useActionState sempre chama a action com (state, formData); como este
// fluxo não depende de nenhum campo de formulário, os parâmetros são
// omitidos aqui (JS ignora argumentos extras passados em runtime).
export async function generateMealPlanAction(): Promise<GenerateMealPlanActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Você precisa estar logado." };
  }

  const profile = await getProfile();
  if (!profile) {
    return { error: "Complete seu perfil antes de gerar um plano alimentar." };
  }

  const targets = calculateNutritionTargets({
    weightKg: profile.weight,
    heightCm: profile.height,
    age: profile.age,
    sex: profile.sex,
    goal: profile.goal,
    trainingDaysPerWeek: profile.trainingDays,
  });

  const promptInput: MealPlanPromptInput = {
    goal: profile.goal,
    weeklyFoodBudget: profile.weeklyFoodBudget,
    targets,
  };

  let lastError = GENERIC_ERROR;
  let lastRaw: unknown = null;
  let previousError: string | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const result = await generateMealPlanFromClaude(promptInput, previousError);
    lastRaw = result.raw;

    if (result.success) {
      await supabase.from("ai_generations").insert({
        user_id: user.id,
        generation_type: "meal_plan",
        prompt: promptInput,
        raw_response: safeJson(result.raw),
        status: "success",
      });

      const saveError = await saveMealPlan(supabase, user.id, targets, result.data);
      if (saveError) {
        return { error: "Plano gerado, mas houve um erro ao salvar. Tente novamente." };
      }

      revalidatePath("/plano-alimentar");
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
    generation_type: "meal_plan",
    prompt: promptInput,
    raw_response: safeJson(lastRaw),
    status: "invalid",
    error_message: lastError,
  });

  return { error: GENERIC_ERROR };
}

async function saveMealPlan(
  supabase: SupabaseClient,
  userId: string,
  targets: NutritionTargets,
  data: MealPlanResponse
): Promise<string | null> {
  const { data: existingActive } = await supabase
    .from("meal_plans")
    .select("id, week")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  const nextWeek = existingActive ? existingActive.week + 1 : 1;

  const { data: planRow, error: planError } = await supabase
    .from("meal_plans")
    .insert({
      user_id: userId,
      week: nextWeek,
      daily_calories: targets.dailyCalories,
      protein_target: targets.proteinGrams,
      carb_target: targets.carbGrams,
      fat_target: targets.fatGrams,
      status: "active",
    })
    .select("id")
    .single();

  if (planError || !planRow) {
    return planError?.message ?? "Erro desconhecido ao criar o plano.";
  }

  const mealRows = data.meals.flatMap((meal) =>
    meal.items.map((item) => ({
      meal_plan_id: planRow.id,
      meal_type: meal.mealType,
      food: item.food,
      quantity: item.quantity,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      alternatives: item.alternatives,
    }))
  );

  const { error: mealsError } = await supabase.from("meal_plan_meals").insert(mealRows);

  if (mealsError) {
    // Plano ficou incompleto (sem refeições) — remove para não deixar lixo.
    await supabase.from("meal_plans").delete().eq("id", planRow.id);
    return mealsError.message;
  }

  // Só arquiva o plano anterior depois que o novo foi salvo com sucesso.
  if (existingActive) {
    await supabase.from("meal_plans").update({ status: "archived" }).eq("id", existingActive.id);
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
