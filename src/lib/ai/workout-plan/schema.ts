import { z } from "zod";

export const exerciseItemSchema = z.object({
  exercise: z.string().min(1),
  sets: z.number().int().positive(),
  reps: z.string().min(1),
  restSeconds: z.number().int().nonnegative(),
  estimatedDurationMinutes: z.number().int().positive(),
  guidance: z.string().default(""),
});

export const workoutDaySchema = z.object({
  day: z.number().int().min(1).max(7),
  muscleGroup: z.string().min(1),
  exercises: z.array(exerciseItemSchema).min(1),
});

// Estrutura esperada da resposta da IA (spec seção 13/14).
export const workoutPlanResponseSchema = z.object({
  days: z.array(workoutDaySchema).min(1),
});

export type WorkoutPlanResponse = z.infer<typeof workoutPlanResponseSchema>;
export type ExerciseItem = z.infer<typeof exerciseItemSchema>;

// JSON Schema equivalente para forçar resposta estruturada via tool use.
export const workoutPlanToolInputSchema = {
  type: "object",
  properties: {
    days: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        properties: {
          day: { type: "integer", minimum: 1, maximum: 7 },
          muscleGroup: { type: "string" },
          exercises: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              properties: {
                exercise: { type: "string" },
                sets: { type: "integer" },
                reps: { type: "string" },
                restSeconds: { type: "integer" },
                estimatedDurationMinutes: { type: "integer" },
                guidance: { type: "string" },
              },
              required: ["exercise", "sets", "reps", "restSeconds", "estimatedDurationMinutes"],
            },
          },
        },
        required: ["day", "muscleGroup", "exercises"],
      },
    },
  },
  required: ["days"],
} as const;
