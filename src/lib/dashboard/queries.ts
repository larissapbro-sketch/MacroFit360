import { createClient } from "@/lib/db/supabase-server";

export interface WeekWorkoutAdherence {
  week: number;
  completedSessions: number;
  totalSessions: number;
  adherencePercent: number;
}

export interface WeekMealTargets {
  week: number;
  dailyCalories: number;
  proteinTarget: number;
}

export interface WeeklyComparison {
  currentWorkout: WeekWorkoutAdherence | null;
  previousWorkout: WeekWorkoutAdherence | null;
  currentMeal: WeekMealTargets | null;
  previousMeal: WeekMealTargets | null;
}

/**
 * Compara a semana de treino/dieta atual com a anterior (spec seção 17 —
 * "Comparativo semanal"). Usa os planos mais recentes por número de
 * semana, não datas corridas, já que semanas nascem quando o usuário
 * gera um novo plano.
 */
export async function getWeeklyComparison(): Promise<WeeklyComparison> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { currentWorkout: null, previousWorkout: null, currentMeal: null, previousMeal: null };
  }

  const { data: workoutPlans } = await supabase
    .from("workout_plans")
    .select("id, week")
    .eq("user_id", user.id)
    .order("week", { ascending: false })
    .limit(2);

  const workoutWeeks: WeekWorkoutAdherence[] = [];
  for (const plan of workoutPlans ?? []) {
    const { data: sessions } = await supabase
      .from("workout_sessions")
      .select("completed")
      .eq("workout_plan_id", plan.id);

    const total = sessions?.length ?? 0;
    const completed = sessions?.filter((s) => s.completed).length ?? 0;

    workoutWeeks.push({
      week: plan.week,
      completedSessions: completed,
      totalSessions: total,
      adherencePercent: total > 0 ? Math.round((completed / total) * 100) : 0,
    });
  }

  const { data: mealPlans } = await supabase
    .from("meal_plans")
    .select("week, daily_calories, protein_target")
    .eq("user_id", user.id)
    .order("week", { ascending: false })
    .limit(2);

  const mealWeeks: WeekMealTargets[] = (mealPlans ?? []).map((p) => ({
    week: p.week,
    dailyCalories: p.daily_calories,
    proteinTarget: Number(p.protein_target),
  }));

  return {
    currentWorkout: workoutWeeks[0] ?? null,
    previousWorkout: workoutWeeks[1] ?? null,
    currentMeal: mealWeeks[0] ?? null,
    previousMeal: mealWeeks[1] ?? null,
  };
}
