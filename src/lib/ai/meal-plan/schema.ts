import { z } from "zod";

export const MEAL_TYPES = [
  "cafe_da_manha",
  "lanche_manha",
  "almoco",
  "lanche_tarde",
  "jantar",
  "outra",
] as const;

export const MEAL_TYPE_LABELS: Record<(typeof MEAL_TYPES)[number], string> = {
  cafe_da_manha: "Café da manhã",
  lanche_manha: "Lanche da manhã",
  almoco: "Almoço",
  lanche_tarde: "Lanche da tarde",
  jantar: "Jantar",
  outra: "Outra refeição",
};

export const mealItemSchema = z.object({
  food: z.string().min(1),
  quantity: z.string().min(1),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  alternatives: z.array(z.string()).default([]),
});

export const mealSchema = z.object({
  mealType: z.enum(MEAL_TYPES),
  items: z.array(mealItemSchema).min(1),
});

// Estrutura esperada da resposta da IA (spec seção 14 — "estrutura de dados
// previsível"). Qualquer resposta fora deste formato é tratada como inválida.
export const mealPlanResponseSchema = z.object({
  meals: z.array(mealSchema).min(1),
});

export type MealPlanResponse = z.infer<typeof mealPlanResponseSchema>;
export type MealItem = z.infer<typeof mealItemSchema>;

// JSON Schema equivalente, usado para forçar a IA a responder via tool call
// estruturada (Anthropic tool use) em vez de texto livre. `as const` preserva
// os literais ("object", "array"...) — o cast para o tipo da SDK acontece no
// ponto de uso (generate.ts), que também precisa de `required` mutável.
export const mealPlanToolInputSchema = {
  type: "object",
  properties: {
    meals: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        properties: {
          mealType: {
            type: "string",
            enum: [...MEAL_TYPES],
          },
          items: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              properties: {
                food: { type: "string" },
                quantity: { type: "string" },
                calories: { type: "number" },
                protein: { type: "number" },
                carbs: { type: "number" },
                fat: { type: "number" },
                alternatives: { type: "array", items: { type: "string" } },
              },
              required: ["food", "quantity", "calories", "protein", "carbs", "fat"],
            },
          },
        },
        required: ["mealType", "items"],
      },
    },
  },
  required: ["meals"],
} as const;
