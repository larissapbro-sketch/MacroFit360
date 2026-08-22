import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, CLAUDE_MODEL } from "@/lib/ai/client";
import {
  buildSubstitutionSystemPrompt,
  buildSubstitutionUserPrompt,
  type SubstitutionPromptInput,
} from "./prompt";
import {
  substitutionResponseSchema,
  substitutionToolInputSchema,
  type SubstitutionResponse,
} from "./schema";

const SUBSTITUTION_TOOL_NAME = "submit_substitute";
const MACRO_TOLERANCE = 0.2;

export type GenerateSubstitutionResult =
  | { success: true; data: SubstitutionResponse; raw: unknown }
  | { success: false; error: string; raw: unknown };

function withinTolerance(actual: number, target: number, tolerance: number): boolean {
  if (target === 0) return actual <= 1;
  return Math.abs(actual - target) / target <= tolerance;
}

function validateAgainstOriginal(
  data: SubstitutionResponse,
  input: SubstitutionPromptInput
): string | null {
  const { substitute } = data;

  if (substitute.food.trim().toLowerCase() === input.currentFood.trim().toLowerCase()) {
    return "O substituto sugerido é o mesmo alimento original.";
  }
  if (!withinTolerance(substitute.calories, input.currentCalories, MACRO_TOLERANCE)) {
    return `Calorias do substituto (${substitute.calories}) fora da tolerância do item original (${input.currentCalories}).`;
  }
  if (!withinTolerance(substitute.protein, input.currentProtein, MACRO_TOLERANCE)) {
    return `Proteína do substituto (${substitute.protein}g) fora da tolerância do item original (${input.currentProtein}g).`;
  }
  if (!withinTolerance(substitute.carbs, input.currentCarbs, MACRO_TOLERANCE)) {
    return `Carboidratos do substituto (${substitute.carbs}g) fora da tolerância do item original (${input.currentCarbs}g).`;
  }
  if (!withinTolerance(substitute.fat, input.currentFat, MACRO_TOLERANCE)) {
    return `Gordura do substituto (${substitute.fat}g) fora da tolerância do item original (${input.currentFat}g).`;
  }

  return null;
}

export async function generateSubstitutionFromClaude(
  input: SubstitutionPromptInput,
  previousError?: string
): Promise<GenerateSubstitutionResult> {
  const client = getAnthropicClient();

  const userPrompt = previousError
    ? `${buildSubstitutionUserPrompt(input)}\n\nATENÇÃO: uma tentativa anterior foi rejeitada: "${previousError}". Corrija isso.`
    : buildSubstitutionUserPrompt(input);

  let response: Anthropic.Message;
  try {
    response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      stream: false,
      system: buildSubstitutionSystemPrompt(),
      messages: [{ role: "user", content: userPrompt }],
      tools: [
        {
          name: SUBSTITUTION_TOOL_NAME,
          description: "Envia o item substituto gerado.",
          input_schema: substitutionToolInputSchema as unknown as Anthropic.Tool.InputSchema,
        },
      ],
      tool_choice: { type: "tool", name: SUBSTITUTION_TOOL_NAME },
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

  const parsed = substitutionResponseSchema.safeParse(toolUseBlock.input);
  if (!parsed.success) {
    return {
      success: false,
      error: `Resposta da IA não segue o formato esperado: ${parsed.error.issues[0]?.message ?? "erro de validação"}.`,
      raw: response,
    };
  }

  const businessError = validateAgainstOriginal(parsed.data, input);
  if (businessError) {
    return { success: false, error: businessError, raw: response };
  }

  return { success: true, data: parsed.data, raw: response };
}
