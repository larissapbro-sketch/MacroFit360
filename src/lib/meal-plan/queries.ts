import { createClient } from "@/lib/db/supabase-server";

export interface MealPlanMeal {
  id: string;
  mealType: string;
  food: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  alternatives: string[];
}

export interface MealPlanWithMeals {
  id: string;
  week: number;
  dailyCalories: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  meals: MealPlanMeal[];
}

/**
 * Retorna o plano alimentar ativo do usuário autenticado, com as refeições
 * já carregadas. Null se ele nunca gerou um plano.
 */
export async function getActiveMealPlan(): Promise<MealPlanWithMeals | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id, week, daily_calories, protein_target, carb_target, fat_target")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!plan) return null;

  const { data: meals } = await supabase
    .from("meal_plan_meals")
    .select("id, meal_type, food, quantity, calories, protein, carbs, fat, alternatives")
    .eq("meal_plan_id", plan.id);

  return {
    id: plan.id,
    week: plan.week,
    dailyCalories: plan.daily_calories,
    proteinTarget: Number(plan.protein_target),
    carbTarget: Number(plan.carb_target),
    fatTarget: Number(plan.fat_target),
    meals: (meals ?? []).map((m) => ({
      id: m.id,
      mealType: m.meal_type,
      food: m.food,
      quantity: m.quantity,
      calories: Number(m.calories),
      protein: Number(m.protein),
      carbs: Number(m.carbs),
      fat: Number(m.fat),
      alternatives: (m.alternatives ?? []) as string[],
    })),
  };
}
