import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, CLAUDE_MODEL } from "@/lib/ai/client";
import type { NutritionTargets } from "@/lib/calculations/nutrition";
import { buildMealPlanSystemPrompt, buildMealPlanUserPrompt, type MealPlanPromptInput } from "./prompt";
import { mealPlanResponseSchema, mealPlanToolInputSchema, type MealPlanResponse } from "./schema";

const MEAL_PLAN_TOOL_NAME = "submit_meal_plan";

// Quanto o total do cardápio pode se desviar da meta calculada pelo sistema
// antes de considerarmos a resposta da IA inválida (spec seção 9/14).
// 20% é o piso realista para um LLM acertar montando cardápios com
// alimentos reais (testado empiricamente: 15% gerava falsos negativos
// mesmo após retry com feedback do erro anterior).
const MACRO_TOLERANCE = 0.2;

export type GenerateMealPlanResult =
  | { success: true; data: MealPlanResponse; raw: unknown }
  | { success: false; error: string; raw: unknown };

function sumMacros(data: MealPlanResponse) {
  return data.meals
    .flatMap((meal) => meal.items)
    .reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
}

function withinTolerance(actual: number, target: number, tolerance: number): boolean {
  if (target === 0) return actual === 0;
  return Math.abs(actual - target) / target <= tolerance;
}

/**
 * Valida a resposta já parseada contra as metas calculadas pelo sistema.
 * Mesmo com o schema estrutural correto, uma resposta cujos totais fujam
 * muito da meta calórica/macros é tratada como inválida — a IA nunca
 * substitui os cálculos do sistema (spec seção 9).
 */
function validateAgainstTargets(data: MealPlanResponse, targets: NutritionTargets): string | null {
  const totals = sumMacros(data);

  if (!withinTolerance(totals.calories, targets.dailyCalories, MACRO_TOLERANCE)) {
    return `Total de calorias do plano (${totals.calories}) fora da tolerância da meta (${targets.dailyCalories}).`;
  }
  if (!withinTolerance(totals.protein, targets.proteinGrams, MACRO_TOLERANCE)) {
    return `Total de proteína do plano (${totals.protein}g) fora da tolerância da meta (${targets.proteinGrams}g).`;
  }
  if (!withinTolerance(totals.carbs, targets.carbGrams, MACRO_TOLERANCE)) {
    return `Total de carboidratos do plano (${totals.carbs}g) fora da tolerância da meta (${targets.carbGrams}g).`;
  }
  if (!withinTolerance(totals.fat, targets.fatGrams, MACRO_TOLERANCE)) {
    return `Total de gordura do plano (${totals.fat}g) fora da tolerância da meta (${targets.fatGrams}g).`;
  }

  return null;
}

/**
 * Faz UMA tentativa de geração via IA: chama o modelo, valida a estrutura
 * (Zod) e depois valida contra as metas calculadas. Nunca lança — sempre
 * retorna um resultado tipado para o chamador decidir sobre retry/log.
 */
export async function generateMealPlanFromClaude(
  input: MealPlanPromptInput,
  previousError?: string
): Promise<GenerateMealPlanResult> {
  const client = getAnthropicClient();

  let response: Anthropic.Message;
  try {
    response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      stream: false,
      system: buildMealPlanSystemPrompt(),
      messages: [{ role: "user", content: buildMealPlanUserPrompt(input, previousError) }],
      tools: [
        {
          name: MEAL_PLAN_TOOL_NAME,
          description: "Envia o cardápio diário gerado, estruturado por refeição.",
          input_schema: mealPlanToolInputSchema as unknown as Anthropic.Tool.InputSchema,
        },
      ],
      tool_choice: { type: "tool", name: MEAL_PLAN_TOOL_NAME },
    });
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao chamar a API de IA.",
      raw: null,
    };
  }

  const toolUseBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );

  if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
    return { success: false, error: "A IA não retornou uma resposta estruturada.", raw: response };
  }

  const parsed = mealPlanResponseSchema.safeParse(toolUseBlock.input);
  if (!parsed.success) {
    return {
      success: false,
      error: `Resposta da IA não segue o formato esperado: ${parsed.error.issues[0]?.message ?? "erro de validação"}.`,
      raw: response,
    };
  }

  const businessError = validateAgainstTargets(parsed.data, input.targets);
  if (businessError) {
    return { success: false, error: businessError, raw: response };
  }

  return { success: true, data: parsed.data, raw: response };
}
