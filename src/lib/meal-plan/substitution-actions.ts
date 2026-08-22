"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db/supabase-server";
import { getProfile } from "@/lib/profile/queries";
import { generateSubstitutionFromClaude } from "@/lib/ai/substitution/generate";
import type { SubstitutionPromptInput } from "@/lib/ai/substitution/prompt";

export interface SubstitutionActionResult {
  error?: string;
}

const MAX_ATTEMPTS = 2;

const GENERIC_ERROR = "Não conseguimos gerar uma substituição agora. Tente novamente.";

export interface SubstitutionContext {
  mealTypeLabel: string;
  food: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  alternatives: string[];
}

/**
 * Substituição pontual de um item do cardápio (spec seção 11). Usada com
 * `.bind(null, itemId, context)` no client component, para casar com a
 * assinatura (state, formData) que useActionState exige.
 */
export async function substituteMealItemAction(
  itemId: string,
  context: SubstitutionContext,
  _prevState: SubstitutionActionResult,
  formData: FormData
): Promise<SubstitutionActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Você precisa estar logado." };
  }

  const userRequest = String(formData.get("request") ?? "").trim();
  if (!userRequest) {
    return { error: "Descreva o que você quer substituir (ex.: \"não quero frango hoje\")." };
  }

  const profile = await getProfile();
  if (!profile) {
    return { error: "Complete seu perfil antes de pedir substituições." };
  }

  const promptInput: SubstitutionPromptInput = {
    currentFood: context.food,
    currentQuantity: context.quantity,
    mealTypeLabel: context.mealTypeLabel,
    currentCalories: context.calories,
    currentProtein: context.protein,
    currentCarbs: context.carbs,
    currentFat: context.fat,
    weeklyFoodBudget: profile.weeklyFoodBudget,
    userRequest,
  };

  let lastError = GENERIC_ERROR;
  let lastRaw: unknown = null;
  let previousError: string | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const result = await generateSubstitutionFromClaude(promptInput, previousError);
    lastRaw = result.raw;

    if (result.success) {
      await supabase.from("ai_generations").insert({
        user_id: user.id,
        generation_type: "substitution",
        prompt: { itemId, ...promptInput },
        raw_response: safeJson(result.raw),
        status: "success",
      });

      const { substitute } = result.data;
      const { error: updateError } = await supabase
        .from("meal_plan_meals")
        .update({
          food: substitute.food,
          quantity: substitute.quantity,
          calories: substitute.calories,
          protein: substitute.protein,
          carbs: substitute.carbs,
          fat: substitute.fat,
          alternatives: substitute.alternatives,
        })
        .eq("id", itemId);

      if (updateError) {
        return { error: "Substituição gerada, mas houve um erro ao salvar. Tente novamente." };
      }

      revalidatePath("/plano-alimentar");
      return {};
    }

    lastError = result.error;
    previousError = result.error;
  }

  await supabase.from("ai_generations").insert({
    user_id: user.id,
    generation_type: "substitution",
    prompt: { itemId, ...promptInput },
    raw_response: safeJson(lastRaw),
    status: "invalid",
    error_message: lastError,
  });

  return { error: GENERIC_ERROR };
}

function safeJson(value: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}
