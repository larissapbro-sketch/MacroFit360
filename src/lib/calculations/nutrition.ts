import type { Goal, Sex } from "@/lib/profile/schema";

export interface NutritionTargets {
  /** Taxa Metabólica Basal (Mifflin-St Jeor), em kcal/dia. */
  bmr: number;
  /** Gasto calórico total estimado (TMB × fator de atividade), em kcal/dia. */
  tdee: number;
  /** Meta calórica diária final, já ajustada pelo objetivo. */
  dailyCalories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
}

export interface NutritionTargetsInput {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
  goal: Goal;
  trainingDaysPerWeek: number;
}

// Fator de atividade (Harris-Benedict/PAL) conforme dias de treino por semana.
const ACTIVITY_MULTIPLIER_BY_TRAINING_DAYS: Record<number, number> = {
  0: 1.2, // sedentário
  1: 1.375,
  2: 1.375, // levemente ativo
  3: 1.55,
  4: 1.55, // moderadamente ativo
  5: 1.725,
  6: 1.725, // muito ativo
  7: 1.9, // extremamente ativo
};

// Ajuste calórico sobre o TDEE conforme objetivo do usuário.
const GOAL_CALORIE_FACTOR: Record<Goal, number> = {
  hipertrofia: 1.1, // superávit moderado
  definicao: 0.85, // déficit moderado, preservando massa magra
  perda_de_gordura: 0.8, // déficit mais agressivo
};

// Proteína por kg de peso corporal — mais alta em déficit, para preservar massa magra.
const GOAL_PROTEIN_G_PER_KG: Record<Goal, number> = {
  hipertrofia: 2.0,
  definicao: 2.2,
  perda_de_gordura: 2.4,
};

const FAT_PERCENT_OF_CALORIES = 0.25;

function calculateBMR({
  weightKg,
  heightCm,
  age,
  sex,
}: Pick<NutritionTargetsInput, "weightKg" | "heightCm" | "age" | "sex">): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "masculino" ? base + 5 : base - 161;
}

/**
 * Calcula TMB, gasto calórico total e metas de macros — camada 100%
 * determinística, sem IA (spec seção 9). Esses valores são o teto/piso
 * que o IA Planner deve respeitar ao montar o cardápio.
 */
export function calculateNutritionTargets(input: NutritionTargetsInput): NutritionTargets {
  const bmr = calculateBMR(input);

  const clampedTrainingDays = Math.min(Math.max(Math.round(input.trainingDaysPerWeek), 0), 7);
  const activityMultiplier = ACTIVITY_MULTIPLIER_BY_TRAINING_DAYS[clampedTrainingDays];
  const tdee = bmr * activityMultiplier;

  const dailyCalories = Math.round(tdee * GOAL_CALORIE_FACTOR[input.goal]);

  const proteinGrams = Math.round(input.weightKg * GOAL_PROTEIN_G_PER_KG[input.goal]);
  const proteinCalories = proteinGrams * 4;

  const fatCalories = dailyCalories * FAT_PERCENT_OF_CALORIES;
  const fatGrams = Math.round(fatCalories / 9);

  const remainingCalories = Math.max(dailyCalories - proteinCalories - fatGrams * 9, 0);
  const carbGrams = Math.round(remainingCalories / 4);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    dailyCalories,
    proteinGrams,
    carbGrams,
    fatGrams,
  };
}
