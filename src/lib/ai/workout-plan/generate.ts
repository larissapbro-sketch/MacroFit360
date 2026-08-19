import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, CLAUDE_MODEL } from "@/lib/ai/client";
import {
  buildWorkoutPlanSystemPrompt,
  buildWorkoutPlanUserPrompt,
  type WorkoutPlanPromptInput,
} from "./prompt";
import { workoutPlanResponseSchema, workoutPlanToolInputSchema, type WorkoutPlanResponse } from "./schema";

const WORKOUT_PLAN_TOOL_NAME = "submit_workout_plan";

export type GenerateWorkoutPlanResult =
  | { success: true; data: WorkoutPlanResponse; raw: unknown }
  | { success: false; error: string; raw: unknown };

/**
 * Valida a resposta já parseada contra as regras de negócio que a IA não
 * pode violar: um dia de treino por dia disponível informado, sem repetir
 * nem pular números de dia (spec seção 13: "adaptado aos dias disponíveis").
 */
function validateAgainstAvailability(
  data: WorkoutPlanResponse,
  trainingDays: number
): string | null {
  if (data.days.length !== trainingDays) {
    return `O plano tem ${data.days.length} dia(s) de treino, mas o usuário tem ${trainingDays} dia(s) disponíveis.`;
  }

  const dayNumbers = data.days.map((d) => d.day).sort((a, b) => a - b);
  const expected = Array.from({ length: trainingDays }, (_, i) => i + 1);
  const matchesExpected = dayNumbers.every((day, i) => day === expected[i]);

  if (!matchesExpected) {
    return `Os dias do plano (${dayNumbers.join(", ")}) devem ser numerados sequencialmente de 1 a ${trainingDays}, sem repetir ou pular.`;
  }

  return null;
}

/**
 * Uma tentativa de geração via IA do plano de treino: chama o modelo,
 * valida estrutura (Zod) e depois valida contra a disponibilidade de dias
 * do usuário. Nunca lança — sempre retorna um resultado tipado.
 */
export async function generateWorkoutPlanFromClaude(
  input: WorkoutPlanPromptInput,
  previousError?: string
): Promise<GenerateWorkoutPlanResult> {
  const client = getAnthropicClient();

  let response: Anthropic.Message;
  try {
    response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      stream: false,
      system: buildWorkoutPlanSystemPrompt(),
      messages: [{ role: "user", content: buildWorkoutPlanUserPrompt(input, previousError) }],
      tools: [
        {
          name: WORKOUT_PLAN_TOOL_NAME,
          description: "Envia o plano de treino semanal gerado, estruturado por dia.",
          input_schema: workoutPlanToolInputSchema as unknown as Anthropic.Tool.InputSchema,
        },
      ],
      tool_choice: { type: "tool", name: WORKOUT_PLAN_TOOL_NAME },
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

  const parsed = workoutPlanResponseSchema.safeParse(toolUseBlock.input);
  if (!parsed.success) {
    return {
      success: false,
      error: `Resposta da IA não segue o formato esperado: ${parsed.error.issues[0]?.message ?? "erro de validação"}.`,
      raw: response,
    };
  }

  const businessError = validateAgainstAvailability(parsed.data, input.trainingDays);
  if (businessError) {
    return { success: false, error: businessError, raw: response };
  }

  return { success: true, data: parsed.data, raw: response };
}
