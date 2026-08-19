import type { Equipment, Goal } from "@/lib/profile/schema";
import { EQUIPMENT_LABELS } from "@/lib/profile/schema";

export interface WorkoutPlanPromptInput {
  goal: Goal;
  trainingDays: number;
  equipment: Equipment[];
  difficulty: "iniciante" | "intermediario" | "avancado";
}

const GOAL_DESCRIPTIONS: Record<Goal, string> = {
  hipertrofia: "ganho de massa muscular (hipertrofia)",
  definicao: "definição muscular, mantendo massa magra",
  perda_de_gordura: "perda de gordura corporal, priorizando gasto calórico",
};

export function buildWorkoutPlanSystemPrompt(): string {
  return `Você é o planejador de treinos do app MacroFit 360°. Monte uma divisão de
treino semanal para academia/casa, adequada ao nível informado.

Regras obrigatórias:
- Gere exatamente UM dia de treino para CADA dia disponível informado pelo usuário,
  numerados sequencialmente a partir de 1 (ex.: se são 4 dias, gere os dias 1, 2, 3 e 4).
- Use APENAS exercícios compatíveis com os equipamentos disponíveis informados. Nunca
  inclua um exercício que exija equipamento que o usuário não tem.
- Adeque volume, séries e repetições ao nível de experiência informado.
- Para cada exercício, informe uma orientação básica curta (ex.: postura, cuidado com
  a lombar, amplitude de movimento).
- Distribua os grupos musculares de forma coerente ao longo da semana, evitando treinar
  o mesmo grupo em dias consecutivos quando possível.
- Responda SOMENTE preenchendo a ferramenta fornecida — não escreva texto fora dela.`;
}

export function buildWorkoutPlanUserPrompt(
  { goal, trainingDays, equipment, difficulty }: WorkoutPlanPromptInput,
  previousError?: string
): string {
  const equipmentLabels = equipment.map((eq) => EQUIPMENT_LABELS[eq]).join(", ");

  const retryNote = previousError
    ? `\nATENÇÃO: uma tentativa anterior foi rejeitada pelo seguinte motivo: "${previousError}".
Corrija exatamente esse problema, mantendo o restante do plano coerente.\n`
    : "";

  return `Objetivo do usuário: ${GOAL_DESCRIPTIONS[goal]}.
Dias disponíveis para treino por semana: ${trainingDays}.
Equipamentos disponíveis: ${equipmentLabels}.
Nível de experiência: ${difficulty}.
${retryNote}
Gere o plano de treino semanal completo, com ${trainingDays} dia(s) de treino.`;
}
