export interface SubstitutionPromptInput {
  currentFood: string;
  currentQuantity: string;
  mealTypeLabel: string;
  currentCalories: number;
  currentProtein: number;
  currentCarbs: number;
  currentFat: number;
  weeklyFoodBudget: number;
  userRequest: string;
}

export function buildSubstitutionSystemPrompt(): string {
  return `Você é o assistente de substituições do app MacroFit 360°. O usuário quer trocar
um alimento específico do cardápio por outro, mantendo o valor nutricional equivalente.

Regras obrigatórias:
- O substituto deve ter calorias, proteína, carboidratos e gordura PARECIDOS com o item
  original (tolerância máxima de 20% para mais ou para menos em cada macro).
- Considere o orçamento semanal informado — priorize alimentos de boa relação custo-benefício.
- Nunca sugira o mesmo alimento que o usuário está tentando substituir.
- Sugira de 1 a 2 alternativas adicionais para esse novo item.
- Responda SOMENTE preenchendo a ferramenta fornecida — não escreva texto fora dela.`;
}

export function buildSubstitutionUserPrompt(input: SubstitutionPromptInput): string {
  return `Refeição: ${input.mealTypeLabel}.
Item atual a substituir: ${input.currentFood} (${input.currentQuantity}).
Valores nutricionais do item atual (o substituto deve ficar perto disso):
- Calorias: ${input.currentCalories} kcal
- Proteína: ${input.currentProtein} g
- Carboidratos: ${input.currentCarbs} g
- Gordura: ${input.currentFat} g

Orçamento semanal do usuário para alimentação: R$ ${input.weeklyFoodBudget.toFixed(2)}.

Pedido do usuário: "${input.userRequest}"

Gere um único item substituto.`;
}
