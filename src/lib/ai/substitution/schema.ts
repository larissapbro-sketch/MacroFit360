import { z } from "zod";

export const substituteItemSchema = z.object({
  food: z.string().min(1),
  quantity: z.string().min(1),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  alternatives: z.array(z.string()).default([]),
});

// Resposta esperada da IA para uma substituição pontual (spec seção 11).
export const substitutionResponseSchema = z.object({
  substitute: substituteItemSchema,
});

export type SubstitutionResponse = z.infer<typeof substitutionResponseSchema>;

export const substitutionToolInputSchema = {
  type: "object",
  properties: {
    substitute: {
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
  required: ["substitute"],
} as const;
