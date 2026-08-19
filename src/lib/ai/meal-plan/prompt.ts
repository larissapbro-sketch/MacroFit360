import type { Goal } from "@/lib/profile/schema";
import type { NutritionTargets } from "@/lib/calculations/nutrition";

export interface MealPlanPromptInput {
  goal: Goal;
  weeklyFoodBudget: number;
  targets: NutritionTargets;
}

const GOAL_DESCRIPTIONS: Record<Goal, string> = {
  hipertrofia: "ganho de massa muscular (hipertrofia)",
  definicao: "definição muscular, mantendo massa magra",
  perda_de_gordura: "perda de gordura corporal",
};

export function buildMealPlanSystemPrompt(): string {
  return `Você é o planejador de dietas do app MacroFit 360°. Gere um cardápio diário
realista e variado, usando alimentos comuns e fáceis de encontrar no Brasil.

Regras obrigatórias:
- Respeite ESTRITAMENTE a meta calórica e de macros informadas pelo sistema (tolerância
  máxima de 20% para mais ou para menos). Essas metas já foram calculadas fora da IA e
  não devem ser recalculadas ou ignoradas.
- Distribua as refeições entre: café da manhã, lanche da manhã, almoço, lanche da tarde
  e jantar. Inclua uma refeição "outra" apenas se fizer sentido (ex.: ceia).
- Priorize alimentos de boa relação custo-benefício dentro do orçamento semanal informado
  (exemplos: ovos, arroz, feijão, frango, aveia, banana, batata, sardinha, leite, legumes
  da estação) — sem se limitar apenas a eles.
- Para cada item, sugira de 1 a 2 alternativas nutricionalmente equivalentes (proteína e
  calorias parecidas) que o usuário possa usar como substituição.
- Responda SOMENTE preenchendo a ferramenta fornecida — não escreva texto fora dela.`;
}

export function buildMealPlanUserPrompt(
  { goal, weeklyFoodBudget, targets }: MealPlanPromptInput,
  previousError?: string
): string {
  const retryNote = previousError
    ? `\nATENÇÃO: uma tentativa anterior foi rejeitada pelo seguinte motivo: "${previousError}".
Ajuste as quantidades dos alimentos para corrigir exatamente esse problema, mantendo o
restante do cardápio coerente.\n`
    : "";

  return `Objetivo do usuário: ${GOAL_DESCRIPTIONS[goal]}.
Orçamento semanal para alimentação: R$ ${weeklyFoodBudget.toFixed(2)}.

Metas nutricionais diárias já calculadas pelo sistema (respeite estes valores):
- Calorias: ${targets.dailyCalories} kcal
- Proteína: ${targets.proteinGrams} g
- Carboidratos: ${targets.carbGrams} g
- Gordura: ${targets.fatGrams} g
${retryNote}
Gere o cardápio diário completo.`;
}
