"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { profileSchema } from "./schema";

export interface ProfileActionResult {
  error?: string;
}

/**
 * Cria ou atualiza o perfil do usuário autenticado (onboarding e edição
 * de perfil usam a mesma action — profiles.user_id é UNIQUE, então o
 * upsert cobre os dois casos).
 */
export async function saveProfile(
  _prevState: ProfileActionResult,
  formData: FormData
): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const parsed = profileSchema.safeParse({
    weight: formData.get("weight"),
    height: formData.get("height"),
    age: formData.get("age"),
    sex: formData.get("sex"),
    goal: formData.get("goal"),
    trainingDays: formData.get("trainingDays"),
    equipment: formData.getAll("equipment"),
    weeklyFoodBudget: formData.get("weeklyFoodBudget"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { weight, height, age, sex, goal, trainingDays, equipment, weeklyFoodBudget } =
    parsed.data;

  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      weight,
      height,
      age,
      sex,
      goal,
      training_days: trainingDays,
      equipment,
      weekly_food_budget: weeklyFoodBudget,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return { error: "Não foi possível salvar seu perfil. Tente novamente." };
  }

  redirect("/dashboard");
}
