import { createClient } from "@/lib/db/supabase-server";
import type { Equipment, Goal, Sex } from "./schema";

export interface Profile {
  id: string;
  userId: string;
  weight: number;
  height: number;
  age: number;
  sex: Sex;
  goal: Goal;
  trainingDays: number;
  equipment: Equipment[];
  weeklyFoodBudget: number;
}

/**
 * Retorna o perfil do usuário autenticado, ou null se ele ainda não
 * completou o onboarding. Depende da sessão do Supabase (cookies) —
 * só pode ser chamada em Server Components/Actions.
 */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, user_id, weight, height, age, sex, goal, training_days, equipment, weekly_food_budget")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    weight: Number(data.weight),
    height: Number(data.height),
    age: data.age,
    sex: data.sex,
    goal: data.goal,
    trainingDays: data.training_days,
    equipment: (data.equipment ?? []) as Equipment[],
    weeklyFoodBudget: Number(data.weekly_food_budget),
  };
}
