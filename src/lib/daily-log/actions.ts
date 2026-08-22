"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db/supabase-server";
import { getActiveMealPlan } from "@/lib/meal-plan/queries";
import { notifyNutritionMilestone } from "@/lib/notifications/triggers";

export interface LogActionResult {
  error?: string;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Diário alimentar: soma um item do cardápio ao consumo real de hoje
 * (upsert incremental em daily_logs). O item precisa pertencer a um
 * plano do próprio usuário — a leitura já é filtrada por RLS.
 */
export async function logMealItemAction(itemId: string): Promise<LogActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Você precisa estar logado." };
  }

  const { data: item, error: itemError } = await supabase
    .from("meal_plan_meals")
    .select("calories, protein, carbs, fat")
    .eq("id", itemId)
    .maybeSingle();

  if (itemError || !item) {
    return { error: "Item não encontrado." };
  }

  const today = todayIso();

  const { data: existing } = await supabase
    .from("daily_logs")
    .select("calories, protein, carbs, fat")
    .eq("user_id", user.id)
    .eq("log_date", today)
    .maybeSingle();

  const nextTotals = {
    calories: Number(existing?.calories ?? 0) + Number(item.calories),
    protein: Number(existing?.protein ?? 0) + Number(item.protein),
    carbs: Number(existing?.carbs ?? 0) + Number(item.carbs),
    fat: Number(existing?.fat ?? 0) + Number(item.fat),
  };

  const { error: upsertError } = await supabase.from("daily_logs").upsert(
    {
      user_id: user.id,
      log_date: today,
      ...nextTotals,
    },
    { onConflict: "user_id,log_date" }
  );

  if (upsertError) {
    return { error: "Não foi possível registrar. Tente novamente." };
  }

  const activePlan = await getActiveMealPlan();
  if (activePlan) {
    await notifyNutritionMilestone(supabase, user.id, nextTotals.protein, activePlan.proteinTarget);
  }

  revalidatePath("/plano-alimentar");
  revalidatePath("/dashboard");
  return {};
}

/** Zera o registro de hoje (para corrigir um lançamento errado). */
export async function resetTodayLogAction(): Promise<LogActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Você precisa estar logado." };
  }

  const { error } = await supabase
    .from("daily_logs")
    .delete()
    .eq("user_id", user.id)
    .eq("log_date", todayIso());

  if (error) {
    return { error: "Não foi possível zerar o registro. Tente novamente." };
  }

  revalidatePath("/plano-alimentar");
  revalidatePath("/dashboard");
  return {};
}
